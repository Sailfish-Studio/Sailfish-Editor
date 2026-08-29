
---
Task ID: 1
Agent: main
Task: Fix CI/CD pipeline and production build for Sailfish-Studio monorepo

Work Log:
- Discovered gh CLI was broken (v2.8.9), used GitHub API via Python urllib instead
- Downloaded and analyzed CI failure logs from GitHub Actions
- Fixed 6 bugs in ci.yml and deploy.yml (branches, port, http_code format, etc.)
- Fixed production build issues:
  - Added subpath aliases (@sailfish/core/src, etc.) before bare aliases
  - Added commonjsOptions.include for workspace packages (CJS→ESM transform)
  - Replaced webpack raw-loader! imports with Vite ?raw/?inline queries
  - Created react-tabs-classes.js shim for CSS module class name mapping
  - Added ESM named exports to tw-scratch-render-fonts/index.js
- Fixed pnpm strict isolation: added ~70 missing dependencies across 4 workspace packages
  - @sailfish/ui: 45 deps (react-modal, react-intl, lodash.*, classnames, etc.)
  - @sailfish/core: 15 deps (ajv, base64-js, cross-fetch, etc.)
  - @sailfish/render: 7 deps (twgl.js, dompurify, linebreak, etc.)
  - @sailfish/shared: 4 deps (lie, pako, readable-stream, setimmediate)
- Iteratively fixed remaining missing deps caught by CI (3 rounds)
- Final result: both CI and Deploy to GitHub Pages succeed

Stage Summary:
- CI pipeline green: build + smoke test passing
- Deploy pipeline green: GitHub Pages deployment successful
- Production build outputs 6 HTML pages + assets (~18s build time)
- Site should be live at https://sailfish-studio.github.io/Sailfish-Studio/
