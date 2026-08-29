#!/usr/bin/env python3
import re, os, json
Q = chr(39)  # single quote
DQ = chr(34)  # double quote
FROM_RE = re.compile(f'from [{Q}{DQ}]([^{Q}{DQ}]+)[{Q}{DQ}]')
BUILTINS = frozenset(['events','fs','path','stream','buffer','crypto','http','https','url','util','os'])

for pkg_dir in ['packages/ui', 'packages/core', 'packages/render', 'packages/shared']:
    src = os.path.join(pkg_dir, 'src')
    if not os.path.isdir(src): continue
    pkgs = set()
    for root, dirs, files in os.walk(src):
        for f in files:
            if not f.endswith(('.js','.jsx')): continue
            try: content = open(os.path.join(root,f)).read()
            except: continue
            for m in FROM_RE.finditer(content):
                mod = m.group(1)
                if mod.startswith('.') or mod.startswith('@sailfish/'): continue
                parts = mod.split('/')
                pkg = parts[0] + '/' + parts[1] if mod.startswith('@') and len(parts)>1 else parts[0]
                if pkg not in BUILTINS: pkgs.add(pkg)
    pj_path = os.path.join(pkg_dir, 'package.json')
    if not os.path.exists(pj_path): continue
    data = json.load(open(pj_path))
    declared = set()
    for k in ('dependencies','devDependencies','peerDependencies'):
        declared.update(data.get(k,{}).keys())
    missing = pkgs - declared
    if missing:
        print(f'{pkg_dir}: {sorted(missing)}')
    else:
        print(f'{pkg_dir}: OK')
