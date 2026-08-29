import type { Plugin } from 'vite';

/**
 * Vite plugin for webpack → Vite migration compat.
 * 1. Strips webpack inline loader syntax (!url-loader! etc.)
 * 2. CSS Modules: adds ?module suffix, converts default→namespace imports
 * 3. Strips broken Flow prop-type imports from react-virtualized
 */
export default function webpackCompatPlugin(): Plugin {
  return {
    name: 'webpack-compat',
    enforce: 'pre',
    transform(code: string, id: string) {
      let result = code;
      let changed = false;

      // Handle react-virtualized broken Flow prop-type imports (in transform phase for rollup)
      if (id.includes('react-virtualized')) {
        result = result.replace(
          /import\s*\{[^}]*bpfrpt_proptype_\w+[^}]*\}\s*from\s*['"][^'"]+['"];?/g,
          () => { changed = true; return ''; },
        );
        result = result.replace(
          /export\s*\{[^}]*bpfrpt_proptype_\w+[^}]*\};?/g,
          () => { changed = true; return ''; },
        );
        if (changed) return result;
      }

      // Skip node_modules for the rest
      if (id.includes('node_modules')) return null;

      // CSS Modules: webpack treated ALL .css imports as CSS Modules.
      // Vite needs ?module suffix. Transform default imports to namespace imports.
      result = result.replace(
        /(import\s+)(\w+)(\s+from\s+['"])([^'"\n]+\.css)(['"])/g,
        (match, imp, name, mid, path, suffix) => {
          if (path.includes('?module') || path.includes('.module.css')) {
            changed = true;
            return `${imp}* as ${name}${mid}${path}${suffix}`;
          }
          changed = true;
          return `${imp}* as ${name}${mid}${path}?module${suffix}`;
        },
      );

      // Handle !!loader?opts!path or !loader?opts!path
      result = result.replace(
        /["']!{1,2}[\w-]+(\?[^"']+)?!([^"'\n]+)["']/g,
        (_m, _opts, path) => { changed = true; return `"${path}?url"`; },
      );

      // Single loader imports
      result = result.replace(
        /import\s+(\w+)\s+from\s+"!url-loader!([^"\n]+)"/g,
        (_m, name, path) => { changed = true; return `import ${name} from "${path}?url"`; },
      );
      result = result.replace(
        /import\s+(\w+)\s+from\s+"!css-loader!([^"\n]+)"/g,
        (_m, name, path) => { changed = true; return `import ${name} from "${path}?inline"`; },
      );
      result = result.replace(
        /import\s+(\w+)\s+from\s+"!raw-loader!([^"\n]+)"/g,
        (_m, name, path) => { changed = true; return `import ${name} from "${path}?raw"`; },
      );

      // Single loader requires
      result = result.replace(
        /require\(["']!url-loader!([^"'\n]+)["']\)/g,
        (_m, path) => { changed = true; return `require("${path}?url")`; },
      );
      result = result.replace(
        /require\(["']!css-loader!([^"'\n]+)["']\)/g,
        (_m, path) => { changed = true; return `require("${path}?inline")`; },
      );
      result = result.replace(
        /require\(["']!raw-loader!([^"'\n]+)["']\)/g,
        (_m, path) => { changed = true; return `require("${path}?raw")`; },
      );

      return changed ? result : null;
    },
  };
}
