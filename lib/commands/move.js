'use strict';

const chalk = require('chalk');
const merge = require('lodash.merge');
const debug = require('debug')('ember-cli:mv');

const VerifyFile = require('../tasks/verify-file');
const MoveFile = require('../tasks/move-file');
const UpdatePaths = require('../tasks/update-paths');

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
  ],
  anonymousOptions: ['<source>', '<destination>'],

  run: async function (commandOptions, rawArgs) {
    var ui = this.ui;
    var taskObject = {
      ui: this.ui,
      analytics: this.analytics,
      project: this.project,
      testing: this.testing,
      settings: this.settings,
    };
    var taskArgs = {
      ui: this.ui,
      project: this.project,
      args: rawArgs,
    };

    var taskOptions = merge(taskArgs, commandOptions || {});
    debug('Moving file: ', rawArgs[0]);

    try {
      await this.beforeRun(taskOptions);

      const verifyTask = new VerifyFile(taskObject);
      const taskResult = await verifyTask.run(taskOptions);
      taskOptions.moveInfo = taskResult;

      const moveTask = new MoveFile(taskObject);
      await moveTask.run(taskOptions);
      await this.afterMove.bind(this, taskOptions);
      ui.writeLine(chalk.green('Move was successful!'));

      const updatePathsTask = new UpdatePaths(taskObject);
      await updatePathsTask.run(taskOptions);
      ui.writeLine(chalk.green('Updated all paths!'));
      await this.afterUpdate.bind(this, taskOptions);
    } catch (e) {
      ui.writeLine(chalk.red(`The mv command failed: e.message`));
      throw e;
    }
  },

  beforeMove: function () {},

  afterMove: function () {},

  afterUpdate: function () {},
};
