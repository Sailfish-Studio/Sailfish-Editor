/**
 * Build scratch-blocks without Closure Compiler.
 * Implements minimal goog module system, loads all source files,
 * and outputs a UMD bundle.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Collect all source files
const subdirs = ['msg', 'core', 'blocks_common', 'blocks_vertical'];
const allFiles: string[] = [];
for (const sub of subdirs) {
  const entries = readdirSync(resolve(__dirname, sub))
    .filter((f: string) => f.endsWith('.js'))
    .map((f: string) => resolve(__dirname, sub, f));
  allFiles.push(...entries);
}

console.log(`Processing ${allFiles.length} files...`);

// Build dependency graph
const provides = new Map<string, string>();
const requires = new Map<string, string[]>();

for (const file of allFiles) {
  const content = readFileSync(file, 'utf8');
  const provs: string[] = [];
  const reqs: string[] = [];

  for (const match of content.matchAll(/goog\.provide\(['"]([^'"]+)['"]\)/g)) {
    provs.push(match[1]);
    provides.set(match[1], file);
  }
  for (const match of content.matchAll(/goog\.require\(['"]([^'"]+)['"]\)/g)) {
    reqs.push(match[1]);
  }
  requires.set(file, reqs);
}

console.log(`Found ${provides.size} provided modules`);

// Topological sort
const visited = new Set<string>();
const order: string[] = [];

function visit(name: string): void {
  if (visited.has(name)) return;
  visited.add(name);
  if (!provides.has(name)) return;
  const file = provides.get(name)!;
  const deps = requires.get(file) || [];
  for (const dep of deps) visit(dep);
  if (!order.includes(file)) order.push(file);
}

for (const name of provides.keys()) visit(name);
console.log(`Sorted ${order.length} files in dependency order`);

// Read goog shim (plain JS to avoid TS regex escaping issues)
const googShim = readFileSync(resolve(__dirname, 'goog-shim.js'), 'utf8');

// Process each file: strip goog.provide / goog.require
let output = googShim + '\n// --- scratch-blocks source files ---\n\n';

for (const file of order) {
  let content = readFileSync(file, 'utf8');
  content = content.replace(/^goog\.provide\(['"][^'"]+['"]);?\s*$/gm, '');
  content = content.replace(/^goog\.require\(['"][^'"]+['"]);?\s*$/gm, '');
  const relPath = file.replace(__dirname + '/', '');
  output += `// File: ${relPath}\n`;
  output += content;
  output += '\n\n';
}

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
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'vertical.js'), output);

const sizeKB = Math.round(output.length / 1024);
console.log(`Built dist/vertical.js (${sizeKB} KB, ${order.length} files)`);
