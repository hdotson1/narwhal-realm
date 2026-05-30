# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `src/index.html` directly in a browser — no build step, no server, no dependencies.

## Architecture

The game lives in `src/` as three files: `index.html` (markup only), `styles.css`, and `game.js`. Art assets are in `src/assets/`. There is no module system, bundler, or external JS beyond Google Fonts and a QR code library loaded lazily on the win screen.

### State Machine

A top-level `state` string drives what gets updated and rendered each frame:

| State | Meaning |
|---|---|
| `title` | Title screen shown, game not started |
| `playing` | Normal exploration |
| `carrying` | Player rescued a narwhal and must escort it to the hub portal |
| `fact` | Fact/dialogue popup shown; game is paused behind it |
| `shop` | Void shopkeeper popup open |
| `boss` | Final Cybertruck boss fight |
| `win` / `lose` | End screens |

### Game Loop

`requestAnimationFrame` → `gameLoop(ts)` → calls `update(dt)` then `render()` every frame. `update` is skipped in `fact`/`shop`/`quiz` states (popup pauses the game). Boss fight has its own update path (`updateBoss`, `updateBossAutoFire`, `updateBossMinion`) called from within `update`.

### Realms & Progression

Six exploration realms plus a boss arena, each with a unique background, obstacle theme, and enemy element. Unlock order is enforced by `canEnterRealm`: water is always open, fire requires water narwhal rescued, earth requires fire, air requires earth. The void realm requires all four narwhals **and** 5 sand dollars.

Each non-hub realm contains one captive narwhal (`captiveNarwhals` array). Touching it triggers `freeNarwhal` (shows fact popup) or `meetLuma` for the void narwhal. After the popup the player enters `carrying` state and must walk back to the hub portal.

### Narwhals / Companions

`NARWHAL_DEFS` (array of 5) defines each companion: element, emoji, damage, cooldown, colors. Rescued narwhals are tracked in `rescuedSet` (a `Set`). Active companions orbit the player (`getOrbitPos`) and auto-fire at the nearest enemy; the selected companion (`selectedElement`) also fires manual ability shots. Air (Breeze) heals instead of attacking; Void (Luma) fires a black-hole projectile or instant boss damage during the boss fight.

### Combat

- `projectiles` — player shots; `enemyProjectiles` — enemy shots.
- `checkProjHitEnemies` applies a ×2 damage multiplier when element matches `ELEM_WEAKNESSES` of the target.
- Obstacles have per-realm special effects: fire rocks burn, earth trees entangle, air/void clouds blow the player with a velocity impulse (`playerBlown`).
- Boss has 3 phases (HP thresholds at 50% and 25%), each increasing speed and bullet-pattern complexity.

### Key Global Variables

| Variable | Purpose |
|---|---|
| `state` | Current game state (see above) |
| `currentRealm` | Active realm id (`hub`, `water`, …, `boss`) |
| `rescuedSet` | Set of rescued narwhal ids |
| `selectedElement` | Which narwhal's ability is active (1–5 keys) |
| `sandDollars` | Currency; coin drops from enemies, spent to enter void |
| `player` | Player object `{x,y,hp,maxHp,speed,r,angle,invincible,dmgFlash}` |
| `obstacles` | Per-realm obstacle array, regenerated on `enterRealm` |
| `boss` | Boss state object `{x,y,hp,maxHp,phase,speed,alive,…}` |
| `lumaState` | Luma's bouncing physics while uncaptured in void realm |

### Drawing

All rendering uses the 2D canvas API on an 800×600 `<canvas>`. `drawBackground` draws a gradient + optional hex grid or animated ocean waves. `drawNarwhal` is reused for the player, all companions, all captive narwhals, and the shopkeeper. Enemy robots use `drawRobot`. The Cybertruck boss uses `drawCybertruck`. Obstacle shapes (`bubble`, `lavarock`, `tree`, `cloud`, `rift`) are drawn procedurally in `drawObstacle`.

### Void Realm Physics

Luma bounces around the void realm with elastic wall and obstacle collisions (`updateVoidPhysics`). The 20 void obstacles (`rift` type) are also dynamic — they move, spin, and collide with each other. All of this only runs when `currentRealm === 'void'` and Luma hasn't been rescued.

## Documentation

Project documentation lives in `docs/`:

| Folder | Purpose |
|---|---|
| `docs/planning/` | Pre-implementation session plans — written before coding, not updated after |
| `docs/working_logs/` | Per-session change and decision logs |
| `docs/implementation/` | Technical reference for game systems; updated when architecture changes |

Run `/plan` to create a planning doc. Run `/document-and-commit-session` to write the working log and commit at the end of a session. Each folder has a `README.md` with naming conventions and format details.

## Development Workflow

1. `/plan` — scope the work and write a planning doc before touching code
2. `/execute` — implement the plan
3. `/document-and-commit-session` — log changes and commit

If asked to implement a feature without a plan document, the first step should always be to review the implementation docs and ask the user for clarification if anything is unclear or ambiguous.
