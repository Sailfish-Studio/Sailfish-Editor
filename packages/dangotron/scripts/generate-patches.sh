#!/bin/bash

set -euo pipefail

dangotron=$(dirname "$(dirname "$(realpath "$0")")")
chromium="$HOME/electron/src"
branch="e44"
echo "Dangotron is at $dangotron; Chromium is at $chromium; branch is $branch"

jq -r '.paths | to_entries[] | "\(.key)\t\(.value)"' "$dangotron/patches/$branch/metadata.json" | while IFS=$'\t' read -r project_name project_relpath; do
    repo_path="$chromium/$project_relpath"
    patches_path="$dangotron/patches/$branch/$project_name"

    echo "Generating patches for $project_name ($repo_path) to $patches_path"
    cd "$repo_path"

    rm -rf "$patches_path"/*.patch
    git format-patch dangotron-base..HEAD -k -o "$dangotron/patches/$branch/$project_name"
done
