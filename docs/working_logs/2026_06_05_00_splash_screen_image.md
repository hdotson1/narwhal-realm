# Working Log — 2026-06-05

**Session goal**: Replace the text-based title screen with a full-screen hand-drawn splash image, revealing a start button after a 2-second fade-in delay.

---

## Changes

### Splash screen image replaces text title screen
**Why**: The hand-drawn `splash-screen.png` art (title, characters, byline) makes a better first impression than the generic text/canvas narwhal combination it replaced.
**What**: Removed the `#titleNarwhalCanvas`, `<h1>`, and `<p>` from `#titleScreen` and replaced them with a full-bleed `<img>` using `object-fit:contain`. The `#startBtn` label was shortened to `🌊 Play` since the image already carries the title. A `splash-btn-hidden` class holds the button invisible on load; a `setTimeout` in `_startGame` removes it after 2 seconds with a 0.6s opacity fade.
**Files**: `src/index.html`, `src/main.js`, `src/styles.css`, `src/assets/splash-screen.png`

### CSS selector split and dead rule cleanup
**Why**: The title screen no longer uses a dark overlay background or any text rules; keeping them in the shared selector would tint the splash image and leave unreachable rules.
**What**: Split the shared `#titleScreen,#winScreen,#loseScreen` selector into separate rules so the background could be removed from `#titleScreen` only. Removed `#titleScreen h1`, `#titleScreen p`, `.titleNarwhal`, and `@keyframes pulse`. Preserved `@keyframes bob` (still used by win screen emoji). Removed the now-unused `--font-title` CSS variable.
**Files**: `src/styles.css`

### Hover fix for absolutely-positioned start button
**Why**: `#startBtn` uses `transform:translateX(-50%)` for centering, which conflicts with `.bigBtn:hover`'s `transform:scale(1.07)`. Without a fix, hovering would drop the centering translate.
**What**: Added an `#startBtn:hover` rule combining both transforms, and merged the opacity transition into the `#startBtn` transition shorthand so all three animated properties work together.
**Files**: `src/styles.css`

### Bundled: asset updates and boss image rename
**Why**: These changes were pending from a prior session and had not been committed.
**What**: Updated narwhal and enemy sprite PNGs. Removed `cybertruck-boss.png` and added `orca-boss.png`; updated `drawCybertruck` to load the new key `'orca-boss'`.
**Files**: `src/assets/*.png`, `src/draw.js`

---

## Notes
- `--font-title-p` was kept — it is still consumed by `#winScreen p`.
- `margin-top:20px` on `.bigBtn` is harmless for the absolutely-positioned start button but still meaningful for win/lose screen buttons.
