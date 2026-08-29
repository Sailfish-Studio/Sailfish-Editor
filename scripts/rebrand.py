#!/usr/bin/env python3
"""
Rebrand TurboWarp -> Sailfish-Studio
Replaces package names, display text, URLs, and file contents.
"""

import os
import re
import json
import shutil

BASE = '/home/z/my-project'

# Files/dirs to completely skip
SKIP_DIRS = {
    'node_modules', '.git', '.github', 'turbowarp-repos',
    'upload', 'download', 'scripts', 'skills',
}

# File extensions to process for text replacement
TEXT_EXTENSIONS = {
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.json', '.html', '.htm', '.ejs', '.css', '.scss',
    '.md', '.txt', '.yml', '.yaml', '.xml',
    '.svelte', '.svg',
}

# Binary file extensions to skip
BINARY_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp',
    '.mp3', '.wav', '.ogg', '.mp4', '.webm', '.avi',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.zip', '.tar', '.gz', '.7z',
    '.exe', '.dmg', '.app', '.deb', '.rpm',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.wasm', '.db', '.sqlite',
}

# Track stats
stats = {
    'files_processed': 0,
    'files_modified': 0,
    'dirs_renamed': 0,
}


def should_process_dir(dirpath):
    """Check if a directory should be processed."""
    parts = dirpath.replace(BASE + '/', '').split('/')
    for part in parts:
        if part in SKIP_DIRS:
            return False
        if part.startswith('.') and part != '.':
            return False
    return True


def should_process_file(filepath):
    """Check if a file should be processed for text replacement."""
    _, ext = os.path.splitext(filepath)
    if ext.lower() in BINARY_EXTENSIONS:
        return False
    if ext.lower() in TEXT_EXTENSIONS:
        return True
    # Process files without extension that might be scripts
    if os.path.isfile(filepath) and not ext:
        try:
            size = os.path.getsize(filepath)
            if 0 < size < 100000:  # Less than 100KB
                with open(filepath, 'rb') as f:
                    head = f.read(1024)
                    # Check if it looks like text
                    try:
                        head.decode('utf-8')
                        return True
                    except UnicodeDecodeError:
                        return False
        except:
            return False
    return False


def replace_text(content):
    """Perform all text replacements."""
    original = content
    
    # 1. @turbowarp/ scope -> @sailfish-studio/
    content = content.replace('@turbowarp/', '@sailfish-studio/')
    
    # 2. TurboWarp (standalone brand name) -> Sailfish-Studio
    # Be careful not to replace in URLs/paths that need to stay
    # Replace case-sensitive "TurboWarp" as brand name
    content = re.sub(r'\bTurboWarp\b', 'Sailfish-Studio', content)
    
    # 3. turbowarp (lowercase, in code contexts) -> sailfish-studio
    content = re.sub(r'\bturbowarp\b', 'sailfish-studio', content)
    
    # 4. TURBOWARP (uppercase) -> SAILFISH-STUDIO
    content = re.sub(r'\bTURBOWARP\b', 'SAILFISH-STUDIO', content)
    
    # 5. turbowarp.org domain -> sailfish-studio.org
    content = content.replace('turbowarp.org', 'sailfish-studio.org')
    
    # 6. Turbo Warp (with space) -> Sailfish Studio
    content = re.sub(r'\bTurbo Warp\b', 'Sailfish Studio', content)
    
    return content


def process_file(filepath):
    """Process a single file for brand replacement."""
    global stats
    stats['files_processed'] += 1
    
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except (IOError, OSError):
        return
    
    new_content = replace_text(content)
    
    if new_content != content:
        stats['files_modified'] += 1
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)


def rename_dirs():
    """Rename directories that contain 'turbowarp' in their name."""
    global stats
    
    renames = []
    for entry in os.listdir(BASE):
        full_path = os.path.join(BASE, entry)
        if not os.path.isdir(full_path) or entry in SKIP_DIRS:
            continue
        
        new_name = replace_text(entry)
        if new_name != entry:
            renames.append((entry, new_name))
    
    for old_name, new_name in renames:
        old_path = os.path.join(BASE, old_name)
        new_path = os.path.join(BASE, new_name)
        if not os.path.exists(new_path):
            os.rename(old_path, new_path)
            stats['dirs_renamed'] += 1
            print(f'  Renamed dir: {old_name} -> {new_name}')


def rename_files(root):
    """Rename files that contain 'turbowarp' in their name."""
    global stats
    
    for dirpath, dirnames, filenames in os.walk(root):
        if not should_process_dir(dirpath):
            dirnames.clear()
            continue
        
        for filename in filenames:
            new_filename = replace_text(filename)
            if new_filename != filename:
                old_path = os.path.join(dirpath, filename)
                new_path = os.path.join(dirpath, new_filename)
                if not os.path.exists(new_path):
                    os.rename(old_path, new_path)
                    stats['dirs_renamed'] += 1


def update_package_names():
    """Update package.json name fields for renamed directories."""
    global stats
    
    # Map of old dir names to new dir names
    dir_renames = {
        'share.turbowarp.org': 'share.sailfish-studio.org',
        'turbowarp.org': 'sailfish-studio.org',
    }
    
    for old_dir, new_dir in dir_renames.items():
        pj_path = os.path.join(BASE, new_dir, 'package.json')
        if os.path.exists(pj_path):
            with open(pj_path) as f:
                data = json.load(f)
            # Update repository URL if present
            if 'repository' in data:
                if isinstance(data['repository'], dict):
                    data['repository']['url'] = data['repository']['url'].replace('TurboWarp', 'Sailfish-Studio')
                elif isinstance(data['repository'], str):
                    data['repository'] = data['repository'].replace('TurboWarp', 'Sailfish-Studio')
            with open(pj_path, 'w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write('\n')


def walk_and_replace(root):
    """Walk directory tree and replace text in all files."""
    for dirpath, dirnames, filenames in os.walk(root):
        if not should_process_dir(dirpath):
            dirnames.clear()
            continue
        
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if should_process_file(filepath):
                process_file(filepath)


def main():
    print('=== Step 1: Rename directories ===')
    rename_dirs()
    print(f'  Renamed {stats["dirs_renamed"]} directories')
    
    print('\n=== Step 2: Rename files ===')
    rename_files(BASE)
    
    print('\n=== Step 3: Update package.json for renamed dirs ===')
    update_package_names()
    
    print('\n=== Step 4: Replace text in all files ===')
    walk_and_replace(BASE)
    print(f'  Processed {stats["files_processed"]} files')
    print(f'  Modified {stats["files_modified"]} files')
    
    # Update pnpm-workspace.yaml
    print('\n=== Step 5: Update pnpm-workspace.yaml ===')
    ws_path = os.path.join(BASE, 'pnpm-workspace.yaml')
    if os.path.exists(ws_path):
        with open(ws_path) as f:
            content = f.read()
        content = replace_text(content)
        with open(ws_path, 'w') as f:
            f.write(content)
        print('  Updated pnpm-workspace.yaml')
    
    print(f'\n=== DONE ===')
    print(f'Total files processed: {stats["files_processed"]}')
    print(f'Total files modified: {stats["files_modified"]}')
    print(f'Total items renamed: {stats["dirs_renamed"]}')


if __name__ == '__main__':
    main()
