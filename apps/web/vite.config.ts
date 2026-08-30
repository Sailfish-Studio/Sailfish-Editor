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
const MONO_ROOT = resolve(__dirname, '..', '..');

// esbuild plugin to strip broken Flow prop-type imports from react-virtualized
const stripFlowPropTypes: PluginOption = {
  name: 'strip-flow-prop-types',
  setup(build) {
    build.onLoad({ filter: /react-virtualized.*\.js$/ }, async (args) => {
      const fs = await import('node:fs');
      let code = await fs.promises.readFile(args.path, 'utf8');
      code = code.replace(
        /import\s*\{[^}]*bpfrpt_proptype_\w+[^}]*\}\s*from\s*['"][^'"\n]+['"];?/g,
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
// Subpath aliases MUST come before bare package aliases (longer prefix first)
const workspaceAliases: Record<string, string> = {
  '@sailfish/core/src': resolve(MONO_ROOT, 'packages/core/src'),
  '@sailfish/render/src': resolve(MONO_ROOT, 'packages/render/src'),
  '@sailfish/ui/src': resolve(MONO_ROOT, 'packages/ui/src'),
  '@sailfish/core': resolve(MONO_ROOT, 'packages/core/src/index.js'),
  '@sailfish/render': resolve(MONO_ROOT, 'packages/render/src/index.js'),
  '@sailfish/ui': resolve(MONO_ROOT, 'packages/ui/src/index.js'),
  '@sailfish/ui-playground': resolve(MONO_ROOT, 'packages/ui/src/playground'),
  '@sailfish/blocks-ui': resolve(MONO_ROOT, 'packages/blocks-ui/dist/vertical.js'),
  '@sailfish/shared/extended-json': resolve(MONO_ROOT, 'packages/shared/src/extended-json.js'),
  '@sailfish/shared': resolve(MONO_ROOT, 'packages/shared/src/index.js'),
  '@sailfish/paper': resolve(MONO_ROOT, 'packages/paper/src/paper.js'),
};

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: PORT,
      host: '0.0.0.0',
      open: false,
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },

    base: ROOT,

    resolve: {
      alias: {
        ...workspaceAliases,
        'text-encoding$': resolve(MONO_ROOT, 'packages/ui/src/lib/tw-text-encoder'),
        'scratch-render-fonts': resolve(MONO_ROOT, 'packages/ui/src/lib/tw-scratch-render-fonts'),
      },
    },

    css: {
      modules: {
        localsConvention: 'camelCase' as const,
        generateScopedName: '[name]_[local]_ash:base64:5]',
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
      commonjsOptions: {
        include: [/node_modules/, /packages\/(?!blocks-ui\/dist)/],
        transformMixedEsModules: true,
      },
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
          manualChunks(id) {
            // Only separate blocks-ui (pre-built UMD, must not be tree-shaken)
            // All other chunks handled by Rollup automatically to avoid
            // breaking module initialization order (e.g. React internals)
            if (id.includes('blocks-ui')) {
              return 'blocks-ui';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    publicDir: resolve(MONO_ROOT, 'packages/ui/static'),

    optimizeDeps: {
      exclude: [...Object.keys(workspaceAliases)],
      esbuildOptions: {
        plugins: [stripFlowPropTypes],
      },
    },
  };
});
