/**
 * Sailfish Studio - Dev Server (Bun native)
 * Serves scratch-gui playground with hot reload
 */

import { join, resolve } from 'path';
import { existsSync, readFileSync, mkdirSync, watch } from 'fs';
import { build } from 'bun';

const ROOT = resolve(import.meta.dir, '..');
const PORT = parseInt(process.env.PORT || '8601', 10);
const GUI_DIR = join(ROOT, 'scratch-gui');

console.log(`\n  Sailfish Studio Dev Server`);
console.log(`  Port: ${PORT}\n`);

// Ensure build output exists
const buildDir = join(GUI_DIR, 'build');
if (!existsSync(buildDir)) {
  console.log('  First run detected. Building...\n');
  const { execSync } = await import('child_process');
  execSync('bun run scripts/build.js scratch-gui', { cwd: ROOT, stdio: 'inherit' });
  console.log('');
}

// Simple file content type map
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

// Serve a file from the build directory
function serveFile(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath);
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  return new Response(content, {
    headers: { 'Content-Type': MIME[ext] || 'application/octet-stream' },
  });
}

// Bun's native HTTP server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    // Remove trailing slash
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);

    // Root -> index.html
    if (path === '/' || path === '/index.html') {
      return serveFile(join(buildDir, 'index.html')) || new Response('Build not found. Run: bun run build', { status: 404 });
    }

    // Static assets
    let filePath = join(buildDir, path);
    if (existsSync(filePath) && !require('fs').statSync(filePath).isDirectory()) {
      return serveFile(filePath);
    }

    // Try with extensions
    for (const ext of ['.html', '.js', '.css']) {
      const tryPath = filePath + ext;
      if (existsSync(tryPath)) return serveFile(tryPath);
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`  Server running at http://localhost:${PORT}`);
console.log(`  Press Ctrl+C to stop\n`);
