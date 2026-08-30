import type { Plugin } from 'vite';

const CJS_RE = /packages\/(?!blocks-ui\/dist)/;

function hasEsmSyntax(code: string): boolean {
  // Check for ESM import/export at line start (not inside strings/comments)
  const lines = code.split('\n');
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (/^import\b/.test(trimmed) || /^export\b/.test(trimmed)) return true;
  }
  return false;
}

export default function cjsToEsmPlugin(): Plugin {
  return {
    name: 'sailfish-cjs-to-esm',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (!CJS_RE.test(id)) return null;
      if (!/\brequire\b/.test(code) && !/\bmodule\b/.test(code)) return null;

      // Skip files with ESM syntax - let CJS plugin handle those
      if (hasEsmSyntax(code)) {
        // But still guard any module.exports that might be present
        if (/\bmodule\.exports\b/.test(code)) {
          let result = code;
          result = result.replace(
            /(?<!typeof module!=='undefined'&&)module\.exports\s*=\s*/g,
            (m: string, off: number) => {
              const before = result.slice(Math.max(0, off - 80), off);
              if (before.includes('typeof module')) return m;
              return 'if(typeof module!=="undefined")' + m;
            }
          );
          if (result !== code) return { code: result, map: null };
        }
        return null;
      }

      let result = code;
      let changed = false;

      // 1. Convert static require() to import statements
      // const X = require('Y')
      const staticRequireRe = /^const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/gm;
      const imports: string[] = [];
      result = result.replace(staticRequireRe, (_match, varName: string, modPath: string) => {
        changed = true;
        imports.push(`import ${varName} from '${modPath}';`);
        return `/* require('${modPath}') → ${varName} */`;
      });

      // const { A, B } = require('Y')
      const destructRequireRe = /^const\s*\{([^}]+)\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/gm;
      result = result.replace(destructRequireRe, (_match, props: string, modPath: string) => {
        changed = true;
        imports.push(`import { ${props.trim()} } from '${modPath}';`);
        return `/* require('${modPath}') destructured */`;
      });

      // 2. Convert module.exports = X to export default X
      // ONLY if NOT already inside a typeof module guard
      if (/\bmodule\.exports\s*=/.test(result)) {
        result = result.replace(
          /\bmodule\.exports\s*=\s*([^;\n]+)/g,
          (m: string, value: string, off: number) => {
            const before = result.slice(Math.max(0, off - 80), off);
            if (before.includes('typeof module')) return m;
            changed = true;
            return `export default ${value.trim()}`;
          }
        );
      }

      // 3. Guard remaining require() calls
      if (/\brequire\s*\(/.test(result)) {
        result = result.replace(
          /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
          (m: string, modPath: string, off: number) => {
            const before = result.slice(Math.max(0, off - 80), off);
            if (before.includes('typeof require')) return m;
            if (before.includes('import ') || before.includes('/* require')) return m;
            changed = true;
            return `(typeof require!=='undefined'?require('${modPath}'):void 0)`;
          }
        );
      }

      // 4. Guard remaining module.exports.X = Y
      if (/\bmodule\.exports\.\w+\s*=/.test(result)) {
        result = result.replace(
          /(?<!typeof module!=='undefined'&&)module\.exports\.(\w+)\s*=/g,
          (m: string, _prop: string, off: number) => {
            const before = result.slice(Math.max(0, off - 80), off);
            if (before.includes('typeof module')) return m;
            changed = true;
            return 'if(typeof module!=="undefined")' + m;
          }
        );
      }

      if (!changed) return null;

      // Add imports at the top
      const finalCode = imports.length > 0
        ? imports.join('\n') + '\n' + result
        : result;

      return { code: finalCode, map: null };
    },
  };
}
