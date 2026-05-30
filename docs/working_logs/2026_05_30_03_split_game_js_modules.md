# Working Log — 2026-05-30

**Session goal**: Split `src/game.js` (1837 lines) into 7 focused module files loaded sequentially via plain `<script>` tags.

---

## Changes

### Split game.js into 7 module files
**Why**: The single 1837-line `game.js` was hard to navigate; splitting into focused files makes each area of the codebase independently readable.
**What**: Deleted `game.js` and created `constants.js`, `state.js`, `obstacles.js`, `draw.js`, `update.js`, `input.js`, and `main.js` by cutting and reorganizing sections of the original file with no logic changes.
**Files**: `src/constants.js`, `src/state.js`, `src/obstacles.js`, `src/draw.js`, `src/update.js`, `src/input.js`, `src/main.js`, `src/game.js` (deleted)

### Update index.html script loading
**Why**: The single `<script src="game.js">` tag needed to be replaced with the 7 new files in dependency order.
**What**: Replaced the one tag with 7 sequential `<script>` tags: `constants.js` → `state.js` → `obstacles.js` → `draw.js` → `update.js` → `input.js` → `main.js`. Added a safety guard in `main.js` so cached images don't prevent the game loop from starting.
**Files**: `src/index.html`, `src/main.js`

---

## Notes
- `openShop()` is defined in `update.js` but has no call site — the void shopkeeper is visual-only. A proximity check near `SHOPKEEPER` position would need to be added to `update()` to wire it up.
- `bossTriggered` is declared in `state.js` but never read or written in game logic — likely dead state from an earlier design.
- `update.js` is still the largest file (~760 lines). Boss combat logic and the shop flow could be extracted to sub-files in a future session if warranted.
