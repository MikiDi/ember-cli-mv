/*jshint quotmark: false*/

'use strict';

const fs = require('fs');
const chalk = require('chalk');
var path = require('path');

const recast = require('recast');
// let BabelParser = require('@babel/parser');

const walkSync = require('walkdir').sync;
const SilentError = require('silent-error');
const debug = require('debug')('ember-cli:mv');

var Task = require('ember-cli/lib/models/task');
var Project = require('ember-cli/lib/models/project');

const filterByExt = require('../utilities/filter-by-ext');
const constructModuleImportPath = require('../utilities/module-import-path');

const projectRoot = Project.getProjectRoot();

module.exports = Task.extend({
  run: function (options) {
    var ui = this.ui;
    const appFolder = path.join(projectRoot, 'app');
    var sourcelist = this.getProjectFileList(appFolder);
    // TODO: join app?

    var sourcePath = options.projRelSrcPath;
    var destPath = options.projRelDstPath;

    var modulePrefix = this.project.config().modulePrefix || '';
    var podModulePrefix = this.project.config().podModulePrefix || '';

    var sourceModuleImportPath = constructModuleImportPath(
      options.moduleType,
      options.moduleSrcPath,
      {
        modulePrefix,
        usePods: options.usePods,
        podModulePrefix,
        componentStructure: options.componentStructure,
      }
    );
    var destModuleImportPath = constructModuleImportPath(
      options.moduleType,
      options.moduleDstPath,
      {
        modulePrefix,
        usePods: options.usePods,
        podModulePrefix,
        componentStructure: options.componentStructure,
      }
    );

    // console.log(sourceType, sourceStructure, sourceModuleImportPath);
    // console.log(destType, destStructure, destModuleImportPath);
    var visitOptions = {
      projectRoot: projectRoot,
      source: sourcePath,
      dest: destPath,
      sourceModuleImportPath: sourceModuleImportPath,
      destModuleImportPath: destModuleImportPath,
    };

    debug(`Going to look for import path ${sourceModuleImportPath}`);

    const trees = sourcelist.map(this.getJSTree).filter(this.filterEmptyTrees);

    this.visitProjectTrees(trees, visitOptions).forEach(function (tree) {
      if (tree) {
        var printed = recast.print(tree.ast).code;
        if (!options.dryRun) {
          fs.writeFileSync(tree.dest, printed);
        }
        ui.writeLine(chalk.green(`  updating file ${tree.dest}`));
      }
    });

    if (options.dryRun) {
      ui.writeLine(chalk.yellow('Updating dry-run, no files were updated.'));
    }
    return Promise.resolve(true);
  },

  /*
   * Return full list of files in your project
   */
  getProjectFileList: function (root) {
    var files;
    var ignored = [
      'node_modules/',
      'bower_components/',
      'dist/',
      'tmp/',
      'blueprints/',
    ];
    files = walkSync(root).filter(function (file) {
      return !ignored
        .map(function (i) {
          return file.indexOf(i) !== -1;
        })
        .reduce(function (total, value) {
          // if we have a true value, then don't include
          return total ? total : value ? value : total;
        });
    });
    return filterByExt(files, '.js');
  },

  getJSTree: function (filePath) {
    var source = fs.readFileSync(filePath, 'utf-8');
    // debug(filePath, source);
    try {
      return {
        filePath: filePath,
        source: recast.parse(source, {
          parser: require('recast/parsers/babel'),
        }),
      };
    } catch (e) {
      throw new SilentError(`${filePath} recast error: `, e);
    }
  },

  filterEmptyTrees: function (source) {
    return typeof source !== 'undefined';
  },

  visitProjectTrees: function (trees, options) {
    return trees.map(function (tree) {
      let hasSourceRef = false;
      recast.visit(tree, {
        visitLiteral: function (path) {
          const node = path.node;
          if (typeof node.value === 'string') {
            if (node.value === options.sourceModuleImportPath) {
              hasSourceRef = true;
              debug(node);
              debug(
                `Found absolute import path '${options.sourceModuleImportPath}' in '${node.value}'`
              );
              node.value = options.destModuleImportPath;
              // node.singleQuote = true
            }
          }
          this.traverse(path);
        },
        // TODO: replace class name
        // visitIdentifier: function (path) {
        // },
      });
      if (hasSourceRef) {
        return { ast: tree.source, dest: tree.filePath, options: options };
      }
      return;
    });
  },
});
