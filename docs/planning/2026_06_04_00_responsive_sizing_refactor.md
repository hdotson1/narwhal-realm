# Plan: Responsive Text and Game Scaling
**Date**: 2026-06-04

## Goal
Refactor the game's sizing system so that (1) all text can be adjusted by semantic category without touching every individual CSS rule or inline style, and (2) the entire game can be scaled at runtime for larger screens without modifying canvas drawing code or absolute-positioned layout. The designer asked for bigger text; the developer wants a one-knob way to blow up the whole game for a monitor demo.

## Context
- `styles.css` (66 lines): ~20 hardcoded `font-size` values from 10px to 52px, each in a separate rule
- `index.html` (lines 45-103): ~15 additional `font-size` values as inline `style=""` attributes on popup divs -- `#quizPopup` children (`#quizKeeper`, `#quizQuestion`, `#quizFeedback`, `#quizProgress`), `#bossLoseScreen` children (some have IDs, first three do not), `#winScreen` first child div and `<p>` tags, `#loseScreen` first child div, `#controlToggleBtn`
- `draw.js`: ~12 hardcoded `ctx.font` strings (`'9px serif'`, `'11px Nunito,sans-serif'`, `'32px serif'`, etc.)
- `#gameWrapper` is a fixed `800x600px` container; all UI children use `position:absolute` with pixel offsets -- none of these need to change under the chosen approach
- `constants.js` (line 1): `W=800, H=600` drive canvas logic and are unchanged

## Design Decisions

### Text resizing: CSS Custom Properties with semantic names
Define named variables in `:root` in `styles.css` for each text category (e.g. `--font-ui`, `--font-ui-sm`, `--font-popup-title`, `--font-popup-body`, `--font-title`, `--font-btn`). Update all `font-size` rules in `styles.css` to reference these vars. Move inline `font-size` styles from `index.html` into CSS -- either to existing ID rules or new rules for elements that currently lack them.

For canvas text in `draw.js`, CSS vars are not available. Instead, define a parallel `CANVAS_FONT` object in `constants.js` with named string values per tier (e.g. `CANVAS_FONT.sm`, `CANVAS_FONT.md_bold`, `CANVAS_FONT.emoji_lg`). Update all `ctx.font = '...'` assignments in `draw.js` to reference these constants.

Alternative considered: `rem` units on `:root font-size` -- rejected because it gives only a single global multiplier with no per-category control.

### Whole-game scaling: CSS `transform: scale()` with a runtime toggle
Apply `transform: scale(var(--game-scale)); transform-origin: center;` to `#gameWrapper`. The canvas stays at 800x600 logical pixels; the browser handles visual scaling. This requires zero changes to `draw.js`, `constants.js`, or any absolute-positioned offsets.

A small `#scaleBar` control (`position:fixed` in a corner of the viewport, sibling of `#gameWrapper` in the HTML) lets the user cycle through scale presets: **1x**, **1.25x**, **1.5x**. `position:fixed` keeps it outside the game transform so it stays accessible at any zoom level. JS updates `document.documentElement.style.setProperty('--game-scale', value)` on click.

Alternative considered: dynamic canvas resize -- rejected as too invasive (requires scaling all drawing coordinates in `draw.js` and all game-world positions in `constants.js`).

## CSS Variable Default Values
These values preserve the current visual exactly on day one:

| Variable | Value | Current usages |
|---|---|---|
| `--font-ui` | `13px` | `#healthLabel`, `.cBarLabel`, `#realmLabel`, `#bossLabel`, `#activeElemLabel` |
| `--font-ui-sm` | `11px` | `#unlockHint`, `#carryHint`, `.abilitySlot .key` |
| `--font-ui-xs` | `10px` | `#controls` |
| `--font-popup-title` | `22px` | `#factTitle` |
| `--font-popup-label` | `18px` | `#quizKeeper`, `#shopTitle` |
| `--font-popup-body` | `14px` | `#factText`, `#shopText`, `#quizQuestion`, `#quizFeedback`, `#bossLoseQ`, `#bossLoseFeedback` |
| `--font-popup-note` | `12px` | `#quizProgress` |
| `--font-btn` | `16px` | `#factBtn` |
| `--font-btn-lg` | `22px` | `.bigBtn` |
| `--font-btn-sm` | `15px` | `.shopBtn` |
| `--font-sand-dollars` | `18px` | `#sandDollars` (distinct glow style justifies its own var) |
| `--font-status` | `22px` | `#statusMsg` |
| `--font-title` | `52px` | `#titleScreen h1` |
| `--font-title-p` | `13px` | `#titleScreen p` |
| `--font-win-title` | `42px` | `#winScreen h1`, `#loseScreen h1` |
| `--font-boss-lose-title` | `24px` | `#bossLoseTitle` |
| `--font-boss-lose-sub` | `16px` | `#bossLoseSubtitle` |
| `--font-emoji-xl` | `72px` | `#winEmoji` (the win screen emoji) |
| `--font-emoji-lg` | `64px` | `#loseEmoji` (the lose screen emoji) |
| `--font-emoji-md` | `52px` | `#shopNarwhal`, `#quizKeeperIcon`, `#bossLoseIcon` |
| `--font-emoji-sm` | `48px` | `#factNarwhal` |

