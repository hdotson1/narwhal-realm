# Working Log — 2026-06-05

**Session goal**: Increase the canvas backing buffer resolution so that high-resolution sprite art (512×512 narwhals, 256×256 enemies) renders crisply instead of pixelated.

---

## Changes

### Canvas DPR scaling
**Why**: The canvas buffer was fixed at 800×600 regardless of display DPR or the CSS scale bar (1×/1.25×/1.5×). On high-DPI screens and at higher scale-bar settings, each canvas pixel was stretched across multiple physical pixels, making sprites blocky.
**What**: Added a `CANVAS_SCALE` constant (minimum 2, or `devicePixelRatio` if higher) to `constants.js`. In `state.js`, the canvas buffer is immediately resized to `W × CANVAS_SCALE` by `H × CANVAS_SCALE`, the CSS display size is pinned back to 800×600 px, and `ctx.scale(CANVAS_SCALE, CANVAS_SCALE)` is applied once. All game logic and coordinates remain in the 800×600 logical space.
**Files**: `src/constants.js`, `src/state.js`

---

## Notes
- The buffer resize must precede the CSS style pin and the `ctx.scale` call — assigning `canvas.width` resets all 2D context state, including any prior transform.
- All `ctx.save`/`ctx.restore` pairs in `draw.js` are balanced, so the root scale persists correctly across frames.
- `ctx.clearRect(0,0,W,H)` in `render()` already clears the full physical buffer because the scale transform propagates into it.
- Font sizes and shadow blur values are in logical pixels and remain visually unchanged; they simply render with more physical pixels behind them.
- Mouse coordinate normalization in `input.js` (`(clientX - rect.left) * (W / rect.width)`) is already scale-aware and required no changes.
- The small UI canvases (`playerIconHP`, `titleNarwhalCanvas`) use independent contexts and are out of scope.
- An unrelated pre-existing bug (`IMAGES['orca-boss']` key vs. the loaded `cybertruck-boss` key) prevents the boss sprite from appearing; this was not introduced or addressed in this session.
