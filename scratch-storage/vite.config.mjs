import { defineConfig } from 'vite';
import { createLibConfig } from '../../vite.lib.config.mjs';

// NOTE: The original webpack config used 'arraybuffer-loader' for .png/.svg/.wav files.
// Vite handles binary assets differently (asset handling via ?url or ?raw imports).
// Any code that relied on `require('somefile.png')` returning an ArrayBuffer will
// need to be migrated to use `import somefile from 'somefile.png?raw'` or a
// custom Vite plugin that provides the same ArrayBuffer behavior.

export default defineConfig(createLibConfig({
  name: 'scratch-storage',
  entry: 'src/index.js',
  format: 'esm+umd',
}));
