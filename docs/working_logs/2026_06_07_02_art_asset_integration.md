# Working Log — 2026-06-07

**Session goal**: Replace the 🪙 coin emoji everywhere with the sand-dollar PNG art, and replace plain glowing-circle enemy projectiles with element-specific rotating sprites.

---

## Changes

### Register new art assets
**Why**: Six new PNGs (sand-dollar + five element projectiles) need to be available via the shared `IMAGES` map before any renderer can use them.
**What**: Added all six filenames to the image-loading array in `state.js`. Added `PROJ_IMG_SIZE=36` constant for consistent projectile display size.
**Files**: `src/state.js`, `src/constants.js`

### Sand dollar — HUD display
**Why**: The coin counter in the HUD used a plain 🪙 emoji; replacing it with the PNG makes the art consistent.
**What**: Restructured the `#sandDollars` div in `index.html` to hold an `<img>` icon and a `<span id="sandDollarCount">` for the number. Updated all three JS sites that write the counter to target `#sandDollarCount` with just the numeric value.
**Files**: `src/index.html`, `src/update.js`

### Sand dollar — canvas coin pickups
**Why**: Floating coin pickups in the game world also displayed 🪙 via `fillText`.
**What**: Replaced `fillText('🪙')` with `drawImage(IMAGES['sand-dollar'])` in `drawCoinPickups`, preserving the yellow glow shadow and the despawn fade ring.
**Files**: `src/draw.js`

### Sand dollar — void portal lock text
**Why**: The void portal's lock requirement line included 🪙 inline in a canvas `fillText` call, which cannot embed images.
**What**: Replaced the single `fillText` call with a three-part render: left text segment, `drawImage` for the sand dollar, right text segment — using `measureText` to compute the start x so the combined line stays centered.
**Files**: `src/draw.js`

### Sand dollar — pickup particle
**Why**: Collecting a coin spawned a `+🪙` text particle; the new art needs a different particle type.
**What**: Introduced a `coin-img` particle type. The spawn site in `updateCoinPickups` now emits `{type:'coin-img'}` instead of a text particle. The particle renderer draws the sand-dollar image at the float-up position. The static-type guard in `updateParticles` was extended to include `coin-img` so these particles don't receive velocity movement.
**Files**: `src/update.js`, `src/draw.js`

### Sand dollar — status messages and shop dialog
**Why**: `showStatus` calls and the shop dialog text both embedded 🪙 as plain text/textContent.
**What**: Switched `showStatus` from `textContent` to `innerHTML`. Replaced the two `showStatus` call-sites that referenced 🪙 with inline `<img>` snippets. Switched the shop dialog's affordable/unaffordable text from `textContent` to `innerHTML` and replaced the `🪙` template literal interpolation with an `<img>` snippet.
**Files**: `src/update.js`

### Enemy projectile sprites — rotating element art
**Why**: Enemy projectiles were rendered as a plain glowing circle with a 📦 emoji overlay; new element-specific PNGs replace this with directional art.
**What**: The enemy projectile render loop now looks up the element-keyed image (`water-projectile`, etc.), saves the canvas transform, translates to the projectile position, rotates by `atan2(vy,vx)+π/2` so the sprite's upward-pointing art faces the direction of travel, and draws the image centered on the pivot square. A glow shadow matching the element color is applied. If the image hasn't loaded, the loop falls back to the original glowing circle.
**Files**: `src/draw.js`

---

## Notes

- The `factTitle` strings in `NARWHAL_DEFS` had their leading emojis stripped by the project linter during this session (water/fire/earth/air entries); this was not part of the plan but the linter change was accepted as-is.
- Enemy projectile hitbox sizes (`p.r`) are unchanged per plan scope.
- Player projectiles remain glowing circles per plan scope.
- The void portal lock text centering relies on `measureText` being accurate at the current font; if the font changes, the layout will auto-adjust correctly.
