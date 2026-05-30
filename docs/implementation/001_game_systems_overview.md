# 001 — Game Systems Overview

The entire game lives in a single file: `index.html` (~1846 lines). Sections are separated by banner comments in the form `// ── NAME ──`. There is no build step, module system, or external JavaScript beyond Google Fonts (CSS import) and a QR code library loaded lazily on the win screen.

The canvas is 800×600 px, id `c`. All game drawing uses the 2D context `ctx`. The HTML above the `<script>` block contains the UI overlay (health bar, ability slots, popups) positioned absolutely over the canvas.

---

## Image Loading (line 174)

All PNGs and SVGs are loaded at startup into the `IMAGES` dict before the game loop starts. `_imgsTotal` / `_imgsLoaded` / `_onImgsReady` coordinate a simple callback-based ready gate. The game loop only starts after all images report `onload` or `onerror`.

Asset keys match filenames without extensions: `narwhal-player`, `enemy-water`, `bg-hub`, `cybertruck-boss`, etc.

---

## State Machine (line 188)

The top-level `state` string drives the entire game:

| Value | Meaning |
|---|---|
| `title` | Title screen, game not running |
| `playing` | Normal exploration |
| `carrying` | Player escorting a rescued narwhal to the hub portal |
| `fact` | Narwhal fact/dialogue popup open; game paused |
| `shop` | Void shopkeeper popup open; game paused |
| `quiz` | Void Keeper trivia quiz; game paused |
| `boss` | Final Cybertruck boss fight |
| `win` / `lose` | End screens |

`update(dt)` is called only when state is `playing`, `carrying`, or `boss`. The `fact`, `shop`, and `quiz` states intentionally skip `update`, freezing all simulation behind the popup.

---

## Game Loop (line 988)

```
requestAnimationFrame → gameLoop(ts) → update(dt) → render()
```

`gameLoop` caps `dt` at 50 ms to prevent spiral-of-death on tab switch. `render()` always runs regardless of state. There is exactly one `requestAnimationFrame` call — do not add more.

---

## Realms & Progression (line 252)

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

Unlock logic lives in `canEnterRealm` (line 254). `UNLOCK_CHAIN` (line 252) defines the dependency order. `voidUnlocked` (line 253) is a permanent flag set to `true` after the first void entry purchase.

`enterRealm(id)` (line 1276) transitions to a new realm: resets obstacles via `generateObstacles`, clears enemies and projectiles, repositions the player, and updates the UI label.

---

## Narwhal Companions (line 281)

`NARWHAL_DEFS` (line 281) is an array of 5 companion definitions:

| id | Name | Element | Special |
|---|---|---|---|
| `water` | Squirt | water | Standard projectile |
| `fire` | Spark | fire | Standard projectile |
| `earth` | Root | earth | Standard projectile |
| `air` | Breeze | air | Heals player + companions instead of attacking |
| `void` | Luma | void | Black-hole projectile; instant phase damage in boss fight |

`rescuedSet` (line 349) is a `Set<string>` of rescued companion ids. Active companions orbit the player via `getOrbitPos(idx, total)` (line 983) and auto-fire at the nearest enemy through `updateAutoFire` (line 1197). The currently selected companion (`selectedElement`, line 329) also fires on mouse click.

Companion HP is tracked in `companionHp` (line 306), capped at `COMPANION_MAX_HP = 60` (line 305). The UI cooldown overlays and companion HP bars are updated each frame by `updateCooldownUI` (line 1187) and `updateCompanionUI` (line 309).

---

## Combat (line 648)

**Element system**: `ELEM_COLORS` (line 648), `ELEM_WEAKNESSES` (line 649), `REALM_ENEMY_ELEMENT` (line 650).
- Hitting an enemy with its weakness element applies ×2 damage (`checkProjHitEnemies`, line 1246).
- `void` element has no weakness.

**Projectiles**: `projectiles` — player/companion shots; `enemyProjectiles` — enemy shots. Both are arrays of `{x,y,vx,vy,r,damage,elem,…}` objects updated and culled each frame in `updateProjectiles` (line 1224).

**Coin drops**: Defeated enemies call `spawnCoin(x,y)` (line 683). Coins bob in place until the player walks over them, incrementing `sandDollars`. `updateCoinPickups` / `drawCoinPickups` (lines 687, 702) manage them.

**Obstacle effects** (`applyObstacleEffects`, line 519):
- Fire rocks: apply burn damage over time
- Earth trees: set `playerEntangled` (slows movement)
- Air/void clouds: apply a velocity impulse via `playerBlown`

**Enemy spawning**: `spawnEnemies(bossMode)` (line 656) populates the `enemies` array. Enemy element matches the current realm. Each enemy uses `updateEnemy` (line 1150) for AI movement and shooting.

---

## Boss Fight (line 765)

`boss` object (line 765): `{x, y, r, hp, maxHp, speed, velX, velY, shootTimer, phase, alive, dmgFlash, angle}`.

Three phases triggered by HP thresholds (50% → phase 2, 25% → phase 3), each increasing speed and bullet complexity. Phase 2 adds exhaust flame particles.

`startBoss()` (line 1480) transitions state to `boss`, locks the player to the bottom third of the screen, and shows the boss HP bar. `updateBoss(dt)` (line 1526), `updateBossAutoFire(dt)` (line 1496), and `updateBossMinion` (line 741) handle the boss update path, all called from within `update(dt)`.

`blackHoleEffect` (line 766) is a transient object created when Luma fires her void ability during the boss fight; it pulls all enemy projectiles toward a point and deals instant phase damage.

---

## Void Realm Physics (line 553)

`lumaState` (line 553) tracks Luma's position, velocity, spin angle, and bounce timer while she is uncaptured. `updateVoidPhysics(dt)` (line 560) applies elastic wall and obstacle collisions. The 20 void obstacles are dynamic — they move, spin, and collide with each other — but only while `currentRealm === 'void'` and Luma is unrescued.

---

## Rendering (line 1611)

`render()` (line 1612) draws the full frame in this order:

1. `drawBackground()` (line 834) — SVG image + gradient overlay + optional hex grid or animated ocean waves
2. Portals (`drawPortal`, line 882) — hub realm shows all six portals; other realms show only the hub return portal
3. Obstacles (`drawObstacle`, line 425) — procedural shapes: `bubble`, `lavarock`, `tree`, `cloud`, `rift`
4. Coin pickups, enemies, companions, player, particles
5. Popups and end screens rendered via CSS overlay (HTML elements, not canvas)

`drawNarwhal(x, y, angle, scale, color, flash, imgKey)` (line 782) is reused for the player, all companions, all captive narwhals, and the shopkeeper — it draws the PNG sprite centered and rotated to face `angle`. If the image is not yet loaded it falls back to a procedural ellipse.

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
| `#quizPopup` | Void Keeper trivia quiz |
| `#bossHPWrap` | Boss HP bar (hidden until boss fight starts) |
| `#realmLabel` | Current realm name chip |
| `#statusMsg` | Temporary on-screen message (shown by `showStatus`) |
