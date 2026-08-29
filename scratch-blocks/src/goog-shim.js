/**
 * Minimal goog module system shim for Vite
 * Replaces Google Closure Library's goog.provide/goog.require
 */

const registry = {};
let currentModule = null;

// Export the goog module system
window.goog = window.goog || {};

window.goog.provide = function(name) {
  const parts = name.split('.');
  let obj = window;
  for (const part of parts) {
    if (!(part in obj)) {
      obj[part] = {};
    }
    obj = obj[part];
  }
  // Also register in our local registry
  registry[name] = obj;
  return obj;
};

window.goog.require = function(name) {
  if (!(name in registry)) {
    throw new Error(`goog.require: ${name} not yet provided`);
  }
  return registry[name];
};

// goog.module / goog.exportSymbol support
window.goog.module = function(name) {
  // Stub - not used by scratch-blocks
};

window.goog.exportSymbol = function(publicPath, object) {
  const parts = publicPath.split('.');
  let obj = window;
  for (const part of parts.slice(0, -1)) {
    if (!(part in obj)) {
      obj[part] = {};
    }
    obj = obj[part];
  }
  obj[parts[parts.length - 1]] = object;
};

window.goog.exportProperty = function(object, publicPath, value) {
  object[publicPath] = value;
};

export default window.goog;
