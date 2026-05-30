# Plan: Split Game Into src/ with CSS and JS Files
**Date**: 2026-05-30

## Goal
Refactor the game from a single monolithic `index.html` (~2011 lines) into a structured `src/` directory containing `index.html` (markup only), `styles.css`, `game.js`, and an `assets/` subdirectory. A GitHub Actions workflow will deploy `src/` to GitHub Pages, keeping the `docs/` directory off the public web (it stays in the repo and is visible on GitHub, but is not served by Pages).

## Context
The entire game currently lives in one file:
- **Lines 1–5**: `<!DOCTYPE html>`, `<html>`, `<head>` open
- **Lines 6–72**: `<style>` block (all CSS)
- **Lines 73–170**: HTML markup — `<body>`, `#gameWrapper`, `<canvas>`, `#ui`, all overlays/popups, title/win/lose screens
- **Lines 171–2009**: `<script>` block (all JavaScript)
  - Image loading: lines 174–186
  - Game state + constants: lines 188–651
  - Obstacle draw/physics: lines 378–647
  - Enemy/projectile/combat: lines 648–770
  - Render helpers: lines 771–987
  - Game loop (`update`, `gameLoop`): lines 988–1415
  - Boss fight: lines 1416–1610
  - Render: lines 1611–1822
  - Input: lines 1823–1929
  - Button wiring + QR + init: lines 1930–2009
- **Repo root art assets**: 12 PNG files (`narwhal-*.png`, `enemy-*.png`, `cybertruck-boss.png`) + 7 SVG background files (`bg-*.svg`)

The JS is entirely global-scope — no classes or module boundaries exist. All functions share state via top-level `let`/`const` declarations.

Image paths in JS are bare strings: `k+'.png'` and `'bg-'+k+'.svg'` at lines 183–186.

## Design Decisions

**Single `game.js`, plain `<script>` tag (no ES6 modules)**  
The entire JS section moves to `src/game.js` as-is, referenced with `<script src="game.js"></script>` at the end of `<body>`. No `import`/`export` syntax is introduced. This preserves the no-server, open-`src/index.html`-directly workflow.

**Assets go to `src/assets/`**  
All PNGs and SVGs move from the repo root to `src/assets/`. The path strings in `game.js` update to `'assets/'+k+'.png'` and `'assets/bg-'+k+'.svg'`.

**GitHub Actions deployment for GitHub Pages**  
GitHub Pages natively supports only root `/` or `/docs` as the source folder. To serve from `src/`, a workflow at `.github/workflows/deploy.yml` will use `actions/checkout` + `actions/upload-pages-artifact` + `actions/deploy-pages` to publish only the `src/` directory. The workflow requires `permissions: pages: write` and `id-token: write`. GitHub Pages Settings must be switched to **"GitHub Actions"** as the source (a one-time manual step in the GitHub UI after merging).

**`src/index.html` references external files**  
The `<head>` will contain `<link rel="stylesheet" href="styles.css">` instead of the inline `<style>`. The `<script src="game.js"></script>` goes at the end of `<body>` to maintain the same execution order (DOM ready before script runs, matching current behavior).

**Local dev CORS note**  
After the refactor, opening `src/index.html` via `file://` may cause canvas taint in some browsers when SVG backgrounds are drawn via `ctx.drawImage()`. The `drawQR` function's `canvas.toDataURL()` call (line ~1975) can throw a `SecurityError` in that scenario. This is a pre-existing edge case (SVGs were already being loaded cross-origin-adjacent). For most browsers it will work. If not, run a trivial local server: `npx serve src`.

## Out of Scope
- Splitting `game.js` into multiple files or introducing ES6 modules
- Any refactoring of game logic or variable names
- Adding a build step or bundler
- Fixing the pre-existing CORS/canvas-taint edge case

## Tasks
- [ ] Create `src/` and `src/assets/` directories
- [ ] Move all 19 art assets (12 PNGs + 7 SVGs) from repo root to `src/assets/`
- [ ] Extract CSS (current `index.html` lines 7–71, between `<style>` tags) into `src/styles.css`
- [ ] Extract JS (current `index.html` lines 172–2008, between `<script>` tags) into `src/game.js`; at lines 183–186 update paths: `k+'.png'` → `'assets/'+k+'.png'` and `'bg-'+k+'.svg'` → `'assets/bg-'+k+'.svg'`
- [ ] Create `src/index.html`: `<!DOCTYPE html>` shell with `<link rel="stylesheet" href="styles.css">` in `<head>`, all existing DOM markup (lines 73–170 of current `index.html`) in `<body>`, and `<script src="game.js"></script>` just before `</body>`
- [ ] Update `CLAUDE.md`: change "Open `index.html` directly in a browser" to "Open `src/index.html` directly in a browser"
- [ ] Add `.github/workflows/deploy.yml` — workflow triggered on push to `main`, with `permissions: pages: write` + `id-token: write`, steps: `actions/checkout`, `actions/upload-pages-artifact` (path: `./src`), `actions/deploy-pages`
- [ ] Open `src/index.html` in a browser and verify: (a) game canvas and title screen render, (b) narwhal + enemy PNGs appear in-game, (c) SVG backgrounds render per realm, (d) win screen shows (or at minimum the QR canvas doesn't error the whole screen)
- [ ] Delete `index.html` from the repo root after verification passes
- [ ] *(Post-merge, manual)* Switch GitHub Pages source to "GitHub Actions" in the repo's Settings > Pages
