#!/usr/bin/env python3
"""
Reorganize flat monorepo into packages/ + apps/ structure.
"""
import os, json, shutil, re

ROOT = '/home/z/my-project'
os.chdir(ROOT)

# === 1. Move packages ===
PKG_MAP = {
    'scratch-vm':           'packages/core',
    'scratch-render':       'packages/render',
    'scratch-gui':          'packages/ui',
    'scratch-blocks':       'packages/blocks-ui',
    'scratch-parser':       'packages/parser',
    'scratch-storage':      'packages/storage',
    'scratch-svg-renderer': 'packages/svg-renderer',
    'scratch-audio':        'packages/audio',
    'scratch-paint':        'packages/paint',
    'nanolog':              'packages/nanolog',
    'jszip':                'packages/jszip',
    'sb3fix':               'packages/sb3fix',
    'paper.js':             'packages/paper',
}

# Name mapping: old package name -> new package name
NAME_MAP = {
    'scratch-vm':                    '@sailfish-studio/core',
    'scratch-render':                '@sailfish-studio/render',
    'scratch-gui':                   '@sailfish-studio/ui',
    'scratch-blocks':                '@sailfish-studio/blocks-ui',
    'scratch-parser':                '@sailfish-studio/parser',
    'scratch-audio':                 '@sailfish-studio/audio',
    'scratch-paint':                 '@sailfish-studio/paint',
    '@sailfish-studio/scratch-storage':    '@sailfish-studio/storage',
    '@sailfish-studio/scratch-svg-renderer': '@sailfish-studio/svg-renderer',
    'scratch-storage':               '@sailfish-studio/storage',
    'scratch-svg-renderer':          '@sailfish-studio/svg-renderer',
    # These keep their names
    '@sailfish-studio/nanolog':      '@sailfish-studio/nanolog',
    '@sailfish-studio/jszip':        '@sailfish-studio/jszip',
    '@sailfish-studio/sb3fix':       '@sailfish-studio/sb3fix',
    '@sailfish-studio/paper':        '@sailfish-studio/paper',
}

print('=== Creating directory structure ===')
for d in ['packages', 'apps/web/src', 'apps/desktop', 'scripts', 'tests/unit', 'packages/shared/src/types', 'packages/shared/src/constants', 'packages/shared/src/helpers']:
    os.makedirs(d, exist_ok=True)
    print(f'  mkdir {d}')

print('\n=== Moving packages ===')
for old, new in PKG_MAP.items():
    if os.path.exists(old) and not os.path.exists(new):
        shutil.move(old, new)
        print(f'  {old}/ -> {new}/')
    elif os.path.exists(new):
        print(f'  SKIP {new}/ already exists')
    else:
        print(f'  MISSING {old}/')

print('\n=== Cleaning up: remove non-workspace dirs ===')
for d in ['cloud-server', 'packager', 'scaffolding', 'upload', 'download', 'tool-results']:
    if os.path.isdir(d):
        shutil.rmtree(d)
        print(f'  rm -rf {d}')

# Move translations to packages/ui/
if os.path.isdir('translations') and not os.path.isdir('packages/ui/translations'):
    shutil.move('translations', 'packages/ui/translations')
    print('  translations/ -> packages/ui/translations/')

print('\n=== Updating package.json names ===')
for old_name, new_name in NAME_MAP.items():
    # find which package dir has this name
    for dirpath, dirnames, filenames in os.walk('packages'):
        if 'package.json' in filenames:
            pkg_path = os.path.join(dirpath, 'package.json')
            with open(pkg_path, 'r') as f:
                content = f.read()
            if f'"name": "{old_name}"' in content:
                content = content.replace(f'"name": "{old_name}"', f'"name": "{new_name}"')
                with open(pkg_path, 'w') as f:
                    f.write(content)
                print(f'  {pkg_path}: {old_name} -> {new_name}')

