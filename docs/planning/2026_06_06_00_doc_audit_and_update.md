# Plan: Documentation Audit and Update
**Date**: 2026-06-06

## Goal

Bring all four documentation files (`README.md`, `CLAUDE.md`, `docs/implementation/001_game_systems_overview.md`, `docs/implementation/002_text_sizing_and_scale.md`) into sync with the current codebase. The main driver is that the module split (7 JS files replacing `game.js`) and the hi-DPI canvas scaling work introduced substantive changes that were never reflected in `README.md` or `CLAUDE.md`, and partially reflected in the implementation docs. Several values, asset names, and structural descriptions are stale.

## Context

The codebase lives in `src/` and currently loads these files in order via plain `<script>` tags (`index.html:109–115`):
`constants.js` → `state.js` → `obstacles.js` → `draw.js` → `update.js` → `input.js` → `main.js`

Asset images live in `src/assets/`. The boss PNG is `orca-boss.png` — the function that draws it (`drawCybertruck`, `draw.js:39`) retains its old name but loads `IMAGES['orca-boss']`. The boss HP bar label in the HTML reads `🚗 EVIL ORCA` (`index.html:31`).

`controlMode` (`state.js:17`) is a new mutable state variable (`'wasd'` or `'mouse'`) wired to a toggle button (`#controlToggleBtn`, `index.html:42`, `main.js:17`). It is not documented anywhere.

The `CANVAS_FONT` values in `constants.js:81–91` are all larger than what `002` documents — they were doubled roughly in proportion to `CANVAS_SCALE=2` during the hi-DPI work. `CANVAS_FONT_BASE_ANIM` is `42` in code (`constants.js:92`) vs `32` in the doc.

A `#quizPopup` element exists in `index.html:45–52` and CSS, but `state='quiz'` is never set in any JS file. The void keeper quiz was either removed or never completed. The implementation doc 001 lists `quiz` as an active state; CLAUDE.md does not. The stale comment in `update.js:717` also references it.

A `#bossLoseScreen` div (`index.html:95–102`) shows a trivia question when the player loses the boss fight — this mechanic is undocumented.

## Design Decisions

- **Keep `quiz` in the HTML doc inventory** but note it is unused / dormant — don't remove the HTML element description from 001, since the element still exists and may be re-activated.
- **Don't rename `drawCybertruck`** in documentation — the function name is still accurate in the code; just clarify that it renders the orca-boss asset.
- **Update CANVAS_FONT table values verbatim from `constants.js`** — don't explain why they changed (that's in the working log); just correct the numbers.
- **CLAUDE.md architecture section** should reference the JS module split and the file load order, deferring detail to implementation doc 001 (which already has the full table).

## Out of Scope

- Making any code changes.
- Updating `docs/planning/` files (those are historical).
- Updating `docs/working_logs/` files (those are historical).
- Updating `ART-ASSETS.md` (not part of this audit).

## Tasks

- [x] **README.md** — Update "How to Run": "Open `src/index.html`" (currently says `index.html`)
- [x] **README.md** — Update description: boss is now an "evil orca driving a Cybertruck", not just "an evil Cybertruck"
- [x] **README.md** — Update "How to Play": add the control-mode toggle (WASD ↔ mouse click, via `#controlToggleBtn`)
- [x] **README.md** — Replace single `index.html` row in project structure with the 7 JS module files and `styles.css`; correct all asset paths to `src/assets/` prefix; change `cybertruck-boss.png` → `orca-boss.png`
- [x] **CLAUDE.md** — Architecture section: replace "three files … `game.js`" with "nine files (`index.html`, `styles.css`, and 7 JS modules)" and list module filenames in load order (bare list — full descriptions live in `001`); drop all `game.js` references
- [x] **CLAUDE.md** — State machine table: update `boss` row description from "Final Cybertruck boss fight" to "Evil Orca boss fight"
- [x] **CLAUDE.md** — Key Global Variables table: add `controlMode` row (`'wasd'`\|`'mouse'`, toggled by `#controlToggleBtn` in `main.js`)
- [x] **CLAUDE.md** — Drawing section: clarify that `drawCybertruck` (`draw.js`) renders the `orca-boss` PNG asset
- [x] **docs/implementation/001** — State machine table: mark `quiz` as dormant (HTML element exists, state value is never set); add `bossLoseScreen` trivia mechanic as a note under the `boss` row
- [x] **docs/implementation/001** — Image loading section: change asset key `cybertruck-boss` → `orca-boss`
- [x] **docs/implementation/001** — UI Overlay table: add `#bossLoseScreen` row; add `controlMode` / `#controlToggleBtn` to the Key Global Variables section (or note them under the State Machine section if no such section exists in 001 — CLAUDE.md's Key Global Variables table is the primary home, 001 should cross-reference it)
- [x] **docs/implementation/002** — CANVAS_FONT tier table: update all 9 values verbatim from `constants.js:81–91` (xs, sm, sm_bold, md, md_bold, lg_bold, emoji_sm, emoji_md, emoji_lg)
- [x] **docs/implementation/002** — CANVAS_FONT_BASE_ANIM: update value from 32 to 42 and update the assembled font-string example accordingly
