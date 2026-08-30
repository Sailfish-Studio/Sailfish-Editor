import type { Plugin } from 'vite';

const CJS_RE = /packages\/(?!blocks-ui\/dist)/;

export default function cjsToEsmPlugin(): Plugin {
  return {
    name: 'sailfish-cjs-to-esm',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (!CJS_RE.test(id)) return null;
      if (!/\brequire\(/.test(code) && !/\bmodule\.exports\b/.test(code)) return null;

      let result = code;
      let changed = false;
      const imports: string[] = [];

      // Step 1: Convert static require() to import statements
      // Pattern: const X = require('Y')
      let m: RegExpExecArray | null;
      const reqRe = /^const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/gm;
      while ((m = reqRe.exec(result)) !== null) {
        changed = true;
        imports.push(`import ${m[1]} from '${m[2]}';`);
        result = result.slice(0, m.index) + `/* cjs: require('${m[2]}') */` + result.slice(m.index + m[0].length);
        reqRe.lastIndex = m.index + 40; // skip replacement
      }

      // Pattern: const { A, B } = require('Y')
      const destrRe = /^const\s*\{([^}]+)\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/gm;
      while ((m = destrRe.exec(result)) !== null) {
        changed = true;
        imports.push(`import { ${m[1].trim()} } from '${m[2]}';`);
        result = result.slice(0, m.index) + `/* cjs: destructured require('${m[2]}') */` + result.slice(m.index + m[0].length);
        destrRe.lastIndex = m.index + 60;
      }

      // Step 2: Convert GUARDED module.exports to ESM exports
      // Pattern: if(typeof module!=="undefined")module.exports=X;
      // This MUST run before Step 3 (bare module.exports)
      result = result.replace(
        /if\s*\(\s*typeof\s+module\s*!?==?\s*["']u["']\s*&&\s*\(\s*module\.exports\s*=\s*([^)]+)\)\s*;?/g,
        (match, value: string) => {
          changed = true;
          return `export default ${value.trim()};`;
        }
      );
      // Also handle: if(typeof module!=="undefined")module.exports=X;  (without && wrapping)
      result = result.replace(
        /if\s*\(\s*typeof\s+module\s*!?==?\s*["'][^'"]*["']\s*\)\s*module\.exports\s*=\s*([^;\n]+)\s*;?/g,
        (match, value: string) => {
          changed = true;
          return `export default ${value.trim()};`;
        }
      );

      // Step 3: Convert bare module.exports = X to export default X
      // (only if not already exported)
      result = result.replace(
        /^(?![^\n]*export\s+default)\s*module\.exports\s*=\s*([^;\n]+)\s*;?/gm,
        (match, value: string, offset: number, str: string) => {
          // Skip if inside a typeof guard
          const before = str.slice(Math.max(0, offset - 60), offset);
          if (/typeof\s+module/.test(before)) return match;
          changed = true;
          return `export default ${value.trim()};`;
        }
      );

      // Step 4: Guard remaining module.exports.X = Y
      result = result.replace(
        /(?<!typeof\s+module[^;]{0,80})(?<!if\(typeof\s+module[^)]*\))module\.exports\.(\w+)\s*=/g,
        (match, prop: string, offset: number) => {
          const before = result.slice(Math.max(0, offset - 80), offset);
          if (/typeof\s+module/.test(before)) return match;
          if (/export\s/.test(before)) return match;
          changed = true;
          return `if(typeof module!=="undefined")module.exports.${prop}=`;
        }
      );

      // Step 5: Guard remaining bare require() calls
      result = result.replace(
        /(?<!typeof\s+require[^;]{0,80})\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        (match, modPath: string, offset: number) => {
          const before = result.slice(Math.max(0, offset - 80), offset);
          if (/typeof\s+require/.test(before)) return match;
          if (before.includes('import ')) return match;
          if (before.includes('/* cjs:')) return match;
          changed = true;
          return `(typeof require!=='undefined'?require('${modPath}'):void 0)`;
        }
      );

      if (!changed) return null;

      const finalCode = imports.length > 0
        ? imports.join('\n') + '\n' + result
        : result;

      return { code: finalCode, map: null };
    },
  };
}
