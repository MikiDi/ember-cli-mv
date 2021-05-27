/*jshint quotmark: false*/

'use strict';

const fs = require('fs');
const chalk = require('chalk');
var path = require('path');

const templateRecast = require('ember-template-recast');

const walkSync = require('walkdir').sync;
const SilentError = require('silent-error');
const debug = require('debug')('ember-cli:mv');

var Task = require('ember-cli/lib/models/task');
var Project = require('ember-cli/lib/models/project');

const filterByExt = require('../utilities/filter-by-ext');
const componentNameUtils = require('../utilities/component-name');

const projectRoot = Project.getProjectRoot();

module.exports = Task.extend({
  run: function (options) {
    var ui = this.ui;
    const appFolder = path.join(projectRoot, 'app');
    var sourcelist = this.getProjectFileList(appFolder);

    var sourcePath = options.srcComponentPath;
    var destPath = options.dstComponentPath;

    var visitOptions = {
      projectRoot: projectRoot,
      sourcePath,
      destPath,
    };

    // var trees = sourcelist.js.map(this.getJSTree).filter(this.filterEmptyTrees);

    var templates = sourcelist
      .map(this.getHbsAst)
      .filter(this.filterEmptyTrees);

    this.visitTemplates(templates, visitOptions).forEach(function (tree) {
      if (tree) {
        const printed = templateRecast.print(tree.ast);
        if (!options.dryRun) {
          fs.writeFileSync(tree.filePath, printed);
        }
        ui.writeLine(chalk.green(`  updating file ${tree.filePath}`));
      }
    });
    if (options.dryRun) {
      ui.writeLine(chalk.yellow('Updating dry-run, no files were updated.'));
    }
    return Promise.resolve(true);
  },

  /*
   * Return full list of hbs-files in your project
   */
  getProjectFileList: function (appFolder) {
    const files = walkSync(appFolder).filter(function () {
      return true;
    });
    return filterByExt(files, '.hbs');
  },

  getHbsAst: function (filePath) {
    var source = fs.readFileSync(filePath, 'utf-8');
    // debug(filePath, source);
    try {
      return {
        filePath: filePath,
        source: templateRecast.parse(source),
      };
    } catch (e) {
      throw new SilentError(`${filePath} template recast error: `, e);
    }
  },

  filterEmptyTrees: function (source) {
    return typeof source !== 'undefined';
  },

  transformComponentName: function(fileInfo, config, invokableData) {
    let { builders: b } = fileInfo.syntax;
    const sourceTag = componentNameUtils.componentPathToTag(config.sourcePath);
    const destTag = componentNameUtils.componentPathToTag(config.destPath);
    return {
      ElementNode(node) {
        if (node.tag === sourceTag) {
          debug('Found tag to replace', sourceTag);
          debug('destTag', destTag);
          return b.element(
            {
              name: destTag,
              selfClosing: node.selfClosing,
            },
            {
              attrs: node.attributes,
              modifiers: node.modifiers,
              children: node.children,
              comments: node.comments,
              blockParams: node.blockParams,
              loc: node.loc,
            }
          );
        }
      },
    };
  },

  visitTemplates: function (trees, options) {
    const componentNameTransform = this.transformComponentName;
    return trees.map(function (tree) {
      const stringSourceBeforeTransform = templateRecast.print(tree.source);
      const transformedSource = templateRecast.transform(
        tree.source,
        function (fileInfo, config, invokableData) {
          config = config || {};
          config.sourcePath = options.sourcePath;
          config.destPath = options.destPath;
          return componentNameTransform(fileInfo, config, invokableData);
        }
      );
      if (
        stringSourceBeforeTransform !==
        templateRecast.print(transformedSource.ast)
      ) {
        return {
          ast: transformedSource.ast,
          filePath: tree.filePath,
          options: options,
        };
      }
    });
  },
});
