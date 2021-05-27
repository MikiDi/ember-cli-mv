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
  componentPathToFsComponentPath: function (path, options) {
    /*
     * Convert a path such as the one you'd use for `ember generate component`
     * to file-system paths relative to the components-folder for both a
     * hbs-file and a js-file
     */
    let componentPath;
    if (options.componentStructure === 'flat') {
      componentPath = path;
    } else {
      throw new Error(
        "Other component structures than flat currently aren't supported"
      );
    }
    return {
      js: `${componentPath}.js`,
      hbs: `${componentPath}.hbs`,
    };
  },
  componentPathToTag: function (path) {
    return path.split('/').map(stringUtils.classify).join('::');
  },
};
