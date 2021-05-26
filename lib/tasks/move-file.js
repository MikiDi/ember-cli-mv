/*jshint quotmark: false*/

'use strict';

const fs = require('fs-extra');
const childProcess = require('child_process');
const chalk = require('chalk');
const SilentError = require('silent-error');

var Task = require('ember-cli/lib/models/task');

const ensureDirSync = fs.ensureDirSync;

const execSync = childProcess.execSync;

module.exports = Task.extend({
  run: function (options) {
    this.sourcepath = options.args[0];
    this.destpath = options.args[1];
    this.moveInfo = options.moveInfo;
    return this.moveFile(this.sourcepath, this.destpath, options);
  },

  moveFile: function (sourcepath, destpath, options) {
    var ui = this.ui;
    return this.setupForMove(this.moveInfo).then(function () {
      try {
        ui.writeLine(chalk.green(`Moving ${sourcepath} to ${destpath}`));
        if (!options.dryRun) {
          execSync(`git mv ${sourcepath} ${destpath}`);
        } else {
          ui.writeLine(chalk.yellow('Moving dry-run, no files were moved.'));
        }
      } catch (e) {
        throw new SilentError(chalk.red(`git mv error: ${e.message}`));
      }
      return true;
    });
  },

  setupForMove: function (moveInfo) {
    // if dir doesn't exist
    if (!moveInfo.destExists && moveInfo.destDir) {
      // make the directory
      this.ui.writeLine(
        chalk.green(`Creating destination directory: ${moveInfo.destDir}`)
      );
      ensureDirSync(moveInfo.destDir);
    }

    return Promise.resolve();
  },
});
