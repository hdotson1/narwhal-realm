# 001 — Game Systems Overview

The game lives in `src/` as 9 files: `src/index.html` (markup only), `src/styles.css`, and 7 JavaScript files loaded sequentially via plain `<script>` tags. Art assets (12 PNGs + 7 SVGs) live in `src/assets/`. There is no build step, module system, or external JavaScript beyond Google Fonts (CSS import) and a QR code library loaded lazily on the win screen.

**JavaScript file load order** (each file is global-scope; later files can reference anything from earlier files):

| File | Contents |
|---|---|
| `constants.js` | `W`, `H`, `NARWHAL_DEFS`, `REALMS`, `PORTALS`, element constants, and all other `const` values |
| `state.js` | `canvas`/`ctx`, image loading infrastructure, all mutable `let` game state variables |
| `obstacles.js` | `OBSTACLE_THEMES`, `generateObstacles`, `drawObstacle`, `applyObstacleEffects`, void physics |
| `draw.js` | All draw functions (`drawNarwhal`, `drawRobot`, `drawBackground`, `drawPortal`, etc.) and `render()` |
| `update.js` | All game logic: `update()`, `gameLoop()`, spawn/damage/collision helpers, boss, shop, realm transitions |
| `input.js` | `keydown`, `keyup`, `mousemove`, `click` event listeners |
| `main.js` | Button wiring, `drawQR`, `initNarwhalIcons`, startup safety guard |

The canvas is 800×600 px, id `c`. All game drawing uses the 2D context `ctx`. `src/index.html` contains the UI overlay (health bar, ability slots, popups) positioned absolutely over the canvas.

---

## Image Loading (`state.js`)

All PNGs and SVGs are loaded at startup into the `IMAGES` dict before the game loop starts. `_imgsTotal` / `_imgsLoaded` / `_onImgsReady` coordinate a simple callback-based ready gate. The game loop only starts after all images report `onload` or `onerror`. `main.js` adds a safety guard that fires immediately if all images are already cached at parse time.

Asset keys match filenames without extensions: `narwhal-player`, `enemy-water`, `bg-hub`, `orca-boss`, `water-player-projectile`, etc.

---

## State Machine (`state.js` / `update.js`)

The top-level `state` string drives the entire game:

| Value | Meaning |
|---|---|
| `title` | Title screen, game not running |
| `playing` | Normal exploration |
| `carrying` | Player escorting a rescued narwhal to the hub portal |
| `fact` | Narwhal fact/dialogue popup open; game paused |
| `shop` | Void shopkeeper popup open; game paused |
| `quiz` | *(dormant)* Void Keeper trivia quiz — HTML element exists but this state value is never set in JS |
| `boss` | Evil Orca boss fight |
| `win` / `lose` | End screens |

`update(dt)` is called only when state is `playing`, `carrying`, or `boss`. The `fact` and `shop` states intentionally skip `update`, freezing all simulation behind the popup.

> **Note — `#bossLoseScreen`**: When the player dies during the boss fight (`showBossLoseTrivia`, `update.js`), `state` is set to `'lose'` and the `#bossLoseScreen` overlay is shown with a random trivia question. A correct answer restores the player to full HP and transitions `state` back to `'boss'` after 1.2 s. A wrong answer shows a new question (state stays `'lose'`). This is implemented entirely via a `div` overlay — there is no separate state value for this screen.

> **Note — `controlMode`**: `controlMode` (`state.js`) is a mutable variable (`'wasd'` or `'mouse'`) that switches how the player steers. It is toggled by `#controlToggleBtn` in `main.js`. See the Key Global Variables table in [CLAUDE.md](../../CLAUDE.md) for the primary reference.

---

## Game Loop (`update.js`)

```
requestAnimationFrame → gameLoop(ts) → update(dt) → render()
```

`gameLoop` caps `dt` at 50 ms to prevent spiral-of-death on tab switch. `render()` always runs regardless of state. There is exactly one `requestAnimationFrame` call — do not add more.

---

## Realms & Progression (`constants.js` / `update.js`)

Six exploration realms plus a boss arena:

| id | Description |
|---|---|
| `hub` | Starting area; contains portals to all other realms |
| `water` | First unlocked realm |
| `fire` | Requires water narwhal rescued |
| `earth` | Requires fire narwhal rescued |
| `air` | Requires earth narwhal rescued |
| `void` | Requires all four narwhals AND 5 sand dollars |
| `boss` | Final arena; no portal, triggered by `startBoss()` |

Unlock logic lives in `canEnterRealm` (`update.js`). `UNLOCK_CHAIN` (`constants.js`) defines the dependency order. `voidUnlocked` (`state.js`) is a permanent flag set to `true` after the first void entry purchase.

`enterRealm(id)` (`update.js`) transitions to a new realm: resets obstacles via `generateObstacles`, clears enemies and projectiles, repositions the player, and updates the UI label.

---

## Narwhal Companions (`constants.js` / `update.js`)

`NARWHAL_DEFS` (`constants.js`) is an array of 5 companion definitions:

| id | Name | Element | Special |
|---|---|---|---|
| `water` | Squirt | water | Standard projectile |
| `fire` | Spark | fire | Standard projectile |
| `earth` | Root | earth | Standard projectile |
| `air` | Breeze | air | Heals player + companions instead of attacking |
| `void` | Luma | void | Fires a void projectile toward cursor in any active scene; on boss hit also deals 10–30% bonus HP damage and shows the black hole visual |

