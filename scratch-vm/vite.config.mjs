import { defineConfig } from 'vite';
import { createLibConfig } from '../../vite.lib.config.mjs';

export default defineConfig(createLibConfig({
  name: 'scratch-vm',
  entry: 'src/index.js',
  format: 'esm+umd',
  external: [
    'scratch-parser',
    'scratch-audio',
    'scratch-blocks',
  ],
}));
