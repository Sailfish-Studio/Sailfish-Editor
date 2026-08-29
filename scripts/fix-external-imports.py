#!/usr/bin/env python3
"""Fix remaining external package imports for the monorepo structure."""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def fix_file(filepath):
    """Fix external imports in a file. Returns number of changes."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    original = content

    # @sailfish-studio/* -> @turbowarp/* or local shim
    replacements = [
        ("@sailfish-studio/ancient-hull.js", "@turbowarp/ancient-hull.js"),
        ("@sailfish-studio/startaudiocontext", "@turbowarp/startaudiocontext"),
        ("@sailfish-studio/json", "@sailfish/shared/extended-json"),
        # scratch-sb1-converter is optional (only used for .sb1 projects)
        # scratch-translate-extension-languages -> @turbowarp/scratch-l10n
        ("scratch-translate-extension-languages", "@turbowarp/scratch-l10n"),
    ]

    for old, new in replacements:
        for quote in ["'", '"']:
            pattern = rf"require\({quote}{re.escape(old)}{quote}\)"
            replacement = f"require({quote}{new}{quote})"
            content = re.sub(pattern, replacement, content)

            pattern2 = rf"from {quote}{re.escape(old)}{quote}"
            replacement2 = f"from {quote}{new}{quote}"
            content = re.sub(pattern2, replacement2, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return 1
    return 0

def main():
    dirs = ['packages', 'apps']
    extensions = ('.js', '.jsx', '.ts', '.tsx', '.mjs')
    updated = 0
    total = 0

    for d in dirs:
        dirpath = os.path.join(ROOT, d)
        if not os.path.isdir(dirpath):
            continue
        for dirpath, dirnames, filenames in os.walk(dirpath):
            if 'node_modules' in dirnames:
                dirnames.remove('node_modules')
            for fname in filenames:
                if fname.endswith(extensions):
                    total += 1
                    fpath = os.path.join(dirpath, fname)
                    updated += fix_file(fpath)

    print(f"Scanned {total} files, updated {updated} files.")

if __name__ == '__main__':
    main()
