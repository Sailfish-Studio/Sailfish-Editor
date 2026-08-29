import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postcssImport from 'postcss-import';
import postcssVars from 'postcss-simple-vars';
import autoprefixer from 'autoprefixer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.ROOT || '';
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '8601', 10);

// Read brand
// eslint-disable-next-line import/no-anonymous-default-export
export default defineConfig(({ mode }) => {
  const APP_NAME = 'Sailfish Studio';

  return {
    // Dev server
    server: {
      port: PORT,
      host: '0.0.0.0',
      open: false,
      historyApiFallback: true,
    },

    // Base path
    base: ROOT || '/',

    // Resolve
    resolve: {
      alias: {
        'text-encoding$': resolve(__dirname, 'src/lib/tw-text-encoder'),
        'scratch-render-fonts$': resolve(__dirname, 'src/lib/tw-scratch-render-fonts'),
      },
    },

    // CSS
    css: {
      modules: {
        // Match webpack's naming: [name]_[local]_[hash:base64:5]
        localsConvention: 'camelCase',
        generateScopedName: '[name]_[local]_[hash:base64:5]',
      },
      postcss: {
        plugins: [
          postcssImport,
          postcssVars,
          autoprefixer,
        ],
      },
      preprocessorOptions: {},
    },

    // JSX
    plugins: [
      react({
        babel: {
          plugins: [
            ['react-intl', {
              messagesDir: './translations/messages/',
            }],
          ],
          presets: [
            ['@babel/preset-env', {
              targets: '> 1%, not dead',
            }],
            ['@babel/preset-react', {
              runtime: 'automatic',
            }],
          ],
        },
      }),
    ],

    // Environment defines (replaces webpack.DefinePlugin)
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.DEBUG': JSON.stringify(!!process.env.DEBUG),
      'process.env.ENABLE_SERVICE_WORKER': JSON.stringify(process.env.ENABLE_SERVICE_WORKER || ''),
      'process.env.ROOT': JSON.stringify(ROOT),
      'process.env.ROUTING_STYLE': JSON.stringify(process.env.ROUTING_STYLE || 'filehash'),
      'process.env.ENABLE_WINDCHIMES': JSON.stringify(process.env.ENABLE_WINDCHIMES || ''),
    },

    // Multi-page build (replaces multiple webpack entries + HtmlWebpackPlugin)
    build: {
      outDir: 'build',
      sourcemap: mode === 'development' ? 'inline' : false,
      minify: IS_PROD,
      target: 'esnext',
      // Copy static assets
      rollupOptions: {
        input: {
          editor: resolve(__dirname, 'src/playground/editor.html'),
          player: resolve(__dirname, 'src/playground/index.html'),
          fullscreen: resolve(__dirname, 'src/playground/fullscreen.html'),
          embed: resolve(__dirname, 'src/playground/embed.html'),
          'addon-settings': resolve(__dirname, 'src/playground/addons.html'),
          credits: resolve(__dirname, 'src/playground/credits.html'),
        },
        // Code splitting (replaces webpack splitChunks)
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-redux', 'redux'],
            'vendor-scratch': [
              'scratch-vm',
              'scratch-render',
              'scratch-blocks',
              'scratch-paint',
            ],
          },
        },
      },
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },

    // Public directory (for blocks-media, images, etc.)
    publicDir: resolve(__dirname, 'static'),

    // Optimize deps
    optimizeDeps: {
      include: [
        'react', 'react-dom', 'react-redux', 'redux',
        'scratch-vm', 'scratch-render', 'scratch-blocks', 'scratch-paint',
        '@sailfish-studio/scratch-storage',
        '@sailfish-studio/scratch-svg-renderer',
        '@sailfish-studio/jszip',
        '@sailfish-studio/nanolog',
      ],
      // Force re-bundling of scratch-* packages from workspace
      force: true,
    },
  };
});