## Canvas Font Tier Mapping
`CANVAS_FONT` object values, mapped from current `draw.js` usage:

| Key | Value | Used for |
|---|---|---|
| `xs` | `'9px serif'` | Enemy projectile emoji label |
| `sm` | `'11px Nunito,sans-serif'` | Companion orbit labels, portal cost hint |
| `sm_bold` | `'bold 11px Nunito,sans-serif'` | Various in-world game labels |
| `md` | `'12px Nunito,sans-serif'` | Portal name labels |
| `md_bold` | `'bold 13px Nunito,sans-serif'` | Hex grid labels, boss phase text |
| `lg_bold` | `'bold 14px Nunito,sans-serif'` | Floating damage/score particles |
| `emoji_sm` | `'18px serif'` | Obstacle emoji (bubble, rock, etc.) |
| `emoji_md` | `'22px serif'` | Portal emoji |
| `emoji_lg` | `'32px serif'` | Large portal emoji |

`CANVAS_FONT_BASE_ANIM = 32` -- base px size for the animated narwhal-intro text; full string: `` `bold ${CANVAS_FONT_BASE_ANIM + t*16|0}px Fredoka One,cursive` ``

## Out of Scope
- Changing font families or typefaces
- True responsive layout (the 800x600 logical canvas remains fixed)
- HiDPI / retina canvas density changes
- Changing game coordinate space -- game logic always operates in the 800x600 space
- Persisting the selected scale across page loads
- Moving non-font inline styles (position, margin, color, animation) to CSS -- only `font-size` and `font-family` attributes are migrated
- Inline `display:none` on `#bossLoseScreen`, `#winScreen`, `#loseScreen` -- these are toggled by JS and must remain inline
- Font sizes on JS-generated quiz option buttons (`#quizOptions`, `#bossLoseOptions` children) -- created dynamically and inherit correctly

## Tasks
- [ ] Task 1 -- Add semantic CSS vars to `:root` in `styles.css` using the default values from the table above; update every `font-size` rule in `styles.css` to use the appropriate var
- [ ] Task 2a -- Add IDs to bare elements that need CSS rules but currently have none: `id="quizKeeperIcon"` on the `<div style="font-size:52px">` at line 46; `id="bossLoseIcon"`, `id="bossLoseTitle"`, `id="bossLoseSubtitle"` on the first three child divs of `#bossLoseScreen` at lines 97-99; `id="winEmoji"` on the first child div of `#winScreen` at line 79; `id="loseEmoji"` on the first child div of `#loseScreen` at line 90
- [ ] Task 2b -- Add CSS rules to `styles.css` for all elements that have IDs (new and existing) but no CSS font rule: `#quizKeeperIcon`, `#quizKeeper`, `#quizQuestion`, `#quizFeedback`, `#quizProgress`, `#bossLoseIcon`, `#bossLoseTitle`, `#bossLoseSubtitle`, `#bossLoseQ`, `#bossLoseFeedback`, `#winEmoji`, `#winScreen p`, `#loseEmoji`, `#controlToggleBtn` (font-size and font-family only -- leave positional inline styles)
- [ ] Task 3 -- Remove `font-size` and `font-family` inline style attributes from all elements covered in Tasks 2a/2b; verify `display:none` and positional/color inline styles are left intact
- [ ] Task 4 -- Add `CANVAS_FONT` object and `CANVAS_FONT_BASE_ANIM` constant to `constants.js` using the tier mapping table above
- [ ] Task 5 -- Update all `ctx.font = '...'` assignments in `draw.js` to reference `CANVAS_FONT.*` constants; update the animated font line to use `CANVAS_FONT_BASE_ANIM`
- [ ] Task 6 -- Add `--game-scale: 1` to `:root` and `transform: scale(var(--game-scale)); transform-origin: center;` to `#gameWrapper` in `styles.css`
- [ ] Task 7 -- Add a `<div id="scaleBar">` with three `<button data-scale="...">` elements (1x, 1.25x, 1.5x) to `index.html` as a direct child of `<body>` (sibling of `#gameWrapper`); add `position:fixed; bottom:8px; right:8px;` CSS in `styles.css` styled to match the game aesthetic (dark background, Fredoka One font, border-radius, subtle border)
- [ ] Task 8 -- Add a click handler in `main.js` for `#scaleBar` buttons: reads `dataset.scale`, calls `document.documentElement.style.setProperty('--game-scale', value)`, toggles an `active` CSS class; add initialization code to mark the `1x` button active on page load
