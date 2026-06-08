# Working Log — 2026-06-07

**Session goal**: Fix three small canvas/UI alignment and interaction issues: sand dollar image alignment in the void portal panel, splash screen click-to-advance, and portal name label positions.

---

## Changes

### Sand dollar image vertical alignment
**Why**: The image was drawn at `cy-8` while `textBaseline` was `'top'`, causing it to appear ~10px too high relative to the flanking text segments.
**What**: Changed the `drawImage` y-offset from `cy-8` to `cy+2`, shifting the image down 10px so its visual center aligns with the text midline.
**Files**: src/draw.js

### Portal name label positions
**Why**: Both the void and normal portal name labels sat too close to the portal circle graphic.
**What**: Bumped the void portal label offset from `baseR+12` to `baseR+22`, and the normal portal label from `p.y+42` to `p.y+52`, pushing each label 10px lower.
**Files**: src/draw.js

### Splash screen click-to-advance
**Why**: The Play button was hidden behind a hard 2-second timer with no way to skip it, which felt sluggish on repeat plays.
**What**: Stored the `setTimeout` reference so it can be cancelled; added a `{once:true}` click listener on `#titleScreen` that clears the timer and immediately reveals the Play button on any click.
**Files**: src/main.js

---

## Notes
No architectural changes. All three fixes were isolated to two files and matched the plan exactly. Sub-labels below the portal name were intentionally left in place — the narrowed gap (20px instead of 30px for normal portals) still reads clearly.
