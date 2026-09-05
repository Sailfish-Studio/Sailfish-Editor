/**
 * Build scratch-blocks: goog module system → UMD bundle.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const subdirs = ['src/msg', 'src/core', 'src/blocks_common', 'src/blocks_vertical'];
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

// Build a file-level dependency graph, then topologically sort with Tarjan
// SCC. Inside a strongly-connected component files keep their natural
// (alphabetical readdir) order, which keeps base files such as core/block.js
// ahead of subclasses like core/block_svg.js even where requires form cycles.
const fileIdx = new Map();
allFiles.forEach((f, idx) => fileIdx.set(f, idx));
const adj = allFiles.map(() => []);
for (const file of allFiles) {
  const seen = new Set();
  for (const req of (requires.get(file) || [])) {
    const provider = provides.get(req);
    if (provider && provider !== file && !seen.has(provider)) {
      seen.add(provider);
      adj[fileIdx.get(file)].push(fileIdx.get(provider));
    }
  }
}

const n = allFiles.length;
const index = new Array(n).fill(-1);
const low = new Array(n).fill(0);
const onStack = new Array(n).fill(false);
const stack = [];
const components = [];
let counter = 0;
const strongconnect = (v) => {
  index[v] = counter;
  low[v] = counter;
  counter += 1;
  stack.push(v);
  onStack[v] = true;
  for (const w of adj[v]) {
    if (index[w] === -1) {
      strongconnect(w);
      low[v] = Math.min(low[v], low[w]);
    } else if (onStack[w]) {
      low[v] = Math.min(low[v], index[w]);
    }
  }
  if (low[v] === index[v]) {
    const comp = [];
    let w;
    do {
      w = stack.pop();
      onStack[w] = false;
      comp.push(w);
    } while (w !== v);
    comp.sort((a, b) => a - b); // natural file order within the SCC
    components.push(comp);
  }
};
for (let v = 0; v < n; v++) {
  if (index[v] === -1) strongconnect(v);
}

// Tarjan emits SCCs finishing leaves first, i.e. dependencies before the
// files that require them.
const order = [];
for (const comp of components) {
  for (const v of comp) order.push(allFiles[v]);
}
console.log(`Sorted ${order.length} files in dependency order`);

const googShim = readFileSync(resolve(__dirname, 'goog-shim.js'), 'utf8');


const RE_PROVIDE = new RegExp("^goog\\.provide\\(['\"][^'\"]+['\"]\\);?\\s*$", "gm");
const RE_REQUIRE = new RegExp("^goog\\.require\\(['\"][^'\"]+['\"]\\);?\\s*$", "gm");

let output = googShim + '\n// --- pre-create all goog.provide() namespaces ---\n';
output += '(function () {\n';
for (const name of provides.keys()) {
  output += `  goog.provide('${name}');\n`;
}
output += '})();\n\n// --- scratch-blocks source files ---\n\n';
for (const file of order) {
  let content = readFileSync(file, 'utf8');
  content = content.replace(RE_PROVIDE, '');
  content = content.replace(RE_REQUIRE, '');
  // Inline goog.inherits as a deferred inheritance: queue (child, parent)
  // accessor closures and apply them after every module has executed. This
  // makes class extension order independent of cyclic module ordering.
  content = content.replace(
    /goog\.inherits\(\s*([A-Za-z_$][\w.$]*)\s*,\s*([A-Za-z_$][\w.$]*)\s*\)/g,
    (_m, child, parent) => `goog.__inheritLater__(function(){return ${child};},function(){return ${parent};})`
  );
  output += `// File: ${file.replace(__dirname + '/', '')}\n`;
  output += content + '\n\n';
}
output += 'goog.__inheritFlush__();\n\n';

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
