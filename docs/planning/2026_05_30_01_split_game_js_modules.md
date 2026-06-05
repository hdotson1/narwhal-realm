# Plan: Split game.js Into 7 Module Files
**Date**: 2026-05-30

## Goal
Split `src/game.js` (1837 lines) into 7 focused files that are loaded sequentially via plain `<script>` tags in `index.html`. All scripts execute in guaranteed order before the game loop starts, and the existing `_onImgsReady` callback ensures art assets are fully loaded before the first frame. No build step, no ES modules, no dynamic loader — the HTML spec's synchronous script ordering is the only guarantee needed.

## Context

`src/game.js` is 1837 lines divided into ~30 named sections (`// ── NAME ──`). The file is entirely global-scope: no classes, no modules, all state is bare `let`/`const` at the top level. The current `index.html` loads it with a single `<script src="game.js"></script>` tag at line 105.

Named sections and approximate line ranges:
- **1–16**: Canvas + IMAGES asset loading infrastructure
- **17–96**: Mutable state variables + `meetLuma` + `canEnterRealm`/`hasAllFour` + `UNLOCK_CHAIN`
- **97–205**: `REALMS`, `NARWHAL_DEFS`, companion HP, `setSelected`, player state, portals, shopkeeper, `captiveNarwhals`
- **207–379**: `OBSTACLE_THEMES`, `generateObstacles`, `applyObstacleEffects`
- **380–481**: Void realm physics — `lumaState`, `updateVoidPhysics`
- **482–596**: Entity declarations (`enemies`, `projectiles`, coins, particles, boss minions, boss object) + spawn functions
- **600–816**: Helpers (`dist`, `showStatus`, `shuffle`), `drawNarwhal`, `drawShopkeeper`, `drawRobot`, `drawCybertruck`, `drawObstacle`, `drawBackground`, `getOrbitPos`
- **817–1244**: `gameLoop`, `update` and all update sub-functions
- **1245–1439**: `BOSS_TRIVIA` data + `showBossLoseTrivia`
- **1440–1651**: `render` and all render sub-functions
- **1652–1758**: Keyboard/mouse event listeners
- **1759–1837**: Button wiring, QR code, `initNarwhalIcons`, `_onImgsReady` assignment

The `_onImgsReady` pattern (line 11 declares it `null`; line 1836 assigns the callback) is safe across split files because image `onload` events are always dispatched asynchronously — they can only fire after the current synchronous script finishes. Since `main.js` is the last `<script>` tag, all scripts complete before any image can fire its callback.

## Design Decisions

**7 files, co-located data**: Data arrays (`NARWHAL_DEFS`, `OBSTACLE_THEMES`, `BOSS_TRIVIA`) stay in the file containing the functions that use them, not extracted to a `data.js`. This keeps each file self-contained and readable without cross-file lookup.

**Sequential `<script>` tags, no loader**: The HTML spec guarantees synchronous (no `async`/`defer`) `<script>` tags in `<body>` execute in document order. This is simpler and more reliable than a dynamic loader and requires zero new infrastructure. The 7 tags replace the current single `<script src="game.js"></script>` at `index.html:105`.

**Bare globals, no namespace**: All variables stay as bare `let`/`const` globals — no `window.NR` wrapper. This avoids touching every reference in the codebase and keeps the refactor mechanical (cut/paste sections).

**`main.js` adds a safety guard for cached assets**: The current code at line 1836 only assigns `_onImgsReady` but never checks if images are already loaded. `main.js` will use:
```js
if (_imgsLoaded === _imgsTotal) {
  initNarwhalIcons(); requestAnimationFrame(ts => { lastTime = ts; gameLoop(ts); });
} else {
  _onImgsReady = () => { initNarwhalIcons(); requestAnimationFrame(ts => { lastTime = ts; gameLoop(ts); }); };
}
```
This handles the edge case where all images are already in the browser cache.

**`W` and `H` go in `constants.js`**: These are used inside `PORTALS` (`x: W/2`) and the `player` init — they must be defined before `state.js` runs.

