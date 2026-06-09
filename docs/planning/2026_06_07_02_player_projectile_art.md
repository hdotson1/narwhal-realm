# Plan: Player Projectile Art
**Date**: 2026-06-07

## Goal
Replace the current glowing-circle rendering for player projectiles with element-specific PNG sprites (water, fire, earth, void). The sprites are 256×409px and rotate to face their direction of travel using the same pivot/rotation logic applied to enemy projectiles in the previous session. Void projectiles additionally retain their existing radial-gradient circle underneath the sprite.

## Context
- Player projectiles live in `projectiles[]`, each with `{x, y, vx, vy, color, r, element, …}`. Current rendering is at `src/draw.js:388–396` — a plain `ctx.arc` circle fill with a glow shadow.
- Enemy projectile rendering for comparison: `src/draw.js:397–413`. Pattern: `translate → rotate(atan2+π/2) → drawImage(-s/2, -s/2, s, s*(ratio))` with fallback circle.
- Assets already present in `src/assets/`: `water-player-projectile.png`, `fire-player-projectile.png`, `earth-player-projectile.png`, `void-player-projectile.png` (256×409px each). No air asset — air (Breeze) has `damage:0` and is explicitly skipped by all `shootPlayer` call sites, so it never creates player projectiles.
- Image loading array is at `src/state.js:12–13`. Images are loaded into the shared `IMAGES` map keyed by filename stem.
- `PROJ_IMG_SIZE=36` is defined at `src/constants.js:9` for enemy sprites. Player sprites will use a separate, smaller constant.
- Void projectiles: `r=7` for auto-fire, `r=20` for the manual special (black-hole with `pullRadius=200`). Both are void element. Per design decision, both keep the radial gradient AND get the sprite overlaid on top.

## Design Decisions
**Separate display-size constant (`PLAYER_PROJ_IMG_SIZE = 24`)**: Player shots are smaller and faster than enemy shots; a distinct constant keeps the sizes independent and tunable without touching enemy projectile rendering.

**Void: gradient + sprite overlay**: Void projectiles keep their existing radial gradient (which communicates the pull effect), and the sprite is drawn on top, using the same `PLAYER_PROJ_IMG_SIZE`. The special void shot (r=20) renders the gradient at its natural `p.r` size; the sprite is drawn at `PLAYER_PROJ_IMG_SIZE` on top, unscaled from the r value. This means the sprite stays at a consistent size regardless of shot type, which matches the enemy sprite approach.

**Aspect ratio**: Player projectile PNGs are 256×409px. The height-to-width draw ratio is `409/256`. This is a different value from the enemy sprite ratio (`862/512 ≈ 1.684`); the player sprite ratio `409/256 ≈ 1.598` must be used explicitly.

**Pivot**: Same logic as enemy sprites — the 256×256 pivot square is at the top of the image, so the draw call anchors at `(-s/2, -s/2)` and the full image height is `s*(409/256)`. The rotation point is the center of the pivot square.

**No fallback for air**: Air never fires; no code change or fallback path needed.

## Out of Scope
- Changing player projectile hitbox sizes (`p.r`)
- Adding an air player projectile asset
- Visual changes to enemy projectiles
- Adjusting `PROJ_IMG_SIZE` or enemy projectile rendering
- Scaling the sprite with `p.r` — sprite size is fixed at `PLAYER_PROJ_IMG_SIZE`

## Tasks
- [x] **constants.js** — Add `PLAYER_PROJ_IMG_SIZE = 24` after the existing `PROJ_IMG_SIZE` constant at line 9
- [x] **state.js** — Append `'water-player-projectile'`, `'fire-player-projectile'`, `'earth-player-projectile'`, `'void-player-projectile'` to the image-loading array at line 12
- [x] **draw.js** — Replace the player projectile rendering block (lines 388–396) with the new logic:
  - For all elements: attempt to look up `IMAGES[p.element+'-player-projectile']`
  - For void: keep the entire existing `beginPath → arc(p.r) → createRadialGradient(…, p.r) → fill` block as-is, then draw the sprite on top inside a `save()`/`restore()` block if the image is ready. The gradient outer radius stays `p.r` (already scales with r=7 vs r=20 from existing code).
  - For water/fire/earth: draw the sprite inside `save()`/`restore()` if the image is ready; fall back to a plain glowing circle (matching the existing non-void branch) if not. Keep the fallback outside any save/restore to avoid leaking shadow state.
  - Sprite draw call: `translate(p.x,p.y)` → `rotate(atan2(p.vy,p.vx)+π/2)` → `shadowColor + shadowBlur` → `drawImage(img, -s/2, -s/2, s, s*(409/256))` → `shadowBlur=0` → `restore()`
  - Note: boss-fight companion shots (`update.js:625`) also push to `projectiles[]` with element set, so they will also render with the new sprites — verify void Luma shots look correct during the boss fight.
