'use strict';

const path = require('path');
const inflector = require('inflection');

module.exports = function detectModuleName(moduleType, modulePath, options) {
  /* options
  usePods,
  modulePrefix,
  podModulePrefix,
  componentStructure
  */
  const prefix = options.usePods
    ? options.podModulePrefix
    : options.modulePrefix;
  const typeSegment = inflector.pluralize(moduleType);
  if (moduleType === 'component') {
    if (options.componentStructure === 'flat') {
      return path.join(prefix, typeSegment, modulePath);
    } else {
      throw new Error("Other component structures than 'flat' currently aren't supported")
    }
  } else {
    return path.join(prefix, typeSegment, modulePath);
  }
};
