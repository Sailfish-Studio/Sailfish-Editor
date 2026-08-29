import { defineConfig } from 'vite';
import { createLibConfig } from '../../vite.lib.config.mjs';
import postcssImport from 'postcss-import';
import postcssVars from 'postcss-simple-vars';
import autoprefixer from 'autoprefixer';

export default defineConfig(createLibConfig({
  name: 'scratch-paint',
  entry: 'src/index.js',
  format: 'esm',
  external: [
    'react',
    'react-dom',
    'scratch-render-fonts',
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]_[local]_[hash:base64:5]',
    },
    postcss: {
      plugins: [postcssImport, postcssVars, autoprefixer],
    },
  },
}));
