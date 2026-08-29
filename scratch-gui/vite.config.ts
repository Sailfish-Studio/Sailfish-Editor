import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcssImport from 'postcss-import';
import postcssVars from 'postcss-simple-vars';
import autoprefixer from 'autoprefixer';
import webpackCompat from './vite-plugin-webpack-compat.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.ROOT || '/';
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '8601', 10);
const MONO_ROOT = resolve(__dirname, '..');

// esbuild plugin to strip broken Flow prop-type imports/exports from react-virtualized
const stripFlowPropTypes: PluginOption = {
  name: 'strip-flow-prop-types',
  setup(build) {
    build.onLoad({ filter: /react-virtualized.*\.js$/ }, async (args) => {
      const fs = await import('node:fs');
      let code = await fs.promises.readFile(args.path, 'utf8');
      code = code.replace(
        /import\s*\{[^}]*bpfrpt_proptype_\w+[^}]*\}\s*from\s*['"][^'"]["'];?/g,
        '',
      );
      code = code.replace(
        /export\s*\{[^}]*bpfrpt_proptype_\w+[^}]*\};?/g,
        '',
      );
      return { contents: code, loader: 'js' };
    });
  },
};

// Workspace packages → source code (direct references, not node_modules)
const workspaceAliases: Record<string, string> = {
  'scratch-vm': resolve(MONO_ROOT, 'scratch-vm/src/index.js'),
  'scratch-render': resolve(MONO_ROOT, 'scratch-render/src/index.js'),
  'scratch-audio': resolve(MONO_ROOT, 'scratch-audio/src/index.js'),
  'scratch-paint': resolve(MONO_ROOT, 'scratch-paint/src/index.js'),
  'scratch-parser': resolve(MONO_ROOT, 'scratch-parser/index.js'),
  'scratch-blocks': resolve(MONO_ROOT, 'scratch-blocks/dist/vertical.js'),
  '@sailfish-studio/scratch-storage': resolve(MONO_ROOT, 'scratch-storage/src/index.js'),
  '@sailfish-studio/scratch-svg-renderer': resolve(MONO_ROOT, 'scratch-svg-renderer/src/index.js'),
  '@sailfish-studio/nanolog': resolve(MONO_ROOT, 'nanolog/index.js'),
  '@sailfish-studio/jszip': resolve(MONO_ROOT, 'jszip/lib/index.js'),
  '@sailfish-studio/sb3fix': resolve(MONO_ROOT, 'sb3fix/src/sb3fix.js'),
  '@sailfish-studio/paper': resolve(MONO_ROOT, 'paper.js/dist/paper-full.js'),
};

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: PORT,
      host: '0.0.0.0',
      open: false,
      // Use polling to avoid ENOSPC (inotify watcher limit)
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },

    base: ROOT,

    resolve: {
      alias: {
        ...workspaceAliases,
        'text-encoding$': resolve(__dirname, 'src/lib/tw-text-encoder'),
        'scratch-render-fonts': resolve(__dirname, 'src/lib/tw-scratch-render-fonts'),
      },
    },

    css: {
      modules: {
        localsConvention: 'camelCase' as const,
        generateScopedName: '[name]_[local]_[hash:base64:5]',
      },
      postcss: {
        plugins: [postcssImport, postcssVars, autoprefixer],
      },
    },

    plugins: [
      webpackCompat(),
      react({
        babel: {
          plugins: [['react-intl', { messagesDir: './translations/messages/' }]],
          presets: [
            ['@babel/preset-env', { targets: '> 1%, not dead' }],
            ['@babel/preset-react', { runtime: 'automatic' }],
          ],
        },
      }),
    ],

    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.DEBUG': JSON.stringify(!!process.env.DEBUG),
      'process.env.ENABLE_SERVICE_WORKER': JSON.stringify(process.env.ENABLE_SERVICE_WORKER || ''),
      'process.env.ROOT': JSON.stringify(ROOT),
      'process.env.ROUTING_STYLE': JSON.stringify(process.env.ROUTING_STYLE || 'filehash'),
      'process.env.ENABLE_WINDCHIMES': JSON.stringify(process.env.ENABLE_WINDCHIMES || ''),
    },

    build: {
      outDir: 'build',
      sourcemap: mode === 'development' ? 'inline' : false,
      minify: IS_PROD,
      emptyOutDir: true,
      target: 'esnext',
      rollupOptions: {
        input: {
          editor: resolve(__dirname, 'editor.html'),
          player: resolve(__dirname, 'index.html'),
          fullscreen: resolve(__dirname, 'fullscreen.html'),
          embed: resolve(__dirname, 'embed.html'),
          'addon-settings': resolve(__dirname, 'addons.html'),
          credits: resolve(__dirname, 'credits.html'),
        },
        output: {
          manualChunks(id: string) {
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/redux/') ||
              id.includes('node_modules/react-redux/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('scratch-blocks')) {
              return 'scratch-blocks';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    publicDir: resolve(__dirname, 'static'),

    optimizeDeps: {
      exclude: Object.keys(workspaceAliases),
      esbuildOptions: {
        plugins: [stripFlowPropTypes],
      },
    },
  };
});