print('\n=== Updating all dependency references ===')
dep_updates = 0
for dirpath, dirnames, filenames in os.walk('packages'):
    # skip node_modules
    dirnames[:] = [d for d in dirnames if d != 'node_modules']
    if 'package.json' in filenames:
        pkg_path = os.path.join(dirpath, 'package.json')
        with open(pkg_path, 'r') as f:
            data = json.load(f)
        changed = False
        for dep_section in ['dependencies', 'devDependencies', 'peerDependencies']:
            deps = data.get(dep_section, {})
            new_deps = {}
            for k, v in list(deps.items()):
                new_k = NAME_MAP.get(k, k)
                if new_k != k:
                    changed = True
                new_deps[new_k] = v
            if changed:
                data[dep_section] = new_deps
        if changed:
            with open(pkg_path, 'w') as f:
                json.dump(data, f, indent=2)
                f.write('\n')
            dep_updates += 1
            print(f'  updated {pkg_path}')
print(f'  Total: {dep_updates} package.json files updated')

print('\n=== Removing sub-repo .github/workflows ===')
removed = 0
for dirpath, dirnames, filenames in os.walk('packages'):
    if '.github' in dirnames:
        gh = os.path.join(dirpath, '.github')
        if os.path.isdir(os.path.join(gh, 'workflows')):
            shutil.rmtree(os.path.join(gh, 'workflows'))
            print(f'  rm -rf {gh}/workflows')
            removed += 1
        # Remove leftover .github if empty
        if os.path.isdir(gh) and not os.listdir(gh):
            shutil.rmtree(gh)
print(f'  Removed {removed} sub-repo workflow dirs')

print('\n=== Creating packages/shared/package.json ===')
shared_pkg = {
    'name': '@sailfish-studio/shared',
    'version': '0.1.0',
    'private': True,
    'main': 'src/index.js',
    'types': 'src/index.d.ts',
    'scripts': {},
    'dependencies': {},
    'devDependencies': {}
}
with open('packages/shared/package.json', 'w') as f:
    json.dump(shared_pkg, f, indent=2)
    f.write('\n')

# Create shared index files
with open('packages/shared/src/index.js', 'w') as f:
    f.write('// @sailfish-studio/shared - Unified types, constants, helpers\nexport {}\n')
with open('packages/shared/src/index.d.ts', 'w') as f:
    f.write('// @sailfish-studio/shared type definitions\nexport {}\n')
print('  Created packages/shared/')

print('\n=== Creating apps/web/package.json ===')
web_pkg = {
    'name': '@sailfish-studio/web',
    'version': '0.1.0',
    'private': True,
    'scripts': {
        'dev': 'bun --bun vite --config vite.config.ts',
        'build': 'vite build --config vite.config.ts',
        'preview': 'vite preview --config vite.config.ts'
    },
    'dependencies': {
        '@sailfish-studio/ui': 'workspace:*'
    },
    'devDependencies': {}
}
with open('apps/web/package.json', 'w') as f:
    json.dump(web_pkg, f, indent=2)
    f.write('\n')
print('  Created apps/web/')

# Move Vite config and static assets to apps/web
for item in ['vite.config.ts', 'vite-plugin-webpack-compat.ts', 'static', 'src/playground']:
    src = os.path.join('packages/ui', item)
    dst = os.path.join('apps/web', os.path.basename(item))
    if os.path.exists(src):
        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
        print(f'  copy {item} -> apps/web/')

# Copy HTML entries to apps/web root
for html in ['editor.html', 'index.html', 'fullscreen.html', 'embed.html', 'addons.html', 'credits.html']:
    src = os.path.join('packages/ui', 'src/playground', html)
    dst = os.path.join('apps/web', html)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f'  copy {html} -> apps/web/')

# Move src/playground HTML entries in packages/ui
for html in ['editor.html', 'index.html', 'fullscreen.html', 'embed.html', 'addons.html', 'credits.html']:
    dst = os.path.join('packages/ui', html)
    if os.path.exists(dst):
        os.remove(dst)

# Move scripts/
if os.path.isdir('scripts'):
    existing = os.listdir('scripts')
    for f in existing:
        if f in ['reorganize.py', 'rebrand.py', 'rebrand_fast.py', 'setup_workspace.py']:
            os.remove(os.path.join('scripts', f))
            print(f'  rm scripts/{f}')

print('\n=== Creating pnpm-workspace.yaml ===')
workspace_pkgs = []
for d in sorted(os.listdir('packages')):
    if os.path.isdir(os.path.join('packages', d)) and os.path.exists(os.path.join('packages', d, 'package.json')):
        workspace_pkgs.append(f'packages/{d}')
