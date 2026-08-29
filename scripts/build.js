/**
 * Sailfish Studio - Bun Build System
 * Replaces Webpack with Bun's native bundler + TypeScript
 */

import { build } from 'bun';
import { readdirSync, statSync, mkdirSync, cpSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, resolve, relative, dirname, basename } from 'path';

const ROOT = resolve(import.meta.dir, '..');
const IS_DEV = process.env.NODE_ENV !== 'production';

// ============================================================
// Package build order (dependency-first)
// ============================================================
const BUILD_ORDER = [
  // Leaf packages (no internal deps)
  { name: 'nanolog',         dir: 'nanolog',              type: 'lib' },
  { name: 'jszip',           dir: 'jszip',                type: 'lib' },
  { name: 'scratch-parser',  dir: 'scratch-parser',       type: 'lib' },
  { name: 'scratch-audio',   dir: 'scratch-audio',        type: 'lib' },
  { name: 'scratch-storage', dir: 'scratch-storage',      type: 'lib' },
  { name: 'scratch-svg-renderer', dir: 'scratch-svg-renderer', type: 'lib' },
  { name: 'scratch-blocks',  dir: 'scratch-blocks',       type: 'lib' },
  { name: 'scratch-paint',   dir: 'scratch-paint',        type: 'lib' },
  { name: 'scratch-render',  dir: 'scratch-render',       type: 'lib' },
  { name: 'scratch-vm',      dir: 'scratch-vm',           type: 'lib' },
  // Applications
  { name: 'scratch-gui',     dir: 'scratch-gui',          type: 'app' },
  // Tools
  { name: 'sb3fix',          dir: 'sb3fix',              type: 'tool' },
];

