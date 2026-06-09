# Working Log — 2026-06-07

**Session goal**: Address four playtest feedback items: replace emoji narwhal icons in fact popups with actual PNG portraits, add a chained Breeze healing-tip popup after her rescue card, fix portal canvas text vertical overlap, and strip redundant emoji prefixes from UI strings throughout.

---

## Changes

### Fact popup narwhal portrait — HTML, CSS, JS
**Why**: The `#factNarwhal` element was a text div showing an emoji; the narwhal PNG assets already existed and should be used for a consistent visual treatment.
**What**: Changed `#factNarwhal` from a `<div>` to an `<img>` in `index.html` and re-styled it in CSS to `96×96px object-fit:contain`. All four JS call sites that set the narwhal display (`freeNarwhal`, `meetLuma`, `showReadyPrompt`, `showRealmTip`) were updated from `.textContent = emoji` to `.src = 'assets/narwhal-{id}.png'`. The `showRealmTip` signature changed its second parameter from an emoji string to a narwhal ID string; its three call sites in `enterRealm` were updated accordingly.
**Files**: `src/index.html`, `src/styles.css`, `src/update.js`, `src/main.js`

### Breeze chained popup
**Why**: The air narwhal's healing explanation was appended as extra text to her rescue fact, which felt cluttered. It belongs in a dedicated follow-up card that appears after the rescue fact is dismissed.
**What**: Added `let factChainFn = null` as a nullable callback. `freeNarwhal()` sets `factChainFn = showBreezeTip` when freeing the air narwhal. The `factBtn.onclick` handler in `main.js` checks `factChainFn` first — if set, it clears it, calls the function (which swaps the popup content in place), and returns without dismissing the popup. Added `showBreezeTip()` which sets `factResumeState = 'carrying'` and fills the popup with Breeze's healing message. Removed the inline air-specific text from `freeNarwhal`.
**Files**: `src/update.js`, `src/main.js`

### Portal canvas text vertical spacing
**Why**: After a previous font-size increase, the text lines in the void portal and the "Need:" hint under normal portals were overlapping.
**What**: Increased the three y-offsets in the void portal block from `baseR+10/+26/+40` to `baseR+12/+48/+70`. Moved the "Need:" hint on normal portals from `y+56` to `y+72`.
**Files**: `src/draw.js`

### Emoji prefix removal from UI strings
**Why**: With narwhal PNG portraits now appearing in context, the `emoji + name` pattern in labels is redundant.
**What**: Removed the emoji prefix from: captive narwhal canvas name label, active companion label in `setSelected()`, realm unlock hint in `enterRealm()`, portal "Need:" hint (also switched from `?.emoji` to `?.name`), and the remaining emoji in Luma's `factTitle` in `NARWHAL_DEFS` (the other four were already stripped in the prior session).
**Files**: `src/draw.js`, `src/update.js`, `src/constants.js`

---

## Notes
- `showBreezeTip()` does not re-call `popup.classList.add('show')` — it relies on the popup remaining open since `factBtn.onclick` returns early (before `classList.remove`) when the chain fires.
- The `initNarwhalIcons()` function in `main.js` had a now-redundant `factNarwhal.textContent = ''` initialization that was removed.
