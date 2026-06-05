# Working Log — 2026-05-30

**Session goal**: Plan the refactor of the game into a `src/` directory with separate CSS and JS files, and decide on a GitHub Pages deployment strategy.

---

## Changes

### Planning doc for src/ refactor
**Why**: The game is a single 2011-line `index.html`; splitting concerns into `styles.css` and `game.js` improves maintainability, and moving files into `src/` lets GitHub Pages serve only game files without exposing `docs/`.
**What**: Created a planning document covering the file extraction tasks, asset migration to `src/assets/`, and a GitHub Actions workflow to deploy `src/` to GitHub Pages.
**Files**: `docs/planning/2026_05_30_00_split_into_src_modules.md`

### CLAUDE.md: add implementation-review guidance
**Why**: Establish the expectation that any feature work begins with a review of implementation docs before touching code.
**What**: Added a note at the end of the Development Workflow section instructing that if implementation begins without a plan, the first step is to read `docs/implementation/` and ask for clarification.
**Files**: `CLAUDE.md`

---

## Notes
- The plan was reviewed by a sub-agent; two GitHub Actions omissions (`actions/checkout`, `permissions` block) and a missing CLAUDE.md update were caught and incorporated before finalizing.
- Local dev CORS caveat noted in the plan: opening `src/index.html` via `file://` may taint the canvas in some browsers when SVG backgrounds are drawn; `npx serve src` is the workaround.
- Next session: run `/execute` against `docs/planning/2026_05_30_00_split_into_src_modules.md`.
