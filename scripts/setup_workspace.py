#!/usr/bin/env python3
"""
Setup pnpm workspace for Sailfish-Studio (formerly TurboWarp) monorepo.
"""

import json
import os
import re
import shutil

BASE = '/home/z/my-project'

# All repos that should be in the workspace (must have package.json)
WORKSPACE_PACKAGES = [
    'scratch-gui', 'scratch-vm', 'scratch-render', 'scratch-blocks',
    'scratch-paint', 'scratch-storage', 'scratch-svg-renderer', 'scratch-parser',
    'scaffolding', 'packager', 'desktop', 'sb3fix', 'extensions',
    'cloud-server', 'jszip', 'nanolog', 'trampoline', 'types-tw',
    'unpackager', 'windchimes', 'paper.js', 'docs',
    'share.turbowarp.org', 'turbowarp.org', 'scratch-audio',
]

# Packages that exist in our workspace (name -> directory)
# Will be populated by reading package.json
WORKSPACE_MAP = {}

# External @turbowarp/* packages (published to npm, NOT in our workspace)
EXTERNAL_TURBOWARP = {
    '@turbowarp/json',
    '@turbowarp/sbdl', 
    '@turbowarp/startaudiocontext',
    '@turbowarp/scratchblocks',
    '@turbowarp/scratch-l10n',
    '@turbowarp/ancient-hull.js',
    '@turbowarp/scratch-render-fonts',
}

# Map github:TurboWarp/XXX#branch -> workspace package directory
GITHUB_TO_WORKSPACE = {
    'TurboWarp/scratch-vm': 'scratch-vm',
    'TurboWarp/scratch-render': 'scratch-render',
    'TurboWarp/scratch-blocks': 'scratch-blocks',
    'TurboWarp/scratch-paint': 'scratch-paint',
    'TurboWarp/scratch-storage': 'scratch-storage',
    'TurboWarp/scratch-svg-renderer': 'scratch-svg-renderer',
    'TurboWarp/scratch-parser': 'scratch-parser',
    'TurboWarp/scratch-audio': 'scratch-audio',
    'TurboWarp/extensions': 'extensions',
    'TurboWarp/types-tw': 'types-tw',
    'TurboWarp/jszip': 'jszip',
    'TurboWarp/packager': 'packager',
    'TurboWarp/scratch-gui': 'scratch-gui',
    'TurboWarp/scratch-render-fonts': None,  # not cloned, keep external
}


def load_package_json(repo_dir):
    """Load and return package.json from a repo directory."""
    pj_path = os.path.join(BASE, repo_dir, 'package.json')
    if os.path.exists(pj_path):
        with open(pj_path) as f:
            return json.load(f)
    return None


