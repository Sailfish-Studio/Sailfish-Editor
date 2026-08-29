/*
 * Sailfish Studio - Build all library packages in dependency order
 * Uses Vite in library mode via per-package vite.config.mjs
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const ROOT = new URL('..', import.meta.url).pathname;

// Build order: dependencies first
const LIBS = [
  'nanolog',
  'scratch-parser',
  'scratch-audio',
  'scratch-storage',
  'scratch-svg-renderer',
  'scratch-render',
  'scratch-blocks',
  'scratch-paint',
  'scratch-vm',
];

console.log('\n  Sailfish Studio - Building Libraries (Vite + Bun)\n');

let failed = [];
for (const lib of LIBS) {
  const viteConfig = `${ROOT}/${lib}/vite.config.mjs`;
  if (!existsSync(viteConfig)) {
    console.log(`  [skip] ${lib} (no vite.config.mjs)`);
    continue;
  }

  const label = lib.padEnd(25);
  try {
    console.log(`  [build] ${label} ...`);
    execSync(`bun --bun vite build --config ${lib}/vite.config.mjs`, {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 120000,
    });
    console.log(`  [done]  ${label} OK`);
  } catch (e) {
    console.log(`  [FAIL]  ${label} ${e.stderr?.toString().trim().split('\n').pop() || e.message}`);
    failed.push(lib);
  }
}

console.log('');
if (failed.length > 0) {
  console.log(`  Failed: ${failed.join(', ')}`);
  process.exit(1);
} else {
  console.log('  All libraries built successfully!');
}
