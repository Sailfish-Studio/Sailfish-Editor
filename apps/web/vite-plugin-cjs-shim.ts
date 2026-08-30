import type { Plugin } from 'vite';

/**
 * Vite plugin that converts bare CJS patterns in workspace packages to
 * ESM-compatible guarded versions. Handles both require() and module.exports.
 */
export default function cjsShimPlugin(): Plugin {
  return {
    name: 'sailfish-cjs-shim',
    enforce: 'pre',
    transform(code: string, id: string) {
      // Only workspace packages
      if (!/packages/(?!blocks-ui/.dist)/.test(id)) return null;
      // Skip non-JS files
      if (!/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(id)) return null;
      // Skip files already processed by CJS plugin
      if (/\bvar\s+module\b/.test(code) || /\bvar\s+__toCommonJS\b/.test(code)) return null;
      // Must have CJS patterns
      if (!code.includes('module.exports') && !code.includes('require(')) return null;

      let transformed = code;
      let changed = false;

      // 1. Guard module.exports = X
      transformed = transformed.replace(
        /(?<!if\(typeof\s+module!=='undefined'\s*&&\s*)module\.exports\s*=\s*/g,
        (match, offset: number) => {
          const before = transformed.slice(Math.max(0, offset - 60), offset);
          if (before.includes('typeof module') || before.includes('typeof module<')) return match;
          changed = true;
          return 'if(typeof module!=="undefined")' + match;
        }
      );

      // 2. Guard module.exports.X = Y
      transformed = transformed.replace(
        /(?<!if\(typeof\s+module!=='undefined'\s*&&\s*)module\.exports\.\w+\s*=/g,
        (match, offset: number) => {
          const before = transformed.slice(Math.max(0, offset - 60), offset);
          if (before.includes('typeof module') || before.includes('typeof module<')) return match;
          changed = true;
          return 'if(typeof module!=="undefined")' + match;
        }
      );

      // 3. Replace require() with a safe fallback
      // Pattern: require('module-name') → typeof require!=='undefined'?require('module-name'):undefined
      // But only for bare require calls, not already guarded
      if (transformed.includes('require(')) {
        // Match require('...') that isn't already guarded
        transformed = transformed.replace(
          /(?<!typeof\s+require!==['"']undefined['"']\s*\?\s*)require\s*\(\s*['"']([^'"']+)['"']\s*\)/g,
          (match: string, modName: string, offset: number) => {
            const before = transformed.slice(Math.max(0, offset - 80), offset);
            if (before.includes('typeof require')) return match;
            changed = true;
            // For Node builtins that Vite externalizes, use a try/catch dynamic import pattern
            // For other modules, the CJS plugin should handle them
            // Use a simple inline check
            return `(typeof require!=='undefined'?require('${modName}':void 0)`;
          }
        );
      }

      if (changed) {
        return { code: transformed, map: null };
      }
      return null;
    },
  };
}
