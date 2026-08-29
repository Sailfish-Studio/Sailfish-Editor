import type { Plugin } from 'vite';

/**
 * Vite plugin that converts bare CJS module.exports in workspace packages
 * to ESM-compatible guarded versions. This handles cases where
 * @rollup/plugin-commonjs doesn't process certain workspace files.
 */
export default function cjsShimPlugin(): Plugin {
  return {
    name: 'sailfish-cjs-shim',
    enforce: 'pre',
    transform(code: string, id: string) {
      // Only process workspace package files (not node_modules, not blocks-ui dist)
      if (!/packages\/(?!blocks-ui\/dist)/.test(id)) return null;
      // Skip files already handled by CJS plugin
      if (/\bvar\s+module\b/.test(code) || /\bvar\s+__toCommonJS\b/.test(code)) return null;
      // Only process files with module.exports
      if (!code.includes('module.exports')) return null;
      
      // Replace bare module.exports assignments with guarded versions
      // Pattern: module.exports = X  →  if(typeof module!=="undefined")module.exports=X
      // Pattern: module.exports.X = Y  →  if(typeof module!=="undefined")module.exports.X=Y
      let transformed = code;
      let changed = false;
      
      // Guard module.exports = value (not already guarded)
      const assignRegex = /(?<!typeof module!=="undefined"\s*\&\&\s*)(?<!typeof module<"u"\s*\&\&\s*)module\.exports\s*=\s*/g;
      
      transformed = transformed.replace(assignRegex, (match, offset) => {
        // Check if already guarded (look backwards for typeof)
        const before = transformed.slice(Math.max(0, offset - 60), offset);
        if (before.includes('typeof module')) return match;
        changed = true;
        return 'if(typeof module!=="undefined")' + match;
      });
      
      if (changed) {
        return { code: transformed, map: null };
      }
      return null;
    },
  };
}
