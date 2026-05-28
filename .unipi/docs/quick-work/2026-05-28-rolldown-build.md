---
title: "Add Rolldown Build Setup"
type: quick-work
date: 2026-05-28
---

# Add Rolldown Build Setup

## Task
Add rolldown build to the project. Build command on justfile, bundle `src/index.ts` → `dist/index.js` with `.gitignore`.

## Changes
- `rolldown.config.js`: new config — input `src/index.ts`, output `dist/` as ESM
- `justfile`: added `build` recipe → `pnpm rolldown -c`
- `.gitignore`: new — ignores `node_modules/` and `dist/`
- `package.json`: added `rolldown` as devDependency
- `pnpm-lock.yaml`: updated

## Verification
- `just build` runs successfully, produces `dist/index.js` (279 KB)
- `.gitignore` correctly ignores `dist/`
- Config docs consulted from rolldown.rs

## Notes
- Using `pnpm rolldown -c` instead of bare `rolldown -c` since binary is local
- Format `esm` matches project's `"type": "module"` in package.json
