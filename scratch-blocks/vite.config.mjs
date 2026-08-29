/**
 * Vite config for scratch-blocks
 * 
 * scratch-blocks uses Google Closure style (goog.provide/goog.require).
 * We create a Vite-compatible entry point that wraps the raw source.
 */
import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  build: {
    outDir: resolve(__dirname, 'dist'),
    lib: {
      entry: resolve(__dirname, 'src/vite-entry.js'),
      name: 'ScratchBlocks',
      formats: ['umd'],
      fileName: () => 'vertical.js',
    },
    rollupOptions: {
      output: {
        globals: {},
      },
    },
    sourcemap: false,
    minify: false,
    target: 'esnext',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // goog module system shim
      'goog': resolve(__dirname, 'src/goog-shim.js'),
    },
  },
});