// ============================================================
// Helpers
// ============================================================
function log(pkg, msg) {
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[${ts}] [${pkg}] ${msg}`);
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        copyDirRecursive(srcPath, destPath);
      }
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

// ============================================================
// Build a library package
// ============================================================
async function buildLib(pkg) {
  const pkgDir = join(ROOT, pkg.dir);
  const pj = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
  const entry = pj.main || pj.source || 'src/index.js';
  const outDir = join(pkgDir, 'dist');

  // Clean
  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  ensureDir(outDir);

  log(pkg.name, `Building library from ${entry}...`);

  const result = await build({
    entrypoints: [join(pkgDir, entry)],
    outdir: outDir,
    target: 'browser',
    format: 'esm',
    naming: '[name].mjs',
    sourcemap: IS_DEV ? 'external' : 'none',
    minify: !IS_DEV,
    // Treat all workspace packages as external to avoid double-bundling
    external: [
      'scratch-vm', 'scratch-render', 'scratch-blocks', 'scratch-paint',
      'scratch-storage', 'scratch-svg-renderer', 'scratch-parser',
      'scratch-audio', 'scratch-gui',
      '@sailfish-studio/*', '@turbowarp/*',
      'react', 'react-dom', 'redux', 'react-redux',
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(IS_DEV ? 'development' : 'production'),
    },
  });

  if (!result.success) {
    log(pkg.name, 'BUILD FAILED');
    for (const log of result.logs) console.error(log);
    return false;
  }

  log(pkg.name, `Built ${result.outputs.length} output(s)`);
  return true;
}

// ============================================================
// Build scratch-gui (the main app)
// ============================================================
async function buildApp(pkg) {
  const pkgDir = join(ROOT, pkg.dir);
  const buildDir = join(pkgDir, 'build');
  const distDir = join(pkgDir, 'dist');

  // Clean
  if (existsSync(buildDir)) rmSync(buildDir, { recursive: true });
  if (existsSync(distDir)) rmSync(distDir, { recursive: true });
  ensureDir(buildDir);
  ensureDir(join(buildDir, 'static', 'assets'));

  // 1. Copy static assets
  log(pkg.name, 'Copying static assets...');
  const staticDir = join(pkgDir, 'src', 'static');
  if (existsSync(staticDir)) {
    copyDirRecursive(staticDir, join(buildDir, 'static'));
  }

  // Copy blocks media
  const blocksMediaDir = join(ROOT, 'scratch-blocks', 'media');
  if (existsSync(blocksMediaDir)) {
    copyDirRecursive(blocksMediaDir, join(buildDir, 'static', 'blocks-media'));
  }

  // 2. Build the main playground bundle
  log(pkg.name, 'Building playground bundle...');

  // Generate HTML from template
  const templatePath = join(pkgDir, 'src', 'playground', 'index.html');
  if (existsSync(templatePath)) {
    let html = readFileSync(templatePath, 'utf8');
    html = html.replace('Sailfish-Studio', 'Sailfish Studio');
    // Replace webpack-generated script tags with bun bundle reference
    html = html.replace(
      /<script[^>]*src=["'].*?["'][^>]*>\s*<\/script>/g,
      ''
    );
    html = html.replace(
      '</head>',
      '<script src="/playground.js"></script>\n</head>'
    );
    writeFileSync(join(buildDir, 'index.html'), html);
  }

  // Build JS bundle
  const entry = join(pkgDir, 'src', 'playground', 'index.jsx');
  const result = await build({
    entrypoints: [existsSync(entry) ? entry : join(pkgDir, 'src', 'index.js')],
    outdir: buildDir,
    target: 'browser',
    format: 'esm',
    naming: '[name].js',
    sourcemap: IS_DEV ? 'inline' : 'none',
    minify: !IS_DEV,
    // In dev mode, don't externalize workspace packages (bundle them)
    // In prod, externalize them for separate loading
    external: !IS_DEV ? ['scratch-vm', 'scratch-render', 'scratch-blocks', 'scratch-paint'] : [],
    define: {
      'process.env.NODE_ENV': JSON.stringify(IS_DEV ? 'development' : 'production'),
      'process.env.ENABLE_WINDCHIMES': JSON.stringify('false'),
      'process.env.ENABLE_SERVICE_WORKER': JSON.stringify('false'),
    },
    loader: {
      '.jpg': 'file',
      '.png': 'file',
      '.svg': 'file',
      '.gif': 'file',
      '.mp3': 'file',
      '.wav': 'file',
      '.woff2': 'file',
    },
    publicPath: '/static/',
  });

  if (!result.success) {
    log(pkg.name, 'BUILD FAILED');
    for (const logItem of result.logs) console.error(logItem);
    return false;
  }

  log(pkg.name, `Built playground: ${result.outputs.map(o => basename(o.path)).join(', ')}`);
  return true;
}

// ============================================================
// Build a tool (simple standalone)
// ============================================================
async function buildTool(pkg) {
  const pkgDir = join(ROOT, pkg.dir);
  const outDir = join(pkgDir, 'dist');
  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  ensureDir(outDir);

  log(pkg.name, 'Building tool...');
  const result = await build({
    entrypoints: [join(pkgDir, 'src', 'sb3fix.js')],
    outdir: outDir,
    target: 'browser',
    format: 'iife',
    naming: '[name].js',
    sourcemap: IS_DEV ? 'external' : 'none',
    minify: !IS_DEV,
    define: {
      'process.env.NODE_ENV': JSON.stringify(IS_DEV ? 'development' : 'production'),
    },
  });

  if (!result.success) {
    log(pkg.name, 'BUILD FAILED');
    return false;
  }

  // Copy static files for tools
  const staticDir = join(pkgDir, 'static');
  if (existsSync(staticDir)) {
    copyDirRecursive(staticDir, outDir);
  }
  const indexHtml = join(pkgDir, 'src', 'index.html');
  if (existsSync(indexHtml)) {
    cpSync(indexHtml, join(outDir, 'index.html'));
  }

  log(pkg.name, `Built tool: ${result.outputs.map(o => basename(o.path)).join(', ')}`);
  return true;
}

// ============================================================
// Main build orchestrator
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const targetPkg = args.find(a => !a.startsWith('--'));

  console.log(`\n  Sailfish Studio Build System (Bun + TypeScript)\n`);
  console.log(`  Mode: ${IS_DEV ? 'development' : 'production'}`);
  console.log(`  Target: ${targetPkg || 'all'}\n`);

  const packages = targetPkg
    ? BUILD_ORDER.filter(p => p.dir === targetPkg || p.name === targetPkg)
    : BUILD_ORDER;

  let failed = [];
  for (const pkg of packages) {
    console.log('');
    let success = false;
    try {
      if (pkg.type === 'lib') success = await buildLib(pkg);
      else if (pkg.type === 'app') success = await buildApp(pkg);
      else if (pkg.type === 'tool') success = await buildTool(pkg);
    } catch (e) {
      log(pkg.name, `ERROR: ${e.message}`);
      success = false;
    }
    if (!success) failed.push(pkg.name);
  }

  console.log('\n' + '='.repeat(50));
  if (failed.length === 0) {
    console.log('  All packages built successfully!');
  } else {
    console.log(`  Failed: ${failed.join(', ')}`);
    process.exit(1);
  }
}

main();
