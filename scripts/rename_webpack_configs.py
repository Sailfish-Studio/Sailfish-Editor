#!/usr/bin/env python3
"""
Rename webpack config files to .bak so they're not used.
Preserves them for reference.
"""
import os

BASE = '/home/z/my-project'
WEBPACK_CONFIGS = [
    'scratch-gui/webpack.config.js',
    'scratch-vm/webpack.config.js',
    'scratch-render/webpack.config.js',
    'scratch-blocks/webpack.config.js',
    'scratch-paint/webpack.config.js',
    'scratch-storage/webpack.config.js',
    'scratch-svg-renderer/webpack.config.js',
    'scratch-parser/webpack.config.js',
    'scaffolding/webpack.config.js',
    'packager/webpack.config.js',
    'desktop/webpack.config.cjs',
    'sb3fix/webpack.config.js',
]

renamed = 0
for cfg in WEBPACK_CONFIGS:
    full = os.path.join(BASE, cfg)
    bak = full + '.bak'
    if os.path.exists(full) and not os.path.exists(bak):
        os.rename(full, bak)
        print(f'  Renamed: {cfg} -> {cfg}.bak')
        renamed += 1
    elif os.path.exists(full):
        print(f'  Skipped (bak exists): {cfg}')
    else:
        print(f'  Not found: {cfg}')

print(f'\nRenamed {renamed} webpack configs to .bak')