def save_package_json(repo_dir, data):
    """Save package.json back to a repo directory."""
    pj_path = os.path.join(BASE, repo_dir, 'package.json')
    with open(pj_path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')


def is_workspace_dep(dep_name, dep_version):
    """Check if a dependency should be replaced with workspace:* reference."""
    # Skip external turbowarp packages
    if dep_name in EXTERNAL_TURBOWARP:
        return False
    
    # Check github: references
    if dep_version and dep_version.startswith('github:TurboWarp/'):
        repo_ref = dep_version.split('#')[0].replace('github:', '')
        if repo_ref in GITHUB_TO_WORKSPACE and GITHUB_TO_WORKSPACE[repo_ref] is not None:
            return True
    
    # Check git+https: references  
    if dep_version and 'github.com/TurboWarp/' in dep_version:
        for repo_ref, target in GITHUB_TO_WORKSPACE.items():
            if repo_ref in dep_version and target is not None:
                return True
    
    # Check @turbowarp/* packages that are in our workspace
    if dep_name in WORKSPACE_MAP:
        return True
    
    # Check scratch-* packages in our workspace
    if dep_name in WORKSPACE_MAP.values():
        return True
    
    return False


def replace_dependencies(deps):
    """Replace internal dependencies with workspace:* references."""
    if not deps:
        return deps
    
    new_deps = {}
    for name, version in deps.items():
        if is_workspace_dep(name, version):
            new_deps[name] = 'workspace:*'
        else:
            new_deps[name] = version
    return new_deps


def main():
    print('=== Step 1: Build workspace package map ===')
    for repo in WORKSPACE_PACKAGES:
        pj = load_package_json(repo)
        if pj:
            pkg_name = pj.get('name', repo)
            WORKSPACE_MAP[pkg_name] = repo
            # Also map by directory name for scratch-* packages
            if repo.startswith('scratch-') or repo in ('scaffolding', 'packager', 'desktop', 'extensions'):
                WORKSPACE_MAP[repo] = repo
            print(f'  {repo} -> {pkg_name}')
    
    print(f'\n  Total workspace packages: {len(WORKSPACE_MAP)}')
    
    print('\n=== Step 2: Create pnpm-workspace.yaml ===')
    workspace_yaml = 'packages:\n'
    for repo in sorted(WORKSPACE_PACKAGES):
        if os.path.exists(os.path.join(BASE, repo, 'package.json')):
            workspace_yaml += f"  - '{repo}'\n"
    
    with open(os.path.join(BASE, 'pnpm-workspace.yaml'), 'w') as f:
        f.write(workspace_yaml)
    print(f'  Created pnpm-workspace.yaml with {workspace_yaml.count(chr(10))-1} packages')
    
    print('\n=== Step 3: Create root package.json ===')
    root_pkg = {
        'name': 'sailfish-studio',
        'version': '0.1.0',
        'private': True,
        'description': 'Sailfish Studio - A Scratch-compatible creative coding platform (forked from TurboWarp)',
        'scripts': {
            'dev': 'bun run scripts/dev.js',
            'build': 'bun run scripts/build.js',
            'clean': 'bun run scripts/clean.js',
        },
        'devDependencies': {
            'typescript': '^5.0.0',
            '@types/node': '^20.0.0',
        }
    }
    with open(os.path.join(BASE, 'package.json'), 'w') as f:
        json.dump(root_pkg, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print('  Created root package.json')
    
    print('\n=== Step 4: Replace internal dependencies with workspace:* ===')
    modified_count = 0
    for repo in WORKSPACE_PACKAGES:
        pj = load_package_json(repo)
        if not pj:
            continue
        
        original_deps = {**pj.get('dependencies', {}), **pj.get('devDependencies', {})}
        
        changed = False
        for dep_field in ('dependencies', 'devDependencies', 'peerDependencies'):
            if dep_field in pj and pj[dep_field]:
                new_deps = replace_dependencies(pj[dep_field])
                if new_deps != pj[dep_field]:
                    pj[dep_field] = new_deps
                    changed = True
        
        if changed:
            save_package_json(repo, pj)
            modified_count += 1
            # Show what changed
            for name in original_deps:
                for dep_field in ('dependencies', 'devDependencies', 'peerDependencies'):
                    if dep_field in pj and name in pj.get(dep_field, {}):
                        if pj[dep_field][name] == 'workspace:*':
                            print(f'  {repo}: {name} -> workspace:*')
    
    print(f'\n  Modified {modified_count} package.json files')
    
    print('\n=== Step 5: Remove .git directories from sub-repos ===')
    for repo in WORKSPACE_PACKAGES:
        git_dir = os.path.join(BASE, repo, '.git')
        if os.path.isdir(git_dir):
            shutil.rmtree(git_dir)
            print(f'  Removed .git from {repo}')
    
    # Also clean up non-workspace repos
    for extra in ['.github', 'addons', 'dangotron', 'packager-extras', 'types', 'winget-pkgs']:
        git_dir = os.path.join(BASE, extra, '.git')
        if os.path.isdir(git_dir):
            shutil.rmtree(git_dir)
    
    print('\n=== Step 6: Initialize new git repo ===')
    git_dir = os.path.join(BASE, '.git')
    if os.path.isdir(git_dir):
        print('  .git already exists, skipping')
    else:
        os.system(f'cd {BASE} && git init')
        print('  Initialized new git repo')
    
    print('\n=== DONE ===')
    print(f'Workspace packages: {len([r for r in WORKSPACE_PACKAGES if os.path.exists(os.path.join(BASE, r, "package.json"))])}')
    print(f'Modified package.json files: {modified_count}')


if __name__ == '__main__':
    main()
