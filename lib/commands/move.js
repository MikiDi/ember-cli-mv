'use strict';

var path = require('path');

const chalk = require('chalk');
const merge = require('lodash.merge');
const debug = require('debug')('ember-cli:mv');
const inflector = require('inflection');

const VerifyFile = require('../tasks/verify-file');
const MoveFile = require('../tasks/move-file');
const UpdateImportPaths = require('../tasks/update-import-paths');
const UpdateComponentInvocations = require('../tasks/update-component-invocations');

const componentUtils = require('../utilities/component-name');

const SUP_MODULE_TYPES = ['component'];

module.exports = {
  name: 'move',
  description:
    'Moves files in an ember-cli project and updates path references.',
  aliases: ['mv'],
  works: 'insideProject',
  availableOptions: [
    { name: 'dry-run', type: Boolean, default: false, aliases: ['d'] },
    { name: 'verbose', type: Boolean, default: false, aliases: ['v'] },
    { name: 'force', type: Boolean, default: false, aliases: ['f'] },
    { name: 'component-structure', type: String, default: 'flat' },
  ],
  anonymousOptions: ['<module-type>', '<source>', '<destination>'],

  run: async function (commandOptions, rawArgs) {
    var taskObject = {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      testing: this.testing,
      settings: this.settings,
    };

    const moduleType = rawArgs[0];
    const moduleSrcPath = rawArgs[1];
    const moduleDstPath = rawArgs[2];

    if (!SUP_MODULE_TYPES.includes(moduleType)) {
      this.ui.writeLine(
        chalk.red(
          `The supplied argument for <module-type>, '${moduleType}' Currently isn't supported.\n` +
            `Supported values are: ${SUP_MODULE_TYPES.join('\n  -')}`
        )
      );
      return;
    }

    try {
      let prefix;
      if (commandOptions.usePods) {
        prefix = `app/pods/${inflector.pluralize(moduleType)}`;
      } else {
        prefix = `app/${inflector.pluralize(moduleType)}`;
      }

      if (moduleType === 'component') {
        const srcComponentPaths = componentUtils.componentPathToFsComponentPath(
          moduleSrcPath,
          {
            componentStructure: commandOptions.componentStructure,
          }
        );
        const srcProjectPaths = {
          js: path.join(prefix, srcComponentPaths.js),
          hbs: path.join(prefix, srcComponentPaths.hbs),
        };

        const dstComponentPaths = componentUtils.componentPathToFsComponentPath(
          moduleDstPath,
          {
            componentStructure: commandOptions.componentStructure,
          }
        );
        const dstProjectPaths = {
          js: path.join(prefix, dstComponentPaths.js),
          hbs: path.join(prefix, dstComponentPaths.hbs),
        };

        const verifyTask = new VerifyFile(taskObject);
        const moveTask = new MoveFile(taskObject);
        const taskArgs = {
          ui: this.ui,
          project: this.project,
          moduleType,
        };

        let taskOptions = merge(taskArgs, commandOptions || {});
        await this.beforeRun(taskOptions);

        // Move component's hbs-file
        taskArgs.projRelSrcPath = srcProjectPaths.hbs;
        taskArgs.projRelDstPath = dstProjectPaths.hbs;

        taskOptions = merge(taskArgs, commandOptions || {});
        taskOptions.moveInfo = await verifyTask.run(taskOptions);

        await moveTask.run(taskOptions);
        await this.afterMove.bind(this, taskOptions);
        this.ui.writeLine(chalk.green('Move was successful!'));

        // If present, move component's js-file
        try {
          taskArgs.projRelSrcPath = srcProjectPaths.js;
          taskArgs.projRelDstPath = dstProjectPaths.js;

          taskOptions = merge(taskArgs, commandOptions || {});
          taskOptions.moveInfo = await verifyTask.run(taskOptions);

          await moveTask.run(taskOptions);
          await this.afterMove.bind(this, taskOptions);
          this.ui.writeLine(chalk.green('Move was successful!'));
        } catch {
          this.ui.writeLine(
            chalk.yellow(
              `No js file found for component ${moduleSrcPath} at ${taskArgs.projRelSrcPath}`
            )
          );
        }

        // const updatePathsTask = new UpdatePaths(taskObject);
        const updateComponentInvocationsTask = new UpdateComponentInvocations(taskObject);
        taskOptions.srcComponentPath = moduleSrcPath;
        taskOptions.dstComponentPath = moduleDstPath;
        await updateComponentInvocationsTask.run(taskOptions);
        this.ui.writeLine(chalk.green('Updated all paths!'));

        const updatePathsTask = new UpdateImportPaths(taskObject);
        taskOptions.moduleSrcPath = moduleSrcPath;
        taskOptions.moduleDstPath = moduleDstPath;
        await updatePathsTask.run(taskOptions);

        await this.afterUpdate.bind(this, taskOptions);
      }


    } catch (e) {
      this.ui.writeLine(chalk.red(`The mv command failed: e.message`));
      throw e;
    }
  },

  beforeMove: function () {},

  afterMove: function () {},

  afterUpdate: function () {},
};