**Cross-file forward references are safe**: `draw.js` loads before `update.js`, yet `render` calls `getOrbitPos`, `getBossOrbitPos`, and `spawnBurst` (all in `update.js`). This is fine — these are runtime calls, not load-time calls. By the time `gameLoop` first invokes `render`, all 7 scripts will have long since executed. No circular dependency exists.

**Proposed file split**:

| File | Contents | Approx. lines |
|------|----------|---------------|
| `constants.js` | `W`, `H`, `NARWHAL_SIZE`, `ENEMY_SIZE`, `BOSS_W/H`, `REALMS`, `NARWHAL_DEFS`, `COMPANION_MAX_HP`, `PLAYER_COLOR`, `PORTALS`, `HUB_PORTAL`, `SHOPKEEPER`, `CAPTIVE_POSITIONS`, `UNLOCK_CHAIN`, `ELEM_COLORS`, `ELEM_WEAKNESSES`, `REALM_ENEMY_ELEMENT`, `ALL_ELEMENTS` | ~70 |
| `state.js` | `canvas`, `ctx`, `IMAGES` + asset loading loop, all mutable `let` state variables, initialized objects that depend on constants (`companionHp`, `abilityCooldowns`, `captiveNarwhals`) | ~95 |
| `obstacles.js` | `OBSTACLE_THEMES`, `generateObstacles`, `drawObstacle` (lives at line 254, between generate and applyEffects), `applyObstacleEffects`, `LUMA_CRIES`, `lumaState`, `updateVoidPhysics` | ~290 |
| `draw.js` | `drawNarwhal`, `drawShopkeeper`, `drawRobot`, `drawCybertruck`, `drawPortal`, `drawBackground` (lines 610–810); `drawCoinPickups` (lines 531–545); full `render` function and sub-renderers (lines 1440–1651); `drawNarwhalToCanvas` (lines 1816–1827) | ~510 |
| `update.js` | `meetLuma`, `canEnterRealm`, `hasAllFour`, `updateCompanionUI`, `healAllCompanions`, `setSelected`, `updateHealthBar`, `dist`, `showStatus`, `shuffle`, `getOrbitPos`, `getBossOrbitPos`, spawn functions (`spawnEnemy`, `spawnCoin`, `spawnBurst`, `spawnMinion`, `spawnEnemies`), `updateCoinPickups`, `damagePlayer`, `gameLoop`, `update` and all sub-update functions including `showReadyPrompt`, `enterRealm`, `freeNarwhal`, `startBoss`, `bossAutoFireTimer`, `BOSS_TRIVIA`, `showBossLoseTrivia` | ~760 |
| `input.js` | All `addEventListener` calls — `keydown`, `keyup`, `mousemove`, `mousedown`, `mouseup` (lines 1652–1758) | ~110 |
| `main.js` | `startBtn`, `restartBtn`, `retryBtn`, `factBtn`, `shopYes`/`shopNo`, `helpBtn`, `controlToggleBtn` button wiring (lines 1759–1786); QR code generation (lines 1787–1814); `initNarwhalIcons` (lines 1829–1834); `_onImgsReady` assignment with safety guard | ~65 |

## Out of Scope
- Introducing ES6 `import`/`export` or any module system
- Adding a build step, bundler, or dev server
- Refactoring game logic, variable names, or internal architecture
- Splitting `update.js` further (it remains the largest file at ~750 lines; a future session could extract boss logic or combat into sub-files)
- Fixing any pre-existing bugs discovered during the split

## Tasks
- [x] Create `src/constants.js` — these named constants from game.js: `W`, `H` (line 1); `NARWHAL_SIZE`, `ENEMY_SIZE`, `BOSS_W`, `BOSS_H` (lines 5–7); `UNLOCK_CHAIN` (line 81); `REALMS` (lines 98–106); `NARWHAL_DEFS` (lines 110–131); `COMPANION_MAX_HP` (line 134); `PLAYER_COLOR` (line 171); `PORTALS`, `HUB_PORTAL` (lines 185–192); `SHOPKEEPER` (line 195); `CAPTIVE_POSITIONS` (lines 198–201); `ELEM_COLORS`, `ELEM_WEAKNESSES`, `REALM_ENEMY_ELEMENT`, `ALL_ELEMENTS` (lines 477–480)
- [x] Create `src/state.js` — `canvas`/`ctx` (line 1); `IMAGES` + asset loading infrastructure: `_imgsTotal`, `_imgsLoaded`, `_onImgsReady`, `_imgDone`, both image loading loops (lines 9–15); all mutable state `let` declarations: `state`, `controlMode`, `keys`, `mouseX`, `mouseY`, `sandDollars`, `gameTime`, `lastTime`, `shopStep`, `blackHolePurchased`, `bossTriggered` (lines 18–23); `voidUnlocked` (line 86); `currentRealm` (line 107); `companionHp` init (lines 135–136); `selectedElement` (line 158); `player`, `playerEntangled`, `playerBlown` (lines 172–176); `rescuedSet`, `carryingNarwhal`, `abilityCooldowns` init, `autoFireTimer` (lines 178–182); `captiveNarwhals` init (lines 202–205); `obstacles` (line 208); `enemies`, `enemySpawnTimer` (line 483); `projectiles`, `enemyProjectiles` (lines 499–508); `coinPickups` (line 510); `particles` (lines 548–550); `bossMinions` (lines 557–559); `boss` object (lines 594–595); `realmDmgTimer` (line 598)
- [x] Create `src/obstacles.js` — `OBSTACLE_THEMES` (lines 210–252); `generateObstacles` (lines 207–252 function body); `drawObstacle` (lines 254–346, note: physically sits between generate and applyEffects in the file); `applyObstacleEffects` (lines 347–379); `LUMA_CRIES` (line 387); `lumaState` const (lines 382–386); `updateVoidPhysics` (lines 389–481)
- [x] Create `src/draw.js` — `drawNarwhal` through `drawBackground` i.e. all named draw functions in lines 610–810 except `drawObstacle` (which goes in obstacles.js); `drawPortal` (within lines 610–810); `drawCoinPickups` (lines 531–545); full `render` function and all sub-renderers (lines 1440–1651); `drawNarwhalToCanvas` (lines 1816–1827)
- [x] Create `src/update.js` — `meetLuma` (lines 25–78); `canEnterRealm`, `hasAllFour` (lines 83–95); `updateCompanionUI`, `healAllCompanions` (lines 138–155); `setSelected` (lines 159–168); `dist`, `showStatus` (lines 601–609); `shuffle`, `getOrbitPos` (lines 811–816); `getBossOrbitPos` (find near line 1345); `spawnEnemies` (line 485); `spawnCoin`, `updateCoinPickups` (lines 512–529); `spawnBurst` (in particles section); `spawnMinion` (in boss minions section); `damagePlayer`; `updateHealthBar`; `gameLoop`, `update`, `showReadyPrompt`, and all sub-update functions (lines 817–1244); `BOSS_TRIVIA`, `showBossLoseTrivia`, `bossAutoFireTimer` (lines 1245–1439); `enterRealm`, `freeNarwhal`, `startBoss`
- [x] Create `src/input.js` — all `addEventListener` calls (lines 1652–1758)
- [x] Create `src/main.js` — button wiring for `startBtn`, `restartBtn`, `retryBtn`, `factBtn`, `shopYes`/`shopNo`, `helpBtn`, `controlToggleBtn` (lines 1759–1786); `drawQR` / QR code generation (lines 1787–1814); `initNarwhalIcons` (lines 1829–1834); replace line 1836's bare `_onImgsReady=...` assignment with the safety-guard pattern: `if (_imgsLoaded===_imgsTotal) { start immediately } else { _onImgsReady = startFn }`
- [x] Update `src/index.html` line 105: replace `<script src="game.js"></script>` with 7 sequential `<script>` tags in dependency order: `constants.js` → `state.js` → `obstacles.js` → `draw.js` → `update.js` → `input.js` → `main.js`
- [x] Delete `src/game.js`
- [x] Open `src/index.html` in a browser and verify: title screen renders with narwhal icon; enter Water realm, enemy PNGs appear and combat works; SVG realm background renders; rescue a narwhal (fact popup + carry state); enter Void realm and verify Luma's bouncing physics; open shop popup (shopYes/shopNo buttons work); trigger boss fight, verify boss trivia retry flow; reach win screen and QR code appears
