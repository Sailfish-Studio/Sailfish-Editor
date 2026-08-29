/**
 * Build scratch-blocks: goog module system → UMD bundle.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const subdirs = ['msg', 'core', 'blocks_common', 'blocks_vertical'];
const allFiles = [];
for (const sub of subdirs) {
  allFiles.push(
    ...readdirSync(resolve(__dirname, sub))
      .filter((f) => f.endsWith('.js'))
      .map((f) => resolve(__dirname, sub, f)),
  );
}
console.log(`Processing ${allFiles.length} files...`);

const provides = new Map();
const requires = new Map();
for (const file of allFiles) {
  const content = readFileSync(file, 'utf8');
  for (const m of content.matchAll(/goog\.provide\(['"]([^'"]+)['"]\)/g)) provides.set(m[1], file);
  const reqs = [];
  for (const m of content.matchAll(/goog\.require\(['"]([^'"]+)['"]\)/g)) reqs.push(m[1]);
  requires.set(file, reqs);
}
console.log(`Found ${provides.size} provided modules`);

const visited = new Set();
const order = [];
function visit(name) {
  if (visited.has(name)) return;
  visited.add(name);
  if (!provides.has(name)) return;
  const file = provides.get(name);
  for (const dep of (requires.get(file) || [])) visit(dep);
  if (!order.includes(file)) order.push(file);
}
for (const name of provides.keys()) visit(name);
console.log(`Sorted ${order.length} files in dependency order`);

const googShim = readFileSync(resolve(__dirname, 'goog-shim.js'), 'utf8');

const RE_PROVIDE = new RegExp("^goog\\.provide\\(['\"][^'\"]+['\"]\\);?\\s*$", "gm");
const RE_REQUIRE = new RegExp("^goog\\.require\\(['\"][^'\"]+['\"]\\);?\\s*$", "gm");

let output = googShim + '\n// --- scratch-blocks source files ---\n\n';
for (const file of order) {
  let content = readFileSync(file, 'utf8');
  content = content.replace(RE_PROVIDE, '');
  content = content.replace(RE_REQUIRE, '');
  output += `// File: ${file.replace(__dirname + '/', '')}\n`;
  output += content + '\n\n';
}

output += `
(function(root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ScratchBlocks = factory();
})(typeof self !== 'undefined' ? self : this, function() { return Blockly; });
`;

const outDir = resolve(__dirname, 'dist');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'vertical.js'), output);
console.log(`Built dist/vertical.js (${Math.round(output.length / 1024)} KB, ${order.length} files)`);
