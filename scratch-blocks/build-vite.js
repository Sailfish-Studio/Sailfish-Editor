/**
 * Build scratch-blocks without Closure Compiler
 * Implements minimal goog module system, loads all source files,
 * and outputs a UMD bundle.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Collect all source files that need to be loaded
const coreFiles = readdirSync(resolve(__dirname, 'core'))
  .filter(f => f.endsWith('.js'))
  .map(f => resolve(__dirname, 'core', f));

const blocksVerticalFiles = readdirSync(resolve(__dirname, 'blocks_vertical'))
  .filter(f => f.endsWith('.js'))
  .map(f => resolve(__dirname, 'blocks_vertical', f));

const blocksCommonFiles = readdirSync(resolve(__dirname, 'blocks_common'))
  .filter(f => f.endsWith('.js'))
  .map(f => resolve(__dirname, 'blocks_common', f));

const msgFiles = [
  resolve(__dirname, 'msg/scratch_msgs.js'),
];

// Collect all goog.provides and goog.requires from all files
const allFiles = [...msgFiles, ...coreFiles, ...blocksCommonFiles, ...blocksVerticalFiles];

console.log(`Processing ${allFiles.length} files...`);

// Build a dependency graph from goog.require statements
const provides = new Map(); // name -> file path
const requires = new Map(); // file path -> [names]

for (const file of allFiles) {
  const content = readFileSync(file, 'utf8');
  const provides_ = [];
  const requires_ = [];

  for (const match of content.matchAll(/goog\.provide\(['"]([^'"]+)['"]\)/g)) {
    provides_.push(match[1]);
    provides.set(match[1], file);
  }
  for (const match of content.matchAll(/goog\.require\(['"]([^'"]+)['"]\)/g)) {
    requires_.push(match[1]);
  }
  requires.set(file, requires_);
}

console.log(`Found ${provides.size} provided modules`);

// Topological sort to get correct loading order
const visited = new Set();
const order = [];

function visit(name) {
  if (visited.has(name)) return;
  visited.add(name);

  // Some names like 'goog.array' are provided by Closure Library, not our files
  if (!provides.has(name)) {
    // Provide stubs for Closure Library builtins
    return;
  }

  const file = provides.get(name);
  const deps = requires.get(file) || [];
  for (const dep of deps) {
    visit(dep);
  }

  // Only add file once
  if (!order.includes(file)) {
    order.push(file);
  }
}

// Visit all provided modules
for (const name of provides.keys()) {
  visit(name);
}

console.log(`Sorted ${order.length} files in dependency order`);

// Generate the output bundle
// First: goog shim implementation
const googShim = `
// goog module system shim for Sailfish Studio
var goog = {};
goog.provided_ = {};
goog.provide = function(name) {
  if (!goog.provided_[name]) {
    goog.provided_[name] = true;
    var parts = name.split('.');
    var obj = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (!(part in obj)) {
        obj[part] = {};
      }
      obj = obj[part];
    }
    return obj;
  }
};
goog.require = function(name) {
  if (!goog.provided_[name]) {
    throw new Error('goog.require: ' + name + ' not yet provided');
  }
  var parts = name.split('.');
  var obj = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
  for (var i = 0; i < parts.length; i++) {
    obj = obj[parts[i]];
    if (!obj) break;
  }
  return obj;
};

// Stubs for Closure Library builtins that scratch-blocks uses
goog.array = {
  remove: function(arr, obj) { var i = arr.indexOf(obj); if (i >= 0) arr.splice(i, 1); },
  contains: function(arr, obj) { return arr.indexOf(obj) >= 0; },
  insertAt: function(arr, obj, i) { arr.splice(i, 0, obj); },
  removeAt: function(arr, i) { return arr.splice(i, 1)[0]; },
  clear: function(arr) { arr.length = 0; },
  equals: function(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) { if (a[i] !== b[i]) return false; } return true; },
  clone: function(arr) { return arr.slice(); },
  extend: function(arr1, arr2) { for (var i = 0; i < arr2.length; i++) arr1.push(arr2[i]); return arr1; },
  forEach: function(arr, f, opt_obj) { for (var i = 0; i < arr.length; i++) f.call(opt_obj, arr[i], i, arr); },
  map: function(arr, f, opt_obj) { var res = []; for (var i = 0; i < arr.length; i++) res.push(f.call(opt_obj, arr[i], i, arr)); return res; },
  some: function(arr, f, opt_obj) { for (var i = 0; i < arr.length; i++) if (f.call(opt_obj, arr[i], i, arr)) return true; return false; },
  every: function(arr, f, opt_obj) { for (var i = 0; i < arr.length; i++) if (!f.call(opt_obj, arr[i], i, arr)) return false; return true; },
  find: function(arr, f, opt_obj) { for (var i = 0; i < arr.length; i++) if (f.call(opt_obj, arr[i], i, arr)) return arr[i]; return undefined; },
  findIndex: function(arr, f, opt_obj) { for (var i = 0; i < arr.length; i++) if (f.call(opt_obj, arr[i], i, arr)) return i; return -1; },
  isEmpty: function(arr) { return arr.length === 0; },
  toArray: function(arr) { return Array.prototype.slice.call(arr); },
};
goog.asserts = {
  assert: function(condition, opt_msg) { if (!condition) throw new Error(opt_msg || 'Assertion failed'); },
  assertNumber: function(val) { if (typeof val !== 'number') throw new Error('Expected number'); return val; },
  assertString: function(val) { if (typeof val !== 'string') throw new Error('Expected string'); return val; },
  assertObject: function(val) { if (typeof val !== 'object') throw new Error('Expected object'); return val; },
  assertArray: function(val) { if (!Array.isArray(val)) throw new Error('Expected array'); return val; },
  assertInstanceof: function(val, type, opt_msg) { if (!(val instanceof type)) throw new Error(opt_msg || 'Expected instanceof'); return val; },
  fail: function(opt_msg) { throw new Error(opt_msg || 'Assertion failed'); },
};
goog.math = {
  Coordinate: function(x, y) { this.x = x; this.y = y; },
  Size: function(width, height) { this.width = width; this.height = height; },
  clamp: function(value, min, max) { return Math.min(Math.max(value, min), max); },
  toRadians: function(degrees) { return degrees * Math.PI / 180; },
  toDegrees: function(radians) { return radians * 180 / Math.PI; },
  lerp: function(a, b, x) { return a + (b - a) * x; },
};
goog.string = {
  startsWith: function(str, prefix) { return str.lastIndexOf(prefix, 0) === 0; },
  endsWith: function(str, suffix) { var l = str.length - suffix.length; return l >= 0 && str.indexOf(suffix, l) === l; },
  caseInsensitiveStartsWith: function(str, prefix) { return str.toLowerCase().lastIndexOf(prefix.toLowerCase(), 0) === 0; },
  caseInsensitiveEndsWith: function(str, suffix) { var l = str.length - suffix.length; return l >= 0 && str.toLowerCase().indexOf(suffix.toLowerCase(), l) === l; },
  subs: function(str, var_args) { var args = Array.prototype.slice.call(arguments, 1); for (var i = 0; i < args.length; i++) { var split = str.split('%s'); if (split.length === 0 || split.length > args.length + 1) continue; str = split[0]; for (var j = 0; j < split.length - 1; j++) { str += args[j] + split[j + 1]; } } return str; },
  contains: function(str, sub) { return str.indexOf(sub) >= 0; },
  isEmptyOrWhitespace: function(str) { return /^\s*$/.test(str); },
  hashCode: function(str) { var hash = 0; for (var i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; } return hash; },
  compareIgnoreCase: function(a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); },
  removeWhitespace: function(str) { return str.replace(/\\s+/g, ''); },
  truncate: function(str, max) { return str.length > max ? str.substring(0, max - 3) + '...' : str; },
  capitalize: function(str) { return str.charAt(0).toUpperCase() + str.slice(1); },
  toUpperCase: function(str) { return str.toUpperCase(); },
  toLowerCase: function(str) { return str.toLowerCase(); },
};
goog.object = {
  contains: function(obj, key) { return key in obj; },
  getKeys: function(obj) { var keys = []; for (var key in obj) { if (obj.hasOwnProperty(key)) keys.push(key); } return keys; },
  getValues: function(obj) { var values = []; for (var key in obj) { if (obj.hasOwnProperty(key)) values.push(obj[key]); } return values; },
  clone: function(obj) { var clone = {}; for (var key in obj) { if (obj.hasOwnProperty(key)) clone[key] = obj[key]; } return clone; },
  forEach: function(obj, f, opt_obj) { for (var key in obj) { if (obj.hasOwnProperty(key)) f.call(opt_obj, obj[key], key, obj); } },
  isEmpty: function(obj) { for (var key in obj) { if (obj.hasOwnProperty(key)) return false; } return true; },
  extend: function(target, var_args) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (source.hasOwnProperty(key)) target[key] = source[key]; } } return target; },
  create: function(var_args) { var argLength = arguments.length; if (argLength === 1 && Array.isArray(arguments[0])) { return goog.object.create.apply(null, arguments[0]); } if (argLength % 2) { throw new Error('Uneven number of arguments'); } var obj = {}; for (var i = 0; i < argLength; i += 2) { obj[arguments[i]] = arguments[i + 1]; } return obj; },
  transpose: function(obj) { var transposed = {}; for (var key in obj) { if (obj.hasOwnProperty(key)) transposed[obj[key]] = key; } return transposed; },
  unsafeClone: function(obj) { if (typeof obj === 'object' && obj !== null) { return JSON.parse(JSON.stringify(obj)); } return obj; },
};
goog.dom = {
  createDom: function(tagName, opt_attributes, var_args) { var el = document.createElement(tagName); if (opt_attributes) { for (var key in opt_attributes) { if (opt_attributes.hasOwnProperty(key)) { if (key === 'class') { el.className = opt_attributes[key]; } else if (key === 'style') { el.style.cssText = opt_attributes[key]; } else { el.setAttribute(key, opt_attributes[key]); } } } } for (var i = 2; i < arguments.length; i++) { var child = arguments[i]; if (typeof child === 'string') { el.appendChild(document.createTextNode(child)); } else if (child && child.appendChild) { el.appendChild(child); } } return el; },
  getViewportSize: function(opt_window) { var win = opt_window || window; if (win.innerWidth != null) return new goog.math.Size(win.innerWidth, win.innerHeight); var doc = win.document; if (document.compatMode === 'CSS1Compat' && doc.documentElement.clientWidth != null) return new goog.math.Size(doc.documentElement.clientWidth, doc.documentElement.clientHeight); return new goog.math.Size(doc.body.clientWidth, doc.body.clientHeight); },
  getElement: function(element) { return typeof element === 'string' ? document.getElementById(element) : element; },
  removeNode: function(node) { if (node && node.parentNode) node.parentNode.removeChild(node); return node; },
  appendChild: function(parent, child) { parent.appendChild(child); },
  insertBefore: function(parent, newNode, refNode) { parent.insertBefore(newNode, refNode); },
  insertAfter: function(parent, newNode, refNode) { parent.insertBefore(newNode, refNode ? refNode.nextSibling : null); },
  replaceNode: function(newNode, oldNode) { var parent = oldNode.parentNode; if (parent) parent.replaceChild(newNode, oldNode); },
};
goog.userAgent = {
  JSCRIPT: false,
  EDGE: typeof navigator !== 'undefined' && /Edge\/\d+/.test(navigator.userAgent),
  GECKO: typeof navigator !== 'undefined' && /Gecko\/\d+/.test(navigator.userAgent) && !/like Gecko/.test(navigator.userAgent),
  WEBKIT: typeof navigator !== 'undefined' && /WebKit\//.test(navigator.userAgent) && !/Edge\/\d+/.test(navigator.userAgent),
  MAC: typeof navigator !== 'undefined' && /Macintosh/.test(navigator.userAgent),
  WINDOWS: typeof navigator !== 'undefined' && /Windows/.test(navigator.userAgent),
  LINUX: typeof navigator !== 'undefined' && /Linux/.test(navigator.userAgent),
  PLATFORM: typeof navigator !== 'undefined' ? (navigator.platform || '') : '',
};
goog.userAgent.product = {
  CHROME: typeof navigator !== 'undefined' && /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent),
  SAFARI: typeof navigator !== 'undefined' && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
  FIREFOX: typeof navigator !== 'undefined' && /Firefox/.test(navigator.userAgent),
  IE: false,
  EDGE: typeof navigator !== 'undefined' && /Edge\/\d+/.test(navigator.userAgent),
};
goog.css = {
  classes: {
    add: function(el, className) { if (el.classList) el.classList.add(className); else el.className += ' ' + className; },
    remove: function(el, className) { if (el.classList) el.classList.remove(className); else el.className = el.className.replace(new RegExp('(^|\\b)' + className + '(\\b|$)', 'g'), ''); },
    has: function(el, className) { if (el.classList) return el.classList.contains(className); return new RegExp('(^|\\b)' + className + '(\\b|$)').test(el.className); },
    toggle: function(el, className) { if (goog.css.classes.has(el, className)) goog.css.classes.remove(el, className); else goog.css.classes.add(el, className); },
    enable: function(el, className, enabled) { if (enabled) goog.css.classes.add(el, className); else goog.css.classes.remove(el, className); },
  },
};
goog.events = {
  LISTENER_MAP_PROP_: '__goog_events_listener_map__',
  listen: function(src, type, listener, opt_capt, opt_handler) {
    src.addEventListener(type, opt_handler || listener, !!opt_capt); return { key: type, src: src, listener: listener, capture: !!opt_capt, handler: opt_handler || listener }; },
  unlisten: function(key) { if (key && key.src) key.src.removeEventListener(key.key, key.handler, key.capture); },
  unlistenByKey: function(key) { goog.events.unlisten(key); },
  removeAll: function(src, opt_type) { /* stub */ },
  getListeners: function(obj, type, capture) { return []; },
  fireListeners: function(obj, type, capture, eventObject) { /* stub */ return true; },
};
goog.async = {
  nextTick: function(callback, opt_context) { if (typeof queueMicrotask === 'function') { queueMicrotask(opt_context ? callback.bind(opt_context) : callback); } else { setTimeout(opt_context ? callback.bind(opt_context) : callback, 0); } },
  throwException: function(e) { setTimeout(function() { throw e; }, 0); },
};
goog.dispose = function(obj) { if (obj && typeof obj.dispose === 'function') obj.dispose(); };
goog.Disposable = function() {};
goog.Disposable.prototype.dispose = function() {};
goog.Disposable.prototype.isDisposed = function() { return false; };
goog.Uri = function(opt_uri) {
  if (opt_uri !== undefined) {
    this.parse_(opt_uri);
  }
};
goog.Uri.prototype.setPath = function(path) { this.path_ = path; return this; };
goog.Uri.prototype.getPath = function() { return this.path_ || ''; };
goog.Uri.prototype.getDomain = function() { return this.domain_ || ''; };
goog.Uri.prototype.setDomain = function(domain) { this.domain_ = domain; return this; };
goog.Uri.prototype.getProtocol = function() { return this.scheme_ || ''; };
goog.Uri.prototype.setProtocol = function(protocol) { this.scheme_ = protocol; return this; };
goog.Uri.prototype.getQuery = function() { return this.queryData_ ? this.queryData_.toString() : ''; };
goog.Uri.prototype.setQuery = function(query) { this.queryData_ = query; return this; };
goog.Uri.prototype.setParameterValue = function(key, value) { /* stub */ return this; };
goog.Uri.prototype.getParameterValue = function(key) { /* stub */ return null; };
goog.Uri.prototype.toString = function() { var s = ''; if (this.scheme_) s += this.scheme_ + '://'; if (this.domain_) s += this.domain_; if (this.path_) s += this.path_; return s; };
goog.Uri.prototype.parse_ = function(uri) { var m = uri.match(/^(https?:\/\/)([^\/]+)([^?]*)(.*)/); if (m) { this.scheme_ = m[1].replace(/:$/, '').replace(/\//g, ''); this.domain_ = m[2]; this.path_ = m[3]; } else { this.path_ = uri; } };
goog.Uri.parse = function(uri) { return new goog.Uri(uri); };

// goog.exportSymbol and goog.exportProperty
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  var parts = publicPath.split('.');
  var obj = opt_objectToExportTo || (typeof window !== 'undefined' ? window : globalThis);
  for (var i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in obj)) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = object;
};
goog.exportProperty = function(object, publicPath, value) {
  object[publicPath] = value;
};
goog.module = function(name) { /* stub */ };
goog.scope = function(fn) { fn(); };
`;

// Process each file: strip goog.provide and goog.require calls
const processedFiles = [];
for (const file of order) {
  let content = readFileSync(file, 'utf8');
  // Remove goog.provide() calls
  content = content.replace(/^goog\.provide\(['"][^'"]+['"]\);?\s*$/gm, '');
  // Remove goog.require() calls
  content = content.replace(/^goog\.require\(['"][^'"]+['"]\);?\s*$/gm, '');
  processedFiles.push({
    path: file,
    content,
    relPath: file.replace(__dirname + '/', ''),
  });
}

// Create the output bundle
let output = googShim;
output += '\n// --- scratch-blocks source files ---\n\n';
for (const { relPath, content } of processedFiles) {
  output += `// File: ${relPath}\n`;
  output += content;
  output += '\n\n';
}

// Export Blockly as UMD
output += `
// UMD export
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ScratchBlocks = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  return Blockly;
});
`;

// Write output
const outDir = resolve(__dirname, 'dist');
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}
writeFileSync(resolve(outDir, 'vertical.js'), output);

const sizeKB = Math.round(output.length / 1024);
console.log(`Built dist/vertical.js (${sizeKB} KB, ${processedFiles.length} files)`);
