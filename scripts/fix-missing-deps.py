#!/usr/bin/env python3
"""Fix missing dependencies in workspace packages for pnpm strict isolation."""

import json, os, re, subprocess
from pathlib import Path

MONO_ROOT = Path(__file__).resolve().parent.parent
PACKAGES_DIR = MONO_ROOT / "packages"
NODE_MODULES = MONO_ROOT / "node_modules"

IMPORT_RE = re.compile(
    r"import\s+.+?\s+from\s+['\"]([^'\"]+)['\"]"
    r"|require\(\s*['\"]([^'\"]+)['\"]\s*\)"
    r"|import\s+['\"]([^'\"]+)['\"]"
)
NODE_BUILTINS = frozenset(['events','fs','path','stream','buffer','crypto','http','https','url','util','os'])


def get_version(pkg_name):
    pkg_dir = NODE_MODULES / pkg_name
    if pkg_dir.is_dir():
        pj = pkg_dir / "package.json"
        if pj.exists():
            return json.loads(pj.read_text()).get("version", "*")
    result = subprocess.run(
        ["bash", "-c", f"ls {NODE_MODULES}/.pnpm/ | grep '^{re.escape(pkg_name)}@' | head -1"],
        capture_output=True, text=True
    )
    pat = re.compile(r'^' + re.escape(pkg_name) + r'@([^/]+)')
    m = pat.search(result.stdout.strip())
    return m.group(1) if m else None


def find_external_imports(pkg_dir):
    imports = set()
    src_dir = pkg_dir / "src"
    if not src_dir.exists():
        return imports
    for root, dirs, files in os.walk(src_dir):
        for fname in files:
            if not fname.endswith(('.js', '.jsx')):
                continue
            try:
                content = open(os.path.join(root, fname)).read()
            except Exception:
                continue
            for m in IMPORT_RE.finditer(content):
                mod = m.group(1) or m.group(2) or m.group(3)
                if mod.startswith('.') or mod.startswith('@sailfish/'):
                    continue
                if '!' in mod or mod.endswith('?raw') or mod.endswith('?inline'):
                    continue
                parts = mod.split('/')
                pkg = f"{parts[0]}/{parts[1]}" if mod.startswith('@') and len(parts) > 1 else parts[0]
                if pkg in NODE_BUILTINS:
                    continue
                imports.add(pkg)
    return imports


def get_declared_deps(pkg_json_path):
    data = json.loads(pkg_json_path.read_text())
    deps = set()
    for key in ('dependencies', 'devDependencies', 'peerDependencies'):
        deps.update(data.get(key, {}).keys())
    return deps


def main():
    total = 0
    for pkg_name in ["ui", "core", "render", "shared", "paper", "blocks-ui"]:
        pkg_json_path = PACKAGES_DIR / pkg_name / "package.json"
        if not pkg_json_path.exists():
            continue
        imports = find_external_imports(PACKAGES_DIR / pkg_name)
        declared = get_declared_deps(pkg_json_path)
        missing = imports - declared
        if not missing:
            print(f"@sailfish/{pkg_name}: OK")
            continue
        print(f"@sailfish/{pkg_name}: {len(missing)} missing deps")
        new_deps = {}
        for dep in sorted(missing):
            ver = get_version(dep)
            new_deps[dep] = f"^{ver}" if ver else "*"
            print(f"  + {dep}@{new_deps[dep]}")
        data = json.loads(pkg_json_path.read_text())
        data.setdefault('dependencies', {}).update(new_deps)
        pkg_json_path.write_text(json.dumps(data, indent=2) + '\n')
        total += len(new_deps)
    print(f"\nTotal: {total} dependencies added")


if __name__ == '__main__':
    main()
