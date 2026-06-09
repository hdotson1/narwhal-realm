# Plan: Playtest Polish Round 2
**Date**: 2026-06-07

## Goal
Address four playtest feedback items: fix overlapping canvas text on hub portal labels, replace emoji placeholders with actual narwhal PNG art in fact popups, add a chained Breeze healing tip popup after her rescue card, and strip the redundant emoji prefix from narwhal names throughout the UI.

## Context

**Text overlap** (Item 1): Two canvas text rendering sites in the hub have insufficient vertical spacing after the font size increase. Normal portals (`drawPortal`, draw.js:204–209) draw the realm name at `y+42` and the "Need: X first" hint at `y+56` — only 14px apart with a 22px font. The void portal (draw.js:170–190) draws three lines at `baseR+10`, `baseR+26`, and `baseR+40` — gaps of 16px and 14px against a 26px/20px font.

**Narwhal art in popup** (Item 2): `#factNarwhal` is a `<div>` whose `textContent` is set to a narwhal emoji in `freeNarwhal()` (update.js:397), `meetLuma()` (update.js:58), `showReadyPrompt()` (update.js:430), and `showRealmTip()` (update.js:415). The narwhal PNG assets already exist (`assets/narwhal-{id}.png`). `showRealmTip()` currently takes an `emoji` string as its second argument; it needs to accept a narwhal `id` to look up the correct image.

**Breeze chained popup** (Item 3): `freeNarwhal()` (update.js:399–401) appends the healing explanation directly to the fact body for the air element. The `factBtn.onclick` in main.js:6–10 immediately sets `state = factResumeState`. We need a chaining mechanism: a `factChainFn` nullable variable, checked by `factBtn.onclick` before resuming the game.

**Emoji prefix removal** (Item 4): The pattern `emoji + ' ' + name` appears in:
- `NARWHAL_DEFS[*].factTitle` strings (constants.js:30–46)
- Captive narwhal canvas label `cn.emoji+' '+cn.name` (draw.js:313)
- `setSelected()` active element label (update.js:43)
- `enterRealm()` unlock hint (update.js:370)
- `drawPortal()` "Need:" hint which uses only `emoji` but should use `name` instead (draw.js:208)

## Design Decisions

**`#factNarwhal` → `<img>`**: Change the element in HTML from `<div>` to `<img>`. CSS changes from `font-size: var(--font-emoji-sm)` to `width: 96px; height: 96px; object-fit: contain` for a clear character portrait. All JS sites switch from `.textContent = emoji` to `.src = 'assets/narwhal-'+id+'.png'`.

**`showRealmTip()` signature**: Change the second parameter from `emoji` (e.g. `'💧'`) to `narwhalId` (e.g. `'water'`). The three call sites in `enterRealm()` already know the speaking narwhal's element, so swapping in the id string is straightforward.

**Chaining mechanism**: Add `let factChainFn = null;` in update.js. `factBtn.onclick` in main.js checks this: if set, calls the function (which shows the next popup) instead of resuming `factResumeState`. `showBreezeTip()` reuses the same `factPopup` to show Breeze's healing message, sets `factResumeState = 'carrying'`, and uses "Got it!" as the dismiss label.

**Void portal spacing**: With `textBaseline='top'` and the 26px realm-name font, the first text block is ~32px tall. Increase the three y-offsets to `baseR+12`, `baseR+48`, `baseR+70`. Note: the sand-dollar line uses a local `cy` variable (not a direct constant) and also passes `cy-8` to `ctx.drawImage`. Both the `cy` assignment and the image `y` argument must be updated together.

**Normal portal spacing**: Increase "Need:" hint from `y+56` to `y+72`.

**`showRealmTip()` narwhal ID mapping**: the three call sites in `enterRealm()` currently pass emoji strings. Replace them with: fire realm → `'water'` (Squirt speaking), earth realm → `'fire'` (Spark speaking), air realm → `'earth'` (Root speaking).

**`showBreezeTip()` content**: title `'Breeze the Air Narwhal!'`, body `'HEY! I noticed you\'ve been battling hard to save all our friends. If you need a hand press [4] to activate my power to heal everyone!'`, dismiss button label `'Got it!'`. Sets `factResumeState = 'carrying'` so the chain ends back in the escort state.

**Breeze active label**: After stripping the emoji prefix, the hardcoded Breeze case in `setSelected()` becomes `'Breeze — healing mode'`.

## Out of Scope
- Any other popup (shop, boss-loss trivia, win/lose screens)
- Narwhal art orientation or animation within the popup
- Canvas text outside the hub (captive narwhal name labels were not reported as overlapping)
- Any gameplay, balance, or content changes

## Tasks
- [x] Fix void portal canvas text vertical spacing — update three y-offsets in `drawPortal()` (draw.js ~170–190)
- [x] Fix normal portal canvas text vertical spacing — move "Need:" hint from `y+56` to `y+72` (draw.js ~204–209)
- [x] Change `#factNarwhal` from `<div>` to `<img>` in HTML (index.html:55)
- [x] Update `#factNarwhal` CSS from emoji font-size to portrait image sizing (styles.css)
- [x] Update `freeNarwhal()` to set narwhal img src from `cn.id` (update.js:397)
- [x] Update `meetLuma()` and `showReadyPrompt()` to set Luma img src (update.js:58, 430)
- [x] Refactor `showRealmTip()` second param from `emoji` to `narwhalId`; set img src (update.js:415)
- [x] Update three `enterRealm()` calls to `showRealmTip()` to pass narwhal IDs (update.js:382–387)
- [x] Remove heal explanation from Breeze fact body in `freeNarwhal()` (update.js:400)
- [x] Add `let factChainFn=null` variable and `showBreezeTip()` function (update.js)
- [x] Set `factChainFn = showBreezeTip` in `freeNarwhal()` for air element (update.js)
- [x] Update `factBtn.onclick` to check and invoke `factChainFn` before resuming (main.js:6–10)
- [x] Strip emoji prefix from all five `factTitle` strings in `NARWHAL_DEFS` (constants.js:30–46)
- [x] Remove `cn.emoji+' '` from captive narwhal canvas label (draw.js:313)
- [x] Remove `def.emoji+' '` from `setSelected()` active label and fix Breeze case (update.js:43)
- [x] Remove `cn.emoji+' '` from unlock hint in `enterRealm()` (update.js:370)
- [x] Change portal "Need:" hint to use narwhal `name` instead of `emoji` — `NARWHAL_DEFS.find(n=>n.id===nid)?.name` (draw.js:208)
- [x] Reset `factChainFn = null` inside `factBtn.onclick` immediately after invoking it (main.js:6–10)
