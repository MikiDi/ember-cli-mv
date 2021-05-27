'use strict';

const stringUtils = require('ember-cli-string-utils');

module.exports = {
  componentPathFromProjectPath: function (path) {
    /*
     * Convert a path relative to the project root into a component-path
     * such as the one you'd use for `ember generate component`
     */
    const COMPONENTS = 'components/';
    const compPathIndex = path.indexOf(COMPONENTS);
    if (compPathIndex > -1) {
      return path
        .substring(compPathIndex + COMPONENTS.length)
        .replace('.hbs', '');
    } else {
      throw new Error(
        `The path provided '${path}' doesn't lead to a component`
      );
    }
  },
  componentPathToTag: function (path) {
    return path.split('/').map(stringUtils.classify).join('::');
  },
};
