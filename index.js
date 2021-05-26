'use strict';

module.exports = {
  name: require('./package').name,
  includedCommands: function() {
    return {
      move: require('./lib/commands/move')
    };
  }
};
