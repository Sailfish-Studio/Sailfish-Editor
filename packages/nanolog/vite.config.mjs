import { defineConfig } from 'vite';
import { createLibConfig } from '../../vite.lib.config.mjs';

export default defineConfig(createLibConfig({
  name: 'nanolog',
  entry: 'index.js',
  format: 'esm',
}));
