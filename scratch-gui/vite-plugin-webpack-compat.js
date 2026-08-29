/**
 * Vite plugin to handle webpack inline loader syntax
 * Transforms: !css-loader!, !url-loader!, !raw-loader!, !!file-loader?opts!
 */
export default function webpackCompatPlugin () {
  return {
    name: 'webpack-compat',
    enforce: 'pre',
    transform (code, id) {
      if (id.includes('node_modules')) return null;
      let result = code;
      let changed = false;

      // CSS Modules: webpack treated ALL .css imports as CSS Modules.
      // Vite needs ?module suffix. Also transform default imports to namespace imports
      // because Rollup CSS modules use named exports, not default.
      result = result.replace(
        /(import\s+)(\w+)(\s+from\s+['"])([^'"\n]+\.css)(['"])/g,
        (match, imp, name, mid, path, suffix) => {
          if (path.includes('?module') || path.includes('.module.css')) {
            // Already has ?module, just ensure namespace import
            changed = true;
            return `${imp}* as ${name}${mid}${path}${suffix}`;
          }
          changed = true;
          return `${imp}* as ${name}${mid}${path}?module${suffix}`;
        }
      );

      // Handle !!loader?opts!path or !loader?opts!path (any loader with query)
      result = result.replace(
        /["']!{1,2}[\w-]+(\?[^"']+)?!([^"'\n]+)["']/g,
        (_m, _opts, path) => { changed = true; return `"${path}?url"`; }
      );

      // Single loader, no query, import form (double quotes)
      // import X from "!url-loader!./file.svg" -> import X from "./file.svg?url"
      result = result.replace(
        /import\s+(\w+)\s+from\s+"!url-loader!([^"\n]+)"/g,
        (_m, name, path) => { changed = true; return `import ${name} from "${path}?url"`; }
      );
      result = result.replace(
        /import\s+(\w+)\s+from\s+"!css-loader!([^"\n]+)"/g,
        (_m, name, path) => { changed = true; return `import ${name} from "${path}?inline"`; }
      );
      result = result.replace(
        /import\s+(\w+)\s+from\s+"!raw-loader!([^"\n]+)"/g,
        (_m, name, path) => { changed = true; return `import ${name} from "${path}?raw"`; }
      );

      // Single loader, require form
      result = result.replace(
        /require\(["']!url-loader!([^"'\n]+)["']\)/g,
        (_m, path) => { changed = true; return `require("${path}?url")`; }
      );
      result = result.replace(
        /require\(["']!css-loader!([^"'\n]+)["']\)/g,
        (_m, path) => { changed = true; return `require("${path}?inline")`; }
      );
      result = result.replace(
        /require\(["']!raw-loader!([^"'\n]+)["']\)/g,
        (_m, path) => { changed = true; return `require("${path}?raw")`; }
      );

      return changed ? result : null;
    },
  };
}
