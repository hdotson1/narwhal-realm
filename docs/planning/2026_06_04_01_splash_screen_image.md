# Plan: Splash Screen Image Replace
**Date**: 2026-06-04

## Goal
Replace the current text-based title screen (canvas narwhal, h1 title, p description) with `src/assets/splash-screen.png` as a full-screen image. After a 2-second delay the start button fades in centered over the image. This gives the game a polished first impression using the hand-drawn art that already includes the game title and characters.

## Context
- `#titleScreen` div: [index.html:71–76](src/index.html#L71-L76) — currently holds `#titleNarwhalCanvas`, `<h1>`, `<p>`, and `#startBtn`
- `#titleScreen` CSS: [styles.css:68–75](src/styles.css#L68-L75) — positions it absolute over the canvas with a dark `rgba(5,10,25,0.95)` background; includes h1 pulse animation and narwhal bob
- `startBtn` onclick: [main.js:2–5](src/main.js#L2-L5) — hides `#titleScreen`, sets `state='playing'`, calls `enterRealm('hub')`
- `initNarwhalIcons`: [main.js:66–71](src/main.js#L66-L71) — calls `drawNarwhalToCanvas` on `#titleNarwhalCanvas`; this reference becomes dead code after the canvas is removed
- No canvas drawing is involved in the title screen after this change — it's pure HTML/CSS

## Design Decisions
- **Image sizing**: `object-fit: contain` with a dark (`#0a0a1a`) background so the full artwork is visible without cropping, regardless of the image's exact pixel dimensions.
- **Start button delay**: 2-second `setTimeout` added in `_startGame()` in `main.js`; the title screen is visible from page load, so the timer effectively begins when the user first sees the splash. The button starts with `opacity:0;pointer-events:none` and gains an `opacity:1;pointer-events:auto` class after 2s via a CSS transition.
- **Button label**: Change from `🌊 Start Adventure!` to `🌊 Play` — shorter and less redundant since the splash art carries the game identity.
- **Background**: The shared CSS selector `#titleScreen,#winScreen,#loseScreen{…background:rgba(5,10,25,0.95)}` on styles.css:68 must be **split** into separate rules before removing the background from `#titleScreen` only; the win/lose screens keep their dark overlay.
- **Narwhal canvas**: Remove `#titleNarwhalCanvas` from the HTML and the `drawNarwhalToCanvas` call for it in `initNarwhalIcons`.
- **Existing CSS to remove**: `#titleScreen h1`, `#titleScreen p`, `.titleNarwhal` rules. **Do NOT remove `@keyframes bob`** — it is also used by `#winEmoji` on the win screen.
- **Button positioning**: After removing the title text, the button needs explicit absolute positioning: `position:absolute; bottom:60px; left:50%; transform:translateX(-50%)` so it sits centered near the bottom of the splash image.

## Out of Scope
- Changing any behavior after the user clicks Start (game entry flow is unchanged)
- Adding sound or video to the splash
- Responsive scaling of the splash image (handled by existing `--game-scale` CSS var on `#gameWrapper`)
- Animated transitions when dismissing the splash

## Tasks
- [x] **index.html:71–76** — Replace `#titleScreen` contents: remove `#titleNarwhalCanvas`, `<h1>`, and `<p>`; add `<img id="splashImg" src="assets/splash-screen.png" alt="">` as the first child; update `#startBtn` label to `🌊 Play`; add class `splash-btn-hidden` to `#startBtn`
- [x] **styles.css:68** — Split the shared selector `#titleScreen,#winScreen,#loseScreen{…}` into separate `#titleScreen{…}` and `#winScreen,#loseScreen{…}` rules; remove `background` from the `#titleScreen` rule only (win/lose keep `rgba(5,10,25,0.95)`)
- [x] **styles.css** — Add `#splashImg{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;background:#0a0a1a;border-radius:12px;}`
- [x] **styles.css** — Add `.splash-btn-hidden{opacity:0;pointer-events:none;}` and `#startBtn{transition:opacity 0.6s ease;position:absolute;bottom:60px;left:50%;transform:translateX(-50%);}` (override the flex-centering so the button floats over the image)
- [x] **styles.css:69–75** — Remove `#titleScreen h1{…}`, `#titleScreen p{…}`, and `.titleNarwhal{…}` rules (leave `@keyframes bob` intact — used by win screen)
- [x] **main.js:67** — Remove `drawNarwhalToCanvas(document.getElementById('titleNarwhalCanvas'),70)` from `initNarwhalIcons` (element no longer exists)
- [x] **main.js:76–79** — After `initNarwhalIcons()` in `_startGame`, add `setTimeout(()=>{ document.getElementById('startBtn').classList.remove('splash-btn-hidden'); }, 2000)` to trigger the 2s delayed fade-in
