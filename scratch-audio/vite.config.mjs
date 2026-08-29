import { defineConfig } from 'vite';
import { createLibConfig } from '../../vite.lib.config.mjs';

export default defineConfig(createLibConfig({
  name: 'scratch-audio',
  entry: 'src/index.js',
  format: 'esm',
}));