`rescuedSet` (`state.js`) is a `Set<string>` of rescued companion ids. Active companions orbit the player via `getOrbitPos(idx, total)` (`update.js`) and auto-fire at the nearest enemy through `updateAutoFire`. The currently selected companion (`selectedElement`, `state.js`) also fires on mouse click.

Companion HP is tracked in `companionHp` (`state.js`), capped at `COMPANION_MAX_HP = 60` (`constants.js`). The UI cooldown overlays and companion HP bars are updated each frame by `updateCooldownUI` and `updateCompanionUI` (both in `update.js`).

---

## Combat (`update.js` / `obstacles.js`)

**Element system**: `ELEM_COLORS`, `ELEM_WEAKNESSES`, `REALM_ENEMY_ELEMENT` (all in `constants.js`).
- Hitting an enemy with its weakness element applies ×2 damage (`checkProjHitEnemies` in `update.js`).
- `void` element has no weakness.

**Projectiles**: `projectiles` — player/companion shots; `enemyProjectiles` — enemy shots. Both are arrays of `{x,y,vx,vy,r,damage,element,…}` objects updated and culled each frame in `updateProjectiles` (`update.js`). Both use PNG sprites keyed by element (`water-player-projectile`, `enemy-water`, etc.), rotated to face direction of travel via `atan2(vy,vx)+π/2`. `PLAYER_PROJ_IMG_SIZE=24` and `PROJ_IMG_SIZE=36` control display sizes independently. Void player projectiles additionally draw a radial gradient underneath the sprite to communicate the pull effect.

**Coin drops**: Defeated enemies call `spawnCoin(x,y)` (`update.js`). Coins bob in place until the player walks over them, incrementing `sandDollars`. `updateCoinPickups` (`update.js`) / `drawCoinPickups` (`draw.js`) manage them.

**Obstacle effects** (`applyObstacleEffects`, `obstacles.js`):
- Fire rocks: apply burn damage over time
- Earth trees: set `playerEntangled` (slows movement)
- Air/void clouds: apply a velocity impulse via `playerBlown`

**Enemy spawning**: `spawnEnemies(bossMode)` (`update.js`) populates the `enemies` array. Enemy element matches the current realm. Each enemy uses `updateEnemy` (`update.js`) for AI movement and shooting.

---

## Evil Orca Boss Fight (`update.js` / `state.js`)

`boss` object (`state.js`): `{x, y, r, hp, maxHp, speed, velX, velY, shootTimer, phase, alive, dmgFlash, angle}`.

Three phases triggered by HP thresholds (50% → phase 2, 25% → phase 3), each increasing speed and bullet complexity. Phase 2 adds exhaust flame particles.

`startBoss()` (`update.js`) transitions state to `boss`, locks the player to the bottom third of the screen, and shows the boss HP bar. `updateBoss(dt)`, `updateBossAutoFire(dt)`, and `updateBossMinion` handle the boss update path, all in `update.js`, all called from within `update(dt)`.

`blackHoleEffect` (`state.js`) is a transient object spawned when a void special projectile hits a target or reaches its cursor target position, in any active state; in boss fights only, also applies 10–30% of boss max HP as bonus damage and renders the '% HP' text.

---

## Void Realm Physics (`obstacles.js`)

`lumaState` (`obstacles.js`) tracks Luma's position, velocity, spin angle, and bounce timer while she is uncaptured. `updateVoidPhysics(dt)` (`obstacles.js`) applies elastic wall and obstacle collisions. The 20 void obstacles are dynamic — they move, spin, and collide with each other — but only while `currentRealm === 'void'` and Luma is unrescued.

---

## Rendering (`draw.js`)

`render()` (`draw.js`) draws the full frame in this order:

1. `drawBackground()` — SVG image + gradient overlay + optional hex grid or animated ocean waves
2. Portals (`drawPortal`) — hub realm shows all six portals; other realms show only the hub return portal
3. Obstacles (`drawObstacle`, `obstacles.js`) — procedural shapes: `bubble`, `lavarock`, `tree`, `cloud`, `rift`
4. Coin pickups, enemies, companions, player, particles
5. Popups and end screens rendered via CSS overlay (HTML elements, not canvas)

`drawNarwhal(x, y, angle, scale, color, flash, imgKey)` (`draw.js`) is reused for the player, all companions, all captive narwhals, and the shopkeeper — it draws the PNG sprite centered and rotated to face `angle`.

---

## UI Overlay

The HTML `#ui` div sits absolutely over the canvas (pointer-events: none except for buttons). Key elements:

| id | Purpose |
|---|---|
| `#healthFill` | Player HP bar width (0–100%) |
| `#sandDollars` | Sand dollar count display |
| `#abilityBar` | Five ability slots with emoji, cooldown overlay, and mini HP bar |
| `#companionBars` | Per-companion HP bars shown when rescued |
| `#factPopup` | Narwhal fact / dialogue popup (CSS scale transition) |
| `#shopPopup` | Void shopkeeper popup |
| `#quizPopup` | *(dormant)* Void Keeper trivia quiz — element exists, state is never set |
| `#bossHPWrap` | Boss HP bar (hidden until boss fight starts) |
| `#bossLoseScreen` | Post-boss-death overlay: shows a narwhal trivia question; correct answer allows retry |
| `#realmLabel` | Current realm name chip |
| `#statusMsg` | Temporary on-screen message (shown by `showStatus`) |