for d in sorted(os.listdir('apps')):
    if os.path.isdir(os.path.join('apps', d)) and os.path.exists(os.path.join('apps', d, 'package.json')):
        workspace_pkgs.append(f'apps/{d}')

with open('pnpm-workspace.yaml', 'w') as f:
    f.write('packages:\n')
    for pkg in workspace_pkgs:
        f.write(f'  - "{pkg}"\n')
print(f'  {len(workspace_pkgs)} workspace packages')

print('\n=== Creating root landing index.html ===')
landing = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sailfish Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f1117; color: #e6edf3; min-height: 100vh; display: flex; flex-direction: column; }
    header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; border-bottom: 1px solid #21262d; }
    .logo { font-size: 1.4rem; font-weight: 700; } .logo span { color: #58a6ff; }
    nav a { color: #8b949e; text-decoration: none; margin-left: 1.5rem; font-size: 0.9rem; } nav a:hover { color: #e6edf3; }
    .hero { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 3rem 2rem; gap: 1.5rem; }
    .hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; } .hero h1 span { color: #58a6ff; }
    .hero p { max-width: 600px; font-size: 1.1rem; color: #8b949e; line-height: 1.6; }
    .btns { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 0.5rem; }
    .btn { padding: 0.75rem 1.75rem; border-radius: 8px; font-size: 1rem; font-weight: 600; text-decoration: none; transition: all 0.2s; }
    .btn-p { background: #58a6ff; color: #fff; } .btn-p:hover { background: #79b8ff; transform: translateY(-1px); }
    .btn-s { background: #21262d; color: #e6edf3; border: 1px solid #30363d; } .btn-s:hover { background: #30363d; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; padding: 3rem 2rem; max-width: 960px; width: 100%; margin: 0 auto; }
    .card { background: #161b22; border: 1px solid #21262d; border-radius: 12px; padding: 1.25rem; } .card:hover { border-color: #58a6ff; }
    .card h3 { font-size: 0.95rem; margin-bottom: 0.4rem; } .card p { font-size: 0.82rem; color: #8b949e; }
    .card .ic { font-size: 1.4rem; margin-bottom: 0.6rem; }
    footer { text-align: center; padding: 1.5rem; color: #484f58; font-size: 0.8rem; border-top: 1px solid #21262d; }
    footer a { color: #58a6ff; text-decoration: none; }
  </style>
</head>
<body>
  <header><div class="logo"><span>Sailfish</span> Studio</div><nav><a href="editor.html">Editor</a><a href="https://github.com/Sailfish-Studio/Sailfish-Studio">GitHub</a></nav></header>
  <section class="hero">
    <h1>A faster, more powerful <span>Scratch</span> experience</h1>
    <p>Sailfish Studio is a Scratch-compatible creative coding platform with a compiler, dark mode, addons, and more. Built with Bun, Vite & TypeScript.</p>
    <div class="btns"><a class="btn btn-p" href="editor.html">Open Editor</a><a class="btn btn-s" href="https://github.com/Sailfish-Studio/Sailfish-Studio">Source</a></div>
  </section>
  <section class="features">
    <div class="card"><div class="ic">⚡</div><h3>Faster Execution</h3><p>Compiler-powered runtime for better performance.</p></div>
    <div class="card"><div class="ic">🌙</div><h3>Dark Mode</h3><p>Built-in dark theme for your eyes.</p></div>
    <div class="card"><div class="ic">🧩</div><h3>Addons</h3><p>Extend the editor with community addons.</p></div>
    <div class="card"><div class="ic">🔧</div><h3>Dev Tools</h3><p>Debugger, performance monitor, inspector.</p></div>
    <div class="card"><div class="ic">📦</div><h3>Monorepo</h3><p>pnpm workspaces, 13 packages, one repo.</p></div>
    <div class="card"><div class="ic">🚀</div><h3>Bun + Vite + TS</h3><p>Modern toolchain replacing Webpack.</p></div>
  </section>
  <footer><p>Forked from <a href="https://github.com/TurboWarp/">TurboWarp</a> &middot; pnpm workspace &middot; Vite &middot; TypeScript</p></footer>
</body>
</html>'''
with open('index.html', 'w') as f:
    f.write(landing)
print('  Created index.html (landing page)')

print('\n=== DONE ===')