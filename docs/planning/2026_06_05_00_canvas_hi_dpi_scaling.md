# Plan: Canvas Hi-DPI / Crisp Sprite Rendering
**Date**: 2026-06-05

## Goal
Apply standard DPR (device pixel ratio) scaling to the game canvas so that sprite art (512×512 narwhals, 256×256 enemies) is drawn into a higher-resolution backing buffer, eliminating pixelation. The canvas CSS display size stays at 800×600 and all game coordinate math stays unchanged; only the internal buffer resolution and a single `ctx.scale` call change.

## Context
- `src/index.html` line 10: canvas HTML attribute is hard-coded `width="800" height="600"`.
- `src/constants.js` line 1: `const W=800,H=600` — used everywhere as the logical coordinate space.
- `src/state.js` line 1: `const canvas=document.getElementById('c'),ctx=canvas.getContext('2d')` — only place canvas/ctx are initialized; `ctx.scale` must go here, after buffer resize.
- `src/draw.js` line 7: `ctx.drawImage(img,-s/2,-s/2,s,s)` where `s = NARWHAL_SIZE * scale = 80px`. At 80 buffer pixels from a 512×512 source, browsers use coarse downsampling; on a 2× DPR screen those 80 buffer pixels are stretched to 160 physical pixels → blocky result.
- `src/draw.js` line 34: enemy drawn at `ENEMY_SIZE=48` buffer pixels from a 256×256 source.
- `src/draw.js` line 221: `ctx.clearRect(0,0,W,H)`. With `ctx.scale(2,2)` active, this clears the logical 800×600 area which maps to the full 1600×1200 physical buffer — already correct, no change needed.
- `src/draw.js` font sizes (e.g. `'17px Nunito'`) and shadow blur values are in logical pixels and will scale correctly into the buffer — text and shadows will render at the same visual size but with more physical pixels, so sharper. No font sizes need adjustment.
- `src/input.js` lines 63–64: mouse coordinates are already normalized via `(clientX-rect.left)*(W/rect.width)` so they remain correct regardless of canvas buffer size or CSS scale.
- `src/styles.css` line 28: `#gameWrapper` uses `transform:scale(var(--game-scale))` (1×/1.25×/1.5×). The CSS scale further magnifies pixelation when the backing buffer is only 800×600.

## Design Decisions

**Place `CANVAS_SCALE` in `src/constants.js` alongside `W` and `H`.**
It is a canvas-dimension constant, not runtime state. Putting it in `constants.js` makes it available to all files (which are loaded after constants.js per index.html script order) and makes the relationship to `W`/`H` obvious.

**Use a minimum 2× backing buffer (not raw `devicePixelRatio`).**
`devicePixelRatio` is 1 on many non-retina monitors, which would leave 1× users pixelated at the 1.5× CSS scale setting. A minimum of 2× ensures crispness in all common scenarios. Formula: `Math.max(Math.ceil(window.devicePixelRatio || 1), 2)`. A 3× DPR device gets a 3× buffer rather than being capped.

**Exact initialization order: buffer resize → style pin → ctx.scale.**
Assigning `canvas.width` or `canvas.height` resets *all* 2D context state, including any prior `ctx.scale`. Therefore `ctx.scale(CANVAS_SCALE, CANVAS_SCALE)` must be the last step. The style pin (`canvas.style.width = W+'px'`) must come after the buffer resize because changing `canvas.width` also resets the element's intrinsic CSS size to the new pixel count, which would break the layout.

**Apply `ctx.scale(CANVAS_SCALE, CANVAS_SCALE)` once at init, change nothing else.**
All game drawing uses logical coordinates (0–800 / 0–600). `ctx.scale` multiplies every coordinate and size before they hit the buffer. `ctx.save`/`ctx.restore` preserve the root scale on the matrix stack — all save/restore pairs in draw.js are already balanced so the root scale is not accidentally consumed.

**Alternatives ruled out:**
- Increasing `NARWHAL_SIZE`/`ENEMY_SIZE` — changes gameplay geometry (hitbox feel, screen coverage) with no rendering benefit over ctx.scale.
- Re-initializing canvas on each scale-bar change — more complex; not needed since a fixed ≥2× buffer already beats any CSS scale combination.
- `imageSmoothingEnabled = false` — produces hard-pixel retro look, opposite of the goal.

## Out of Scope
- Changing `NARWHAL_SIZE`, `ENEMY_SIZE`, `BOSS_W/H`, or any gameplay constants.
- Applying DPR scaling to the small UI canvases (`playerIconHP`, `titleNarwhalCanvas`). These use their own local contexts and are unaffected by the main canvas change.
- Fixing the unrelated `orca-boss` / `cybertruck-boss` image key mismatch (separate pre-existing bug — boss sprite is already invisible, making boss crispness untestable in this session).
- Mouse coordinate fixes for the CSS scale bar (pre-existing issue, not introduced by this change).

## Tasks
- [x] Add `CANVAS_SCALE` constant to `src/constants.js` (after `W`/`H` on line 1) using `Math.max(Math.ceil(window.devicePixelRatio || 1), 2)`.
- [x] In `src/state.js` immediately after line 1 (canvas/ctx setup), in this exact order: set `canvas.width = W * CANVAS_SCALE`, set `canvas.height = H * CANVAS_SCALE`, set `canvas.style.width = W+'px'`, set `canvas.style.height = H+'px'`, call `ctx.scale(CANVAS_SCALE, CANVAS_SCALE)`.
- [ ] Open the game in a browser at 1× scale bar: verify narwhal and enemy sprites are visibly sharper (no blockiness on horn/fin outlines), verify canvas is still 800×600 CSS, verify text is same visual size.
- [ ] Switch to 1.5× scale bar: verify sprites remain crisp (no pixelation from CSS upscale).
- [ ] Confirm mouse-mode controls still aim correctly (click a target, projectile tracks to cursor position).
