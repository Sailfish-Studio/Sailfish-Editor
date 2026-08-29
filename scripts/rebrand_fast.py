#!/usr/bin/env python3
"""Fast rebrand: only process non-node_modules, non-.git files."""
import os, subprocess, sys

BASE = '/home/z/my-project'
SKIP = {'node_modules','.git','turbowarp-repos','upload','download'}

def main():
    # Step 1: Rename directories
    renames = [
        ('share.turbowarp.org', 'share.sailfish-studio.org'),
        ('turbowarp.org', 'sailfish-studio.org'),
    ]
    for old, new in renames:
        op, np_ = os.path.join(BASE, old), os.path.join(BASE, new)
        if os.path.isdir(op) and not os.path.exists(np_):
            os.rename(op, np_)
            print(f'Renamed: {old} -> {new}')
    
    # Step 2: Update pnpm-workspace.yaml
    ws = os.path.join(BASE, 'pnpm-workspace.yaml')
    if os.path.exists(ws):
        with open(ws) as f: c = f.read()
        c = c.replace('share.turbowarp.org', 'share.sailfish-studio.org')
        c = c.replace('turbowarp.org', 'sailfish-studio.org')
        with open(ws,'w') as f: f.write(c)
        print('Updated pnpm-workspace.yaml')
    
    # Step 3: Collect all text files (excluding skipped dirs)
    print('Finding files to process...')
    files = []
    TEXT_EXT = {'.js','.jsx','.ts','.tsx','.mjs','.cjs','.json','.html','.htm','.ejs','.css','.scss','.md','.txt','.yml','.yaml','.svelte'}
    
    for dirpath, dirnames, filenames in os.walk(BASE):
        # Prune skipped directories
        dirnames[:] = [d for d in dirnames if d not in SKIP and not d.startswith('.')]
        for fn in filenames:
            _, ext = os.path.splitext(fn)
            if ext.lower() in TEXT_EXT:
                files.append(os.path.join(dirpath, fn))
    
    print(f'Found {len(files)} text files')
    
    # Step 4: Use sed for bulk replacement (much faster than Python)
    batch_size = 500
    for i in range(0, len(files), batch_size):
        batch = files[i:i+batch_size]
        file_list = '\n'.join(batch)
        # Create sed script
        sed_script = (
            's/@sailfish-studio\//@turbowarp\//g;'  # undo any double-replacement
            's/@turbowarp\//@sailfish-studio\//g;'  # @turbowarp/ -> @sailfish-studio/
            's/\\bTurboWarp\\b/Sailfish-Studio/g;'  # TurboWarp -> Sailfish-Studio
            's/\\bturbowarp\\b/sailfish-studio/g;'    # turbowarp -> sailfish-studio
            's/\\bTURBOWARP\\b/SAILFISH-STUDIO/g;'  # TURBOWARP -> SAILFISH-STUDIO
            's/turbowarp\.org/sailfish-studio.org/g;'   # turbowarp.org -> sailfish-studio.org
            's/\\bTurbo Warp\\b/Sailfish Studio/g;'    # Turbo Warp -> Sailfish Studio
        )
        # Use sed -i for in-place
        proc = subprocess.run(
            ['sed', '-i', '-E',
             's/@turbowarp\//@sailfish-studio\//g',
             's/\\bTurboWarp\\b/Sailfish-Studio/g',
             's/\\bturbowarp\\b/sailfish-studio/g',
             's/\\bTURBOWARP\\b/SAILFISH-STUDIO/g',
             's/turbowarp\.org/sailfish-studio.org/g',
             's/\\bTurbo Warp\\b/Sailfish Studio/g',
             ] + batch,
            capture_output=True, text=True, timeout=60
        )
        if proc.returncode != 0:
            print(f'  sed error at batch {i//batch_size}: {proc.stderr[:200]}')
        else:
            print(f'  Processed batch {i//batch_size + 1} ({min(i+batch_size, len(files))}/{len(files)} files)')

    print(f'\nDONE! Processed {len(files)} files with sed')

if __name__ == '__main__':
    main()
