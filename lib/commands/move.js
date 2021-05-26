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

  run: function (commandOptions, rawArgs) {
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
    var verifyTask = new VerifyFile(taskObject);
    var moveTask = new MoveFile(taskObject);
    var updatePathsTask = new UpdatePaths(taskObject);

    var taskOptions = merge(taskArgs, commandOptions || {});
    debug('Moving file: ', rawArgs[0]);

    return Promise.resolve(this.beforeRun(taskOptions))
      .then(function () {
        return verifyTask.run(taskOptions);
      })
      .then(function (result) {
        taskOptions.moveInfo = result;
        return moveTask.run(taskOptions);
      })
      .then(this.afterMove.bind(this, taskOptions))
      .then(function () {
        ui.writeLine(chalk.green('Move was successful!'));
        return updatePathsTask.run(taskOptions);
      })
      .then(function () {
        ui.writeLine(chalk.green('Updated all paths!'));
        return;
      })
      .then(this.afterUpdate.bind(this, taskOptions))
      .catch(function (e) {
        ui.writeLine(chalk.red('The mv command failed: ') + e.message);
        throw e;
        return;
      });
  },

  beforeMove: function () {},

  afterMove: function () {},

  afterUpdate: function () {},
};
