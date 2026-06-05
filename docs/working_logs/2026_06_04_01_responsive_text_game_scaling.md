# Working Log — 2026-06-04

**Session goal**: Introduce semantic CSS custom properties for all text sizes and a runtime scale toggle so font sizes and overall game zoom can be adjusted without touching individual rules or drawing code.

---

## Changes

### CSS custom properties for text sizing
**Why**: All font sizes were hardcoded as px values scattered across `styles.css` and inline `style=""` attributes, making it impossible to adjust a category of text in one place.
**What**: Added a `:root` block in `styles.css` with 20 named variables covering every text category (UI labels, popups, buttons, emojis, title screen, etc.). All `font-size` rules in `styles.css` now reference these vars.
**Files**: `src/styles.css`

### Inline font styles migrated to CSS
**Why**: Several popup elements had `font-size` and `font-family` baked into inline `style=""` attributes and lacked IDs, making them unreachable by CSS rules.
**What**: Added IDs (`quizKeeperIcon`, `bossLoseIcon`, `bossLoseTitle`, `bossLoseSubtitle`, `winEmoji`, `loseEmoji`) to previously anonymous divs. Added CSS rules for all newly and previously ID'd elements that lacked font rules. Removed `font-size` and `font-family` from the inline styles; all other inline attributes (position, color, display) were left intact.
**Files**: `src/index.html`, `src/styles.css`

### Canvas font tier constants
**Why**: `draw.js` had ~12 hardcoded `ctx.font` strings duplicated throughout, with no central place to change them.
**What**: Added a `CANVAS_FONT` object to `constants.js` with 9 named tiers covering every usage in `draw.js`, plus `CANVAS_FONT_BASE_ANIM` for the animated intro text. Updated all `ctx.font` assignments in `draw.js` to reference these constants.
**Files**: `src/constants.js`, `src/draw.js`

### Runtime game scale toggle
**Why**: Needed a one-knob way to zoom the entire 800×600 game for larger screens without touching drawing coordinates.
**What**: Added `--game-scale: 1` CSS var and `transform: scale(var(--game-scale))` to `#gameWrapper`, so the browser handles all visual scaling. Added a `#scaleBar` control (`position:fixed`, outside the game transform) with 1×, 1.25×, and 1.5× preset buttons. Added a click handler in `main.js` that sets the CSS var and toggles the active button class.
**Files**: `src/styles.css`, `src/index.html`, `src/main.js`

---

## Notes

- `#realmLabel` was mapped to `--font-ui` (13px); original was 15px. If that distinction matters, a separate `--font-realm-label` var can be added.
- Canvas labels originally at `bold 12px` (caged narwhal text) were mapped to `sm_bold` (`bold 11px`) — closest defined tier. A new tier can be added if the 1px difference is noticeable.
- Scale is not persisted across page loads (out of scope per plan).
