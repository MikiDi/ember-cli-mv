/*jshint quotmark: false*/

'use strict';

var fs = require('fs');
var path = require('path');

var chalk = require('chalk');
var childProcess = require('child_process');
var SilentError = require('silent-error');
const debug = require('debug')('ember-cli:mv');
var existsSync = fs.existsSync;

var Task = require('ember-cli/lib/models/task');

var exec = childProcess.exec;
const execSync = childProcess.execSync;

module.exports = Task.extend({
  createDestDir: false,
  run: async function (options) {
    var sourcePath = options.projRelSrcPath;
    var destPath = options.projRelDstPath;

    const sourceFileExists = this.verifySourceFile.bind(this, sourcePath)();
    const destFolderExists = this.verifyDestFolder.bind(this, destPath)();
    const destFileExists = this.verifyDestFile.bind(this, destPath)();
    debug(destPath, 'exists', destFileExists);
    const sourceIsCheckedIn = await this.checkSourceGit(sourcePath, true);

    if (!sourceIsCheckedIn) {
      if (options.force) {
        this.ui.writeLine(
          chalk.yellow(
            `The file: ${sourcePath} is not under version control.`
          )
        );
        this.ui.writeLine(
          chalk.yellow(
            `The force option was used. Adding file ${sourcePath} to git.`
          )
        );
        await this.addToGit.bind(this, sourcePath);
      } else {
        await this.promptToAddGit.bind(this, sourcePath);
      }
    }
    if (!options.force && destFileExists) {
      throw new SilentError(
        `The destination: ${destPath} already exists. Cannot execute git mv.`
      );
    } else {

    }

    return {
      sourceFileExists,
      destFolderExists,
      destFileExists,
      sourceIsCheckedIn,
    };
  },

  verifyDestFolder: function (destPath) {
    const dirpath = path.dirname(destPath);
    const stats = fs.lstatSync(dirpath);
    const exists = stats.isDirectory();
    return exists;
  },

  checkGitSupport: function () {
    // verify project is versioned
    var gitCheck;
    try {
      gitCheck = execSync('git rev-parse --is-inside-work-tree', {
        encoding: 'utf8',
      });
    } catch (e) {
      this.ui.writeLine(
        'This project is not versioned under git.' +
          ' Currently the `ember mv` command requires git.',
        'WARNING'
      );
    }
    // TODO: verify git version supports mv and ls-files
    return !!gitCheck;
  },

  checkSourceGit: function (sourcePath, silent) {
    // console.log(sourcePath, fs.existsSync(sourcePath));
    var ui = this.ui;

    return new Promise((resolve) => {
      exec(
        'git ls-files --error-unmatch ' + sourcePath,
        { encoding: 'utf8' },
        (error) => {
          if (error) {
            if (!silent) {
              var warning = `The file : ${sourcePath} is not versioned under git. Currently the \`ember mv\` command requires git.`;
              ui.writeLine(chalk.yellow(warning));
            }
            resolve(false);
          }
          resolve(true);
        }
      );
    });
  },

  promptToAddGit: function (filePath) {
    var ui = this.ui;
    var promptOptions = {
      type: 'expand',
      name: 'answer',
      default: false,
      message: 'Add ' + filePath + ' to git?',
      choices: [
        { key: 'y', name: 'Yes, add', value: 'add' },
        { key: 'n', name: 'No, skip', value: 'skip' },
      ],
    };

    return ui.prompt(promptOptions).then(
      function (response) {
        if (response.answer === 'add') {
          return this.addToGit(filePath);
        }
        var warning = `The file : ${filePath} is not versioned under git. Currently the \`ember mv\` command requires git.`;
        ui.writeLine(chalk.yellow(warning));
        return false;
      }.bind(this)
    );
  },

  addToGit: function (filePath) {
    return new Promise((resolve, reject) => {
      exec(`git add ${filePath}`, { encoding: 'utf8' }, (error) => {
        if (error) {
          reject(error);
        }
        resolve();
      });
    });
  },

  verifyDestFile: function (destPath) {
    const exists = existsSync(destPath);
    var warning = `File '${destPath}' already exists`;
    this.ui.writeLine(chalk.yellow(warning));
    return exists;
  },

  verifySourceFile: function (sourcePath) {
    var exists = existsSync(sourcePath);
    if (!exists) {
      throw new SilentError(`The source path: ${sourcePath} does not exist.`);
    }
    return exists;
  },
});
