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
| `xs` | `'9px serif'` | Enemy projectile icon, void portal requirement text |
| `sm` | `'11px Nunito,sans-serif'` | Shopkeeper hint, portal name label, normal portal name |
| `sm_bold` | `'bold 11px Nunito,sans-serif'` | Rescue hints above caged narwhals, in-world directional labels |
| `md` | `'12px Nunito,sans-serif'` | Portal name when locked (void portal) |
| `md_bold` | `'bold 13px Nunito,sans-serif'` | Hub hex-grid label, Luma cry bubble, entangle status, boss phase text |
| `lg_bold` | `'bold 14px Nunito,sans-serif'` | Floating damage/score particles |
| `emoji_sm` | `'18px serif'` | Coin pickup emoji |
| `emoji_md` | `'22px serif'` | Normal portal emoji |
| `emoji_lg` | `'32px serif'` | Void portal emoji |

`CANVAS_FONT_BASE_ANIM = 32` is the base pixel size for the animated black-hole intro text. The full font string is assembled as `` `bold ${CANVAS_FONT_BASE_ANIM + t*16|0}px Fredoka One,cursive` ``.

### Adding new canvas text

Use the closest tier above. If none fits, add a new key to `CANVAS_FONT` with a descriptive name and document it here.

---

## Game Scale (`--game-scale`)

`#gameWrapper` applies `transform: scale(var(--game-scale))` with `transform-origin: center`. The CSS var defaults to `1` in `:root`.

The `#scaleBar` control (`position:fixed`, outside `#gameWrapper`) exposes three presets: **1×**, **1.25×**, **1.5×**. Clicking a button calls `document.documentElement.style.setProperty('--game-scale', value)`. The canvas stays at 800×600 logical pixels; the browser handles all visual scaling. No drawing coordinates or game-world positions change.

Scale is not persisted across page loads.
