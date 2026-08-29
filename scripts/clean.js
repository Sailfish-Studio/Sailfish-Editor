/**
 * Sailfish Studio - Clean all build outputs
 */
import { rmSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dir, '..');
const DIRS_TO_CLEAN = [
  'scratch-gui/build', 'scratch-gui/dist',
  'scratch-vm/dist', 'scratch-vm/playground',
  'scratch-render/dist', 'scratch-render/playground',
  'scratch-blocks/dist', 'scratch-blocks/gh-pages',
  'scratch-paint/dist', 'scratch-paint/playground',
  'scratch-storage/dist', 'scratch-storage/build',
  'scratch-svg-renderer/dist', 'scratch-svg-renderer/playground',
  'scratch-parser/dist',
  'scratch-audio/dist',
  'nanolog/dist',
  'jszip/dist',
  'sb3fix/dist',
  'scaffolding/dist',
  'packager/dist',
  'desktop/dist-renderer-webpack',
];

console.log('Cleaning build outputs...');
let cleaned = 0;
for (const dir of DIRS_TO_CLEAN) {
  const full = join(ROOT, dir);
  if (existsSync(full)) {
    rmSync(full, { recursive: true });
    console.log(`  Removed: ${dir}`);
    cleaned++;
  }
}
console.log(`Done. Cleaned ${cleaned} directories.`);
