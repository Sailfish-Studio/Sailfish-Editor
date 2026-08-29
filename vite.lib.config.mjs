/**
 * Shared Vite library config for Sailfish Studio packages
 * Usage: import { createLibConfig } from '../../vite.lib.config.mjs';
 *        export default defineConfig(createLibConfig({ ... }))
 */
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));

/**
 * Create a Vite config for building a library package
 * @param {object} options
 * @param {string} options.name - Package directory name (e.g. 'scratch-vm')
 * @param {string} options.entry - Entry file relative to package dir (e.g. 'src/index.js')
 * @param {string} [options.outputName] - Output file name (defaults to package dir name)
 * @param {string[]} [options.external] - Additional externals
 * @param {string} [options.format] - Output format: 'esm' | 'umd' | 'esm+umd'
 * @param {object} [options.define] - Additional define values
 * @param {object} [options.resolve] - Additional resolve config
 * @param {object} [options.css] - CSS config (for packages with CSS modules)
 */
export function createLibConfig({
  name,
  entry = 'src/index.js',
  outputName,
  external = [],
  format = 'esm',
  define = {},
  resolve: extraResolve = {},
  css: extraCss = {},
}) {
  const pkgDir = resolve(__dirname, name);
  const pkgJsonPath = resolve(pkgDir, 'package.json');
  let pkgJson = {};
  try {
    pkgJson = require(pkgJsonPath);
  } catch {
    // package.json might not exist
  }

  const libName = outputName || name;
  const isProd = process.env.NODE_ENV === 'production';

  const configs = [];

  // Common base config
  const baseConfig = {
    root: pkgDir,
    build: {
      sourcemap: isProd ? false : 'external',
      minify: isProd,
      target: 'esnext',
      emptyOutDir: false,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      ...define,
    },
    resolve: {
      alias: {
        ...extraResolve,
      },
    },
  };

  if (extraCss && Object.keys(extraCss).length > 0) {
    baseConfig.css = extraCss;
  }

  if (format === 'esm' || format === 'esm+umd') {
    // ESM build
    configs.push({
      ...baseConfig,
      build: {
        ...baseConfig.build,
        outDir: resolve(pkgDir, 'dist'),
        lib: {
          entry: resolve(pkgDir, entry),
          name: libName,
          formats: ['es'],
          fileName: () => `${libName}.mjs`,
        },
        rollupOptions: {
          external: [
            'react', 'react-dom',
            'scratch-vm', 'scratch-render', 'scratch-blocks', 'scratch-paint',
            'scratch-storage', 'scratch-svg-renderer', 'scratch-parser',
            'scratch-audio',
            '@sailfish-studio/*', '@turbowarp/*',
            ...external,
          ],
        },
      },
    });
  }

  if (format === 'umd' || format === 'esm+umd') {
    // UMD build (for browser / node compatibility)
    configs.push({
      ...baseConfig,
      build: {
        ...baseConfig.build,
        outDir: resolve(pkgDir, 'dist/web'),
        lib: {
          entry: resolve(pkgDir, entry),
          name: libName,
          formats: ['umd'],
          fileName: () => `${libName}.js`,
        },
        rollupOptions: {
          external: [
            'react', 'react-dom',
            'scratch-vm', 'scratch-render', 'scratch-blocks', 'scratch-paint',
            'scratch-storage', 'scratch-svg-renderer', 'scratch-parser',
            'scratch-audio',
            '@sailfish-studio/*', '@turbowarp/*',
            ...external,
          ],
          output: {
            globals: {
              'scratch-vm': 'VirtualMachine',
              'scratch-render': 'ScratchRender',
              'scratch-blocks': 'ScratchBlocks',
              'scratch-paint': 'ScratchPaint',
              'scratch-storage': 'ScratchStorage',
              'scratch-svg-renderer': 'ScratchSVGRenderer',
              'scratch-parser': 'ScratchParser',
              'scratch-audio': 'AudioEngine',
            },
          },
        },
      },
    });
  }

  // If only ESM, wrap in array anyway for consistency
  if (configs.length === 0) {
    configs.push(baseConfig);
  }

  return configs.length === 1 ? configs[0] : configs;
}
