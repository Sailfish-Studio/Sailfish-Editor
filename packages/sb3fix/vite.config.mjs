import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// createLibConfig does not support 'iife' format, so we build manually
// with the same conventions (sourcemap, define, etc.)
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  root: __dirname,
  build: {
    outDir: resolve(__dirname, 'dist'),
    sourcemap: isProd ? false : 'external',
    minify: isProd,
    target: 'esnext',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/sb3fix.js'),
      name: 'sb3fix',
      formats: ['iife'],
      fileName: () => 'sb3fix.js',
    },
    rollupOptions: {
      output: {
        // IIFE wraps everything, no exports needed
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
  },
  // NOTE: The original webpack config copied static/ and src/index.html to dist/.
  // To replicate this, either:
  //   1. Add vite-plugin-static-copy:
  //      import { viteStaticCopy } from 'vite-plugin-static-copy';
  //      plugins: [viteStaticCopy({ targets: [
  //        { src: 'src/index.html', dest: '.' },
  //        { src: 'static', dest: '.' },
  //      ]})]
  //   2. Use a simple build script / cp command in package.json
});
