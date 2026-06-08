# Plan: UI Polish Fixes — Sand Dollar, Splash Click, Portal Labels
**Date**: 2026-06-07

## Goal
Fix three small canvas/UI alignment and interaction issues: (1) the sand dollar PNG drawn inline with canvas text in the void portal requirements panel is positioned too high; (2) the splash screen ignores clicks until a 2-second timer fires before revealing the Play button; (3) realm portal name labels sit a little too close to the portal graphic and need to move down ~10px.

## Context

### Sand dollar canvas image (draw.js:183–188)
Inside `drawPortal` for the void portal, when it is locked, a sand dollar cost line is drawn using a hybrid approach: two text segments (`pre`, `suf`) flank a `ctx.drawImage` of the sand dollar PNG. The `textBaseline` is `'top'` (set at line 169 and not reset), meaning `fillText(pre, lx, cy)` places the top of the glyphs at `cy`. The image is drawn at `cy-8` (top-left), so its 16px span runs from `cy-8` to `cy+8`, center at `cy`. Because the text baseline is `'top'`, the visual center of the text is at approximately `cy + font_height/2`, which is several pixels below `cy` — making the image appear too high relative to the text. Shifting the image top from `cy-8` to `cy+2` moves its center down ~10px, aligning it better with the text.

### Splash screen click (main.js:77)
`_startGame()` wires up a `setTimeout(..., 2000)` to remove the `splash-btn-hidden` class from `#startBtn`. There is no way to shortcut this. Adding a one-time click listener on `#titleScreen` (the splash overlay) that removes the class immediately and clears the pending timer gives click-to-advance behavior.

### Portal name labels (draw.js:170, 205)
- **Normal portals** (non-void): name drawn at `p.y+42` (line 205).
- **Void portal**: name drawn at `p.y+baseR+12`, where `baseR=70`, so `p.y+82` (line 170).
Both need their offsets bumped by 10 to push the label slightly lower relative to the portal circle.

No other portal-label code paths exist — all portals go through `drawPortal`.

## Design Decisions
- **Sand dollar shift**: Use `cy+2` (adding 10 to `cy-8`) rather than recalculating from font metrics; this matches the user's visual target and avoids over-engineering.
- **Splash click**: Attach the listener to `#titleScreen` (the full-screen overlay), not just `#splashImg`, so the entire visible area is clickable. Use `{once:true}` so it auto-removes after first click. Store the `setTimeout` return value in a variable and `clearTimeout` on click so the timer doesn't redundantly re-remove the class.
- **Portal labels**: Simple numeric bump (+10) to both offset constants. The sub-labels (unlock hints below the name) use absolute `p.y`-relative offsets — they do NOT move with the name label. This narrows the gap between the name and the first sub-label (from 30px to 20px for normal portals, and from 36px to 26px for the void portal). This is acceptable since the sub-labels were not mentioned as needing adjustment, and the narrower gap still reads clearly.

## Out of Scope
- Adjusting the sub-labels under the portal name (e.g. "Need: Water narwhal first", "❌ Need all 4 narwhals").
- The `<img>` sand dollar icons inside HTML status messages or shop text (those are DOM elements, not canvas).
- Any other splash screen changes (animation, layout, copy).
- The coin-pickup canvas rendering or the floating particle sand dollar.

## Tasks
- [x] Task 1 — `draw.js:187`: change `cy-8` to `cy+2` to lower the sand dollar image by 10px.
- [x] Task 2 — `draw.js:205`: change `p.y+42` to `p.y+52` for the normal portal name label.
- [x] Task 3 — `draw.js:170`: change `p.y+baseR+12` to `p.y+baseR+22` for the void portal name label.
- [x] Task 4 — `main.js:77`: store the `setTimeout` return value; add a `{once:true}` click listener on `#titleScreen` that calls `clearTimeout` and removes `splash-btn-hidden` immediately. (The `{once:true}` listener is harmless if the timer fires first — it runs once and clears the already-absent class.)
- [ ] Task 5 — Open `src/index.html` in a browser and verify: sand dollar image aligns with the void portal requirement text; clicking anywhere on the splash before 2s shows the Play button; portal name labels are visually lower. Adjust pixel values if needed.
