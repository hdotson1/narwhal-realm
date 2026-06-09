# 002 — Text Sizing and Game Scale

## Overview

All text in the game goes through one of two systems depending on where it renders:

- **DOM text** (HTML UI, popups) — sized via CSS custom properties defined in `:root` of `styles.css`
- **Canvas text** — sized via the `CANVAS_FONT` object in `constants.js`

A third mechanism, `--game-scale`, visually scales the entire game without touching either system.

---

## CSS Custom Properties (`styles.css`)

All `font-size` values for DOM elements are defined as named variables in `:root`. No element in `styles.css` or `index.html` should use a hardcoded `font-size` px value — always reference a var.

### Variable reference

| Variable | Default | Category |
|---|---|---|
| `--font-ui` | `13px` | HUD labels (`#healthLabel`, `.cBarLabel`, `#realmLabel`, `#bossLabel`, `#activeElemLabel`) |
| `--font-ui-sm` | `11px` | Small HUD hints (`.abilitySlot .key`, `#carryHint`) |
| `--font-ui-xs` | `10px` | Controls overlay (`#controls`) |
| `--font-popup-title` | `22px` | Fact popup title (`#factTitle`) |
| `--font-popup-label` | `18px` | Popup keeper/shop titles (`#quizKeeper`, `#shopTitle`) |
| `--font-popup-body` | `14px` | Popup body text and feedback (`#factText`, `#shopText`, `#quizQuestion`, `#quizFeedback`, `#bossLoseQ`, `#bossLoseFeedback`) |
| `--font-popup-note` | `12px` | Small supplemental popup text (`#quizProgress`, `#unlockHint`) |
| `--font-btn` | `16px` | Primary action button (`#factBtn`) |
| `--font-btn-lg` | `22px` | Big screen buttons (`.bigBtn`) |
| `--font-btn-sm` | `15px` | Shop buttons (`.shopBtn`) |
| `--font-sand-dollars` | `18px` | Sand dollar counter (`#sandDollars`) |
| `--font-status` | `22px` | Mid-screen status message (`#statusMsg`) |
| `--font-title` | `52px` | Title screen h1 |
| `--font-title-p` | `13px` | Title screen body text; also `#winScreen p` |
| `--font-win-title` | `42px` | Win/lose screen h1 |
| `--font-boss-lose-title` | `24px` | Boss lose screen title (`#bossLoseTitle`) |
| `--font-boss-lose-sub` | `16px` | Boss lose screen subtitle (`#bossLoseSubtitle`) |
| `--font-emoji-xl` | `72px` | Win screen emoji (`#winEmoji`) |
| `--font-emoji-lg` | `64px` | Lose screen emoji (`#loseEmoji`) |
| `--font-emoji-md` | `52px` | Popup keeper icons (`#shopNarwhal`, `#quizKeeperIcon`, `#bossLoseIcon`) |
| `--font-emoji-sm` | `48px` | Fact popup narwhal icon (`#factNarwhal`) |

### Adding new text

For any new DOM text element: pick the closest semantic category above, or define a new var in `:root` if none fits. Do not hardcode px values.

---

## Canvas Font Tiers (`constants.js`)

`draw.js` has no access to CSS vars. All `ctx.font` assignments must reference the `CANVAS_FONT` object defined in `constants.js`.

### Tier reference

| Key | Value | Used for |
|---|---|---|
| `xs` | `'20px sans-serif'` | Enemy projectile icon, void portal requirement text |
| `sm` | `'22px Nunito,sans-serif'` | Shopkeeper hint, portal name label, normal portal name |
| `sm_bold` | `'bold 23px Nunito,sans-serif'` | Rescue hints above caged narwhals, in-world directional labels |
| `md` | `'26px Nunito,sans-serif'` | Portal name when locked (void portal) |
| `md_bold` | `'bold 26px Nunito,sans-serif'` | Hub hex-grid label, Luma cry bubble, entangle status, boss phase text |
| `lg_bold` | `'bold 30px Nunito,sans-serif'` | Floating damage/score particles |
| `emoji_sm` | `'27px serif'` | Coin pickup emoji |
| `emoji_md` | `'33px serif'` | Normal portal emoji |
| `emoji_lg` | `'46px serif'` | Void portal emoji |

`CANVAS_FONT_BASE_ANIM = 42` is the base pixel size for the animated black-hole intro text. The full font string is assembled as `` `bold ${42 + t*16|0}px Fredoka One,cursive` ``.

### Adding new canvas text

Use the closest tier above. If none fits, add a new key to `CANVAS_FONT` with a descriptive name and document it here.

---

## Canvas Backing Buffer (`CANVAS_SCALE`)

A second scaling layer beneath `--game-scale` makes the canvas buffer larger than its CSS-displayed size so sprites render crisply on high-DPI screens and at higher scale-bar settings.

`CANVAS_SCALE` (defined in `constants.js`) is `Math.max(Math.ceil(devicePixelRatio), 2)` — minimum 2 on any display. At startup (`state.js`, before the game loop), the canvas buffer is set to `W × CANVAS_SCALE` by `H × CANVAS_SCALE`, the CSS element size is pinned back to `800px × 600px`, and `ctx.scale(CANVAS_SCALE, CANVAS_SCALE)` is called once.

All drawing code continues to use 800×600 logical coordinates; `ctx.scale` silently multiplies them into the larger buffer. Canvas font sizes and shadow blur values are in logical pixels and are unaffected — they scale naturally into more physical pixels, resulting in crisper text and glows.

**Initialization order matters**: `canvas.width`/`canvas.height` must be set before `ctx.scale`, because resizing the buffer resets all 2D context state including any prior transform.

---

## Game Scale (`--game-scale`)

`#gameWrapper` applies `transform: scale(var(--game-scale))` with `transform-origin: center`. The CSS var defaults to `1` in `:root`.

The `#scaleBar` control (`position:fixed`, outside `#gameWrapper`) exposes three presets: **1×**, **1.25×**, **1.5×**. Clicking a button calls `document.documentElement.style.setProperty('--game-scale', value)`. All game logic uses 800×600 logical coordinates; the browser handles the CSS-level visual scaling on top of the backing buffer scale.

Scale is not persisted across page loads.
