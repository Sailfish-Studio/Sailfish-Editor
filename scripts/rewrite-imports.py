#!/usr/bin/env python3
"""Rewrite import/require paths from old module names to new @sailfish/* names."""
import os
import re

IMPORT_MAP = {
    'scratch-vm':               '@sailfish/core',
    'scratch-render':           '@sailfish/render',
    'scratch-gui':              '@sailfish/ui',
    'scratch-blocks':           '@sailfish/blocks-ui',
    'scratch-paint':            '@sailfish/ui',
    'scratch-parser':           '@sailfish/core',
    'scratch-storage':          '@sailfish/core',
    'scratch-svg-renderer':     '@sailfish/render',
    'scratch-audio':            '@sailfish/core',
    '@sailfish-studio/nanolog':            '@sailfish/shared',
    '@sailfish-studio/jszip':              '@sailfish/shared',
    '@sailfish-studio/sb3fix':             '@sailfish/shared',
    '@sailfish-studio/scratch-storage':    '@sailfish/core',
    '@sailfish-studio/scratch-svg-renderer': '@sailfish/render',
    '@sailfish-studio/paper':              '@sailfish/paper',
}

def rewrite_file(filepath):
    """Rewrite import paths in a single file. Returns number of replacements."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    original = content
    for old_name, new_name in sorted(IMPORT_MAP.items(), key=lambda x: -len(x[0])):
        # Order: longest match first to avoid partial matches
        escaped = re.escape(old_name)
        for quote in ["'", '"']:
            # Match: from 'old_name', require('old_name'), export * from 'old_name'
            # \(?
            pattern = rf"(from|require\(|export \*)(\s*\(?{quote}){escaped}({quote})"
            replacement = rf"\1\2{new_name}\3"
            content = re.sub(pattern, replacement, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return 1
    return 0

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dirs = ['packages', 'apps']
    extensions = ('.js', '.jsx', '.ts', '.tsx', '.mjs')

    updated = 0
    total = 0

    for d in dirs:
        dirpath = os.path.join(root, d)
        if not os.path.isdir(dirpath):
            continue
        for dirpath, dirnames, filenames in os.walk(dirpath):
            # Skip node_modules
            if 'node_modules' in dirnames:
                dirnames.remove('node_modules')
            for fname in filenames:
                if fname.endswith(extensions):
                    total += 1
                    fpath = os.path.join(dirpath, fname)
                    updated += rewrite_file(fpath)

    print(f"Scanned {total} files, updated {updated} files.")

if __name__ == '__main__':
    main()
