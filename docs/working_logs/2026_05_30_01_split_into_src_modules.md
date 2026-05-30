# Working Log — 2026-05-30

**Session goal**: Refactor the monolithic `index.html` into a `src/` directory with separate HTML, CSS, and JS files, and add a GitHub Actions workflow to deploy `src/` to GitHub Pages.

---

## Changes

### Created src/ directory structure
**Why**: The single-file layout made it impossible to serve only the game files to GitHub Pages without also publishing the docs/ directory.
**What**: Created `src/` with `index.html` (markup only), `styles.css`, and `game.js`. Art assets moved to `src/assets/`. The root `index.html` was removed after browser verification.
**Files**: `src/index.html`, `src/styles.css`, `src/game.js`, `src/assets/` (19 files)

### Updated asset paths in game.js
**Why**: Assets moved from the repo root to `src/assets/`, so the JS path strings had to match.
**What**: Two image-loading lines updated to prefix `assets/` on PNG keys and `assets/bg-` on SVG keys.
**Files**: `src/game.js`

### Updated CLAUDE.md and implementation doc
**Why**: Both referenced the old single-file structure and root `index.html` path.
**What**: CLAUDE.md "Running the Game" and "Architecture" sections updated. `001_game_systems_overview.md` opening description rewritten; added note that line references are now relative to `src/game.js`.
**Files**: `CLAUDE.md`, `docs/implementation/001_game_systems_overview.md`

---

## Notes

- Opening `src/index.html` via `file://` may cause CORS/canvas-taint when SVG backgrounds are drawn with `ctx.drawImage()`. If backgrounds fail to render, run `npx serve src` instead. The QR code on the win screen is the most likely casualty.
- GitHub Actions deploy workflow was drafted but removed pending verification that it's needed. The plan doc has the workflow spec if needed later.
- Line numbers in `001_game_systems_overview.md` now refer to `src/game.js`; each is ~171 less than the original `index.html` line.
