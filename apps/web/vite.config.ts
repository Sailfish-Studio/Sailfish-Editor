import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import inject from '@rollup/plugin-inject';
import { resolve, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
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
  '@sailfish/core/audio': resolve(MONO_ROOT, 'packages/core/src/audio/index.js'),
  '@sailfish/core/storage': resolve(MONO_ROOT, 'packages/core/src/storage/index.js'),
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
        // Node built-in polyfills used by scratch-core/render in browser builds
        'events$': resolve(MONO_ROOT, 'node_modules/.pnpm/events@3.3.0/node_modules/events/events.js'),
        'buffer$': resolve(MONO_ROOT, 'node_modules/.pnpm/buffer@5.7.1/node_modules/buffer/index.js'),
        'process$': resolve(MONO_ROOT, 'node_modules/.pnpm/process@0.11.10/node_modules/process/browser.js'),
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
      // Ignore empty tokens in classList operations (e.g. an empty theme class
      // name), which would otherwise throw a DOMTokenList SyntaxError.
      {
        name: 'dom-token-guard',
        transformIndexHtml() {
          return [{
            tag: 'script',
            injectTo: 'head-prepend',
            children: `(function(){var a=DOMTokenList.prototype.add,r=DOMTokenList.prototype.remove;var clean=function(method){return function(){var kept=[];for(var i=0;i<arguments.length;i++){if(typeof arguments[i]==='string'&&arguments[i].length>0)kept.push(arguments[i]);}if(kept.length)return method.apply(this,kept);};};DOMTokenList.prototype.add=clean(a);DOMTokenList.prototype.remove=clean(r);})();`,
          }];
        },
      } satisfies PluginOption,
      // Hard polyfill of Node built-ins (vite's browser externalisation would
      // otherwise replace them with an empty stub before resolve.alias runs).
      {
        name: 'node-polyfills-alias',
        enforce: 'pre',
        resolveId(id) {
          const map: Record<string, string> = {
            events: resolve(MONO_ROOT, 'node_modules/.pnpm/events@3.3.0/node_modules/events/events.js'),
            buffer: resolve(MONO_ROOT, 'node_modules/.pnpm/buffer@5.7.1/node_modules/buffer/index.js'),
            process: resolve(MONO_ROOT, 'node_modules/.pnpm/process@0.11.10/node_modules/process/browser.js'),
          };
          return map[id] ?? null;
        },
      } satisfies PluginOption,
      webpackCompat(),
      // foliojs linebreak / grapheme-breaker ship Node-only source that reads
      // classes.trie via fs.readFileSync(__dirname + '/classes.trie'). Inline the
      // trie data and neutralise the `fs` require so they run in the browser.
      {
        name: 'trie-breaker-browser-fix',
        enforce: 'pre',
        transform(code, id) {
          const nid = id.replace(/\\/g, '/');
          if (nid.includes('/linebreak/src/linebreaker.js')) {
            const trieB64 = readFileSync(resolve(MONO_ROOT, 'node_modules/.pnpm/linebreak@0.3.0/node_modules/linebreak/src/classes.trie'), 'base64');
            let changed = false;
            let out = code.replace(/fs\s*=\s*require\(['"]fs['"]\)\s*;?/, () => { changed = true; return 'fs = null;'; });
            out = out.replace(/fs\.readFileSync\([^)]*classes\.trie[^)]*\)/, () => { changed = true; return `'${trieB64}'`; });
            return changed ? out : null;
          }
          if (nid.includes('/grapheme-breaker/src/GraphemeBreaker.js')) {
            const trieB64 = readFileSync(resolve(MONO_ROOT, 'node_modules/.pnpm/grapheme-breaker@0.3.2/node_modules/grapheme-breaker/src/classes.trie'), 'base64');
            let changed = false;
            let out = code.replace(/fs\s*=\s*require\(['"]fs['"]\)\s*;?/, () => { changed = true; return 'fs = null;'; });
            out = out.replace(
              /fs\.readFileSync\([^)]*classes\.trie[^)]*\)/,
              () => { changed = true; return `Uint8Array.from(atob('${trieB64}'), c => c.charCodeAt(0))`; },
            );
            return changed ? out : null;
          }
          return null;
        },
      } satisfies PluginOption,
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
        include: [/node_modules/, /packages\/(?!blocks-ui\/.dist)/],
      },
      rollupOptions: {
        plugins: [
          inject({
            Buffer: [resolve(MONO_ROOT, 'node_modules/.pnpm/buffer@5.7.1/node_modules/buffer/index.js'), 'Buffer'],
            process: [resolve(MONO_ROOT, 'node_modules/.pnpm/process@0.11.10/node_modules/process/browser.js'), 'default'],
            global: [resolve(MONO_ROOT, 'apps/web/vendor/global.cjs'), 'default'],
          }),
        ],
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
