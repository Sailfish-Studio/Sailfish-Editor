#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Cleaning build artifacts..."
rm -rf "$ROOT/packages/*/dist"
rm -rf "$ROOT/packages/*/build"
rm -rf "$ROOT/apps/*/build"
rm -rf "$ROOT/apps/*/dist"
echo "Done."
