/*
 * Clean up package.json files: remove webpack-specific deps,
 * keep only what Vite + runtime actually needs.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Webpack-specific packages to remove from deps/devDeps everywhere
const WEBPACK_DEPS_TO_REMOVE = [
  'webpack', 'webpack-cli', 'webpack-dev-server',
  'html-webpack-plugin', 'copy-webpack-plugin', 'uglifyjs-webpack-plugin',
  'css-loader', 'style-loader', 'postcss-loader', 'babel-loader',
  'file-loader', 'url-loader', 'raw-loader', 'base64-loader', 'arraybuffer-loader',
  'worker-loader', 'expose-loader', 'script-loader',
  'mini-css-extract-plugin', 'optimize-css-assets-webpack-plugin',
  'terser-webpack-plugin', 'webpack-merge', 'webpack-bundle-analyzer',
  'eslint-import-resolver-webpack',
  'google-closure-compiler', 'google-closure-compiler-js',
  'scratch-blocks-translate', 'scratch-gui-translations',
];

// Packages that are only needed for testing (not for build/deploy)
const TEST_ONLY_DEPS = [
  'jest', 'jest-junit', 'enzyme', 'enzyme-adapter-react-16',
  'react-test-renderer', 'redux-mock-store', 'selenium-webdriver',
  'chromedriver', 'web-audio-test-api', 'raf',
  'commitizen', 'cz-conventional-changelog', 'commitlint',
  '@commitlint/cli', '@commitlint/config-conventional',
  'husky', 'lint-staged',
];

const PACKAGES_TO_CLEAN = [
  'scratch-gui', 'scratch-vm', 'scratch-render', 'scratch-blocks',
  'scratch-paint', 'scratch-storage', 'scratch-svg-renderer',
  'scratch-parser', 'scratch-audio', 'nanolog', 'sb3fix',
];

for (const pkg of PACKAGES_TO_CLEAN) {
  const pkgPath = resolve(ROOT, pkg, 'package.json');
  if (!readFileSync(pkgPath, 'utf8')) continue;
  
  const json = JSON.parse(readFileSync(pkgPath, 'utf8'));
  let changed = false;
  
  for (const [section, depsToRemove] of [
    ['dependencies', WEBPACK_DEPS_TO_REMOVE],
    ['devDependencies', [...WEBPACK_DEPS_TO_REMOVE, ...TEST_ONLY_DEPS]],
  ]) {
    if (!json[section]) continue;
    for (const dep of depsToRemove) {
      if (json[section][dep]) {
        delete json[section][dep];
        changed = true;
        console.log(`  ${pkg}: removed ${dep} from ${section}`);
      }
    }
  }
  
  // Remove empty devDependencies
  if (json.devDependencies && Object.keys(json.devDependencies).length === 0) {
    delete json.devDependencies;
    changed = true;
  }
  
  if (changed) {
    writeFileSync(pkgPath, JSON.stringify(json, null, 2) + '\n');
    console.log(`  ${pkg}: saved`);
  }
}

console.log('\nDone cleaning package.json files');
