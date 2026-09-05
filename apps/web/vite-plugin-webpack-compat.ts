import type { Plugin } from 'vite';
import { resolve as pathResolve, dirname } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Vite plugin for webpack → Vite migration compat.
 * 1. CSS Modules: all .css imports from packages/ get virtual module treatment
 *    to bypass Rollup's inability to resolve CSS files outside project root.
 * 2. Webpack inline loader syntax: strips !loader-path!file-path prefixes in
 *    resolveId so that any remaining webpack-style imports resolve correctly.
 * 3. Strips webpack inline loader syntax (!url-loader! etc.) via transform.
 * 4. Strips broken Flow prop-type imports from react-virtualized
 */
const CSS_MODULE_PREFIX = '\0css-module:';

export default function webpackCompatPlugin(): Plugin {
  return {
    name: 'webpack-compat',
    enforce: 'pre',
    resolveId(id: string, importer: string | undefined) {
      // Handle ?commonjs-external suffix from our own transform
      if (id.endsWith('?commonjs-external')) {
        const realId = id.replace('?commonjs-external', '');
        this.warn(`External CJS: ${realId} (from ${importer || 'unknown'})`);
        return { id: realId, external: true };
      }

      // Handle webpack inline loader syntax: !loader-path!file-path
      // Strips the !...! prefix and resolves the actual file path.
      // Matches patterns like: !../../tw-recolor/build!./icons/group.svg
      const webpackLoaderMatch = id.match(/^(?:!+[^!]+!)+(.+)$/);
      if (webpackLoaderMatch && importer) {
        const filePath = webpackLoaderMatch[1];
        const dir = dirname(importer);
        const resolved = pathResolve(dir, filePath);
        if (existsSync(resolved)) {
          return resolved;
        }
      }

      // CSS Modules: redirect .css imports from source to virtual modules
      if (
        id.endsWith('.css') &&
        !id.includes('?') &&
        importer &&
        !importer.includes('node_modules')
      ) {
        // Resolve the actual file path
        const dir = dirname(importer);
        const resolved = pathResolve(dir, id);
        if (existsSync(resolved)) {
          return CSS_MODULE_PREFIX + resolved.replace(/\.css$/, '.css.js');
        }
      }
      return null;
    },
    load(id) {
      // Handle virtual CSS modules
      if (!id.startsWith(CSS_MODULE_PREFIX)) return null;
      const filePath = id.slice(CSS_MODULE_PREFIX.length).replace(/\.css\.js$/, '.css');
      try {
        const css = readFileSync(filePath, 'utf-8');
        // Extract class names from CSS
        const classMap: Record<string, string> = {};
        const seen = new Set<string>();
        const regex = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
        let match;
        while ((match = regex.exec(css)) !== null) {
          const cls = match[1];
          if (!seen.has(cls) && !cls.startsWith('keyframes') && cls !== 'from' && cls !== 'to') {
            seen.add(cls);
            classMap[cls] = cls.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
          }
        }
        const entries = Object.entries(classMap).map(([k, v]) => `  "${k}": "${v}"`).join(',\n');
        return `export default {\n${entries}\n};`;
      } catch {
        return 'export default {};';
      }
    },
    transform(code: string, id: string) {
      let result = code;
      let changed = false;

      // Handle react-virtualized broken Flow prop-type imports
      if (id.includes('react-virtualized')) {
        result = result.replace(
          /import\s*\{[^}]*bpfrpt_proptype_\w+[^}]*\}\s*from\s*['"][^'"\n]+['"];?/g,
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

      // Handle !!loader?opts!path or !loader?opts!path (simple loader names)
      result = result.replace(
        /["']!{1,2}[\w-]+(\?[^"']+)?!([^"'\n]+)["']/g,
        (_m, _opts, path) => { changed = true; return `"${path}?url"`; },
      );

      // Handle webpack inline loader syntax with relative loader paths
      // e.g. !../../tw-recolor/build!./icons/group.svg
      result = result.replace(
        /import\s+(\w+)\s+from\s+["']!([^!]+)!([^"'\n]+)["']/g,
        (_m, name, _loader, path) => { changed = true; return `import ${name} from "${path}"`; },
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

      // worker-loader inline syntax (no leading '!', JSON query):
      //   require('worker-loader?{...}!./path.worker')
      //   require('worker-loader?name=...!./path.worker')
      // Vite has no worker-loader equivalent; replace with null so call sites
      // receive `null` and fall through to their existing fallback / try-catch.
      result = result.replace(
        /require\(["']worker-loader\?[^"']+["']\)/g,
        () => { changed = true; return 'null'; },
      );
      // Same pattern but already converted to ESM `import "..."` form.
      result = result.replace(
        /\bimport\s*["']worker-loader\?[^"']+["']\s*;?/g,
        () => { changed = true; return ''; },
      );

      return changed ? result : null;
    },
  };
}
