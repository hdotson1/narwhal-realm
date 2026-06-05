# Plan: Playtest Polish Pass
**Date**: 2026-06-05

## Goal
Apply seven improvements from playtesting feedback: companion tip popups when entering dangerous realms, a healing hint for Breeze on rescue, homing boss projectiles with a tunable constant, a live black-hole demonstration from Luma in the void realm, 30% larger text across all systems, and a telegraphed warning on fact cards that narwhal knowledge matters in the final battle.

## Context

**Files touched:** `src/constants.js`, `src/state.js`, `src/update.js`, `src/obstacles.js`, `src/draw.js`, `src/styles.css`, `src/index.html`, `src/main.js`

**Realm tip logic** lives in `enterRealm` (`update.js:348–367`). The function already shows the `#unlockHint` toast; tip popups need to hook in here. `captiveNarwhals.find` at line 356 confirms which narwhal belongs to each realm.

**Fact popup** (`index.html:54–59`) is reused across three contexts: narwhal rescue (`freeNarwhal`, `update.js:369`), Luma meeting (`meetLuma`, `update.js:48`), and the "ready?" screen (`showReadyPrompt`, `update.js:383`). The factBtn onclick in `main.js:6–10` always sets `state='carrying'` — which is wrong for a realm tip (game should resume to `'playing'`). Fix with a new `factResumeState` variable.

**Boss projectile patterns** are in `updateBoss` (`update.js:614–651`). Pattern 1 (aimed shot) fires toward current player position at 280 px/s with no tracking after spawn. `updateProjectiles` (`update.js:273`) filters both `projectiles` and `enemyProjectiles` — homing logic goes in the `enemyProjectiles` filter.

**Luma void demo** — `updateVoidPhysics` (`obstacles.js:181`) already drives Luma's position each frame and has access to `obstacles`. `lumaState` is defined at `obstacles.js:174`. The cry-text system (`lumaState.cryText`, updated at line 230) can be borrowed to show "BLACK HOLE!" mid-demo.

**Text systems** — CSS vars in `styles.css:3–23`; canvas tiers in `constants.js:80–92`. Both must be scaled independently (the impl doc `002_text_sizing_and_scale.md` is authoritative). `CANVAS_FONT_BASE_ANIM = 32` at `constants.js:92` also needs scaling.

**Trivia telegraph** — `#factText` (`index.html:57`) is the body of every narwhal rescue card. A sibling `#factNote` div will hold the bold warning; `freeNarwhal` shows it, `meetLuma` / `showReadyPrompt` / `showRealmTip` hide it.

## Design Decisions

**Realm tips use the fact popup, not a toast.** Pausing the game makes the tip feel like a real moment. Using the same popup as narwhal rescue keeps implementation thin — no new DOM element needed, just a new dismiss behavior.

**`factResumeState` decouples factBtn from `'carrying'`.** Rather than overriding `factBtn.onclick` in every caller (fragile), a single variable (`let factResumeState='carrying'`) is checked in the one place (`main.js:factBtn.onclick`). `freeNarwhal` sets it to `'carrying'`; `showRealmTip` sets it to `'playing'`.

**Realm tips show only on first entry.** A `Set<string>` called `realmTipsShown` in state prevents re-triggering on revisit. Tip only fires if the relevant companion is already rescued (otherwise it would be a spoiler for a companion the player hasn't met). Fire → Squirt; Earth → Spark; Air → Root.

**Boss homing on pattern-1 shots only.** Spread fans and spiral bursts are geometric patterns — homing would break their design intent. Pattern 1 ("aimed at player") is the most natural candidate; tagging those with `homing: BOSS_HOMING_FACTOR` gives the feel of "these actually track you" without changing the others.

**Luma demo is a repeating in-world event.** Every 5–8 seconds while Luma hasn't been rescued, she emits a mini black-hole ring effect (expanding purple ring, dark singularity core) and temporarily pulls nearby void rifts toward her. A cry-text override shows "BLACK HOLE!!" during the effect so players read what's happening. No new particle type needed — the visual is drawn directly in `draw.js` from `lumaState.demoBhEffect`.

**Text scale: multiply by 1.3, round to nearest integer.** Emoji sizes stay as multiples of 2 for clean rendering. No layout changes expected — popup `max-width:420px` already has room; canvas labels may clip in edge cases but that's acceptable.

**Trivia telegraph: bold italic note at bottom of every rescue fact card.** `#factNote` sits between `#factText` and `#factBtn` in the HTML. Styled gold/italic to stand out. Hidden for meetLuma, showReadyPrompt, and realm tip contexts.

## Out of Scope

- Changing boss bullet patterns, speeds, or damage values (bullet hell stays as-is)
- Adjusting the void realm physics (obstacle bounce behavior unchanged)
- Adding new sound effects
- Layout/responsiveness changes from text scaling (accept any minor overflow)

## Tasks

- [x] **T1 — Add `BOSS_HOMING_FACTOR` to `constants.js`** — new constant `const BOSS_HOMING_FACTOR=0.08;` after the element colors block (~line 74). Range comment: 0 = no homing, 1 = instant lock-on.

- [x] **T2 — Wire homing into `updateProjectiles` (`update.js:285`)** — inside the `enemyProjectiles` filter, after position update: if `p.homing>0`, derive `speed=Math.hypot(p.vx,p.vy)`, compute angle to player, blend current velocity toward player direction by `p.homing * dt * 5`, then renormalize `vx/vy` back to original `speed` so homing bends the path without accelerating the projectile.

- [x] **T3 — Tag pattern-1 boss shots with homing (`update.js:626–631`)** — add `homing:BOSS_HOMING_FACTOR` to the `enemyProjectiles.push` calls inside the `pattern===1` block.

- [x] **T4 — Add `factResumeState` + `realmTipsShown` to `state.js`** — `let factResumeState='carrying';` and `let realmTipsShown=new Set();` after line 37.

- [x] **T5 — Update `factBtn.onclick` in `main.js:9`** — change `state='carrying'` to `state=factResumeState`. Note: this only applies to `freeNarwhal` and `showRealmTip` — `meetLuma` and `showReadyPrompt` hide `factBtn` and inject their own buttons with hardcoded transitions, so they are unaffected.

- [x] **T6 — Write `showRealmTip(realmId, emoji, title, msg)` in `update.js`** — sets `factResumeState='playing'`, restores `factBtn.style.display=''` (guards against it being hidden from a prior `meetLuma`/`showReadyPrompt` call), fills factPopup fields, hides `#factNote`, adds `realmTipsShown.add(realmId)`, sets `state='fact'`, calls `popup.classList.add('show')`.

- [x] **T7 — Call `showRealmTip` from `enterRealm` (`update.js:348`)** — insert the tip check at the **end** of `enterRealm`, after the `#unlockHint` toast block (line 366), to avoid conflicting with the existing hint display:
  - `id==='fire' && rescuedSet.has('water') && !realmTipsShown.has('fire')` → Squirt tip: *"Squirt here! 💧 Water is super effective against these fire enemies — I've got this!"*
  - `id==='earth' && rescuedSet.has('fire') && !realmTipsShown.has('earth')` → Spark tip: *"Spark here! 🔥 Fire tears right through earth creatures — leave it to me!"*
  - `id==='air' && rescuedSet.has('earth') && !realmTipsShown.has('air')` → Root tip: *"Root here! 🍃 Earth energy grounds these air enemies perfectly — I'll handle them!"*

- [x] **T8 — Add healing hint to Breeze rescue (`update.js:freeNarwhal`)** — after setting `factText`, special-case `cn.element==='air'`: append `\n\nAs your companion, Breeze will HEAL your whole team! Press [4] to activate her healing power.` to the displayed text.

- [x] **T9 — Add `#factNote` to `index.html`** — insert `<div id="factNote">📚 <strong>Remember this fact</strong> — narwhal knowledge could save your life in the final battle!</div>` between `#factText` and `#factBtn`.

- [x] **T10 — Style `#factNote` in `styles.css`** — `color:#ffcc44; font-style:italic; font-size:var(--font-popup-note); margin-bottom:14px;`

- [x] **T11 — Show/hide `#factNote` in callers** — `freeNarwhal`: show it. `meetLuma`, `showReadyPrompt`, `showRealmTip`: hide it.

- [x] **T12 — Add `lumaState.demoBhEffect` + `demoTimer` to `obstacles.js:174`** — extend the `lumaState` object with `demoTimer:4, demoBhEffect:null`. The `demoBhEffect` object shape when active: `{x, y, life, maxLife}` where `x/y` are Luma's position at trigger time, `life` counts down from `maxLife=2.2`.

- [x] **T13 — Fire Luma demo in `updateVoidPhysics` (`obstacles.js:229`)** — tick `demoTimer`; when it hits zero and no current effect: spawn `demoBhEffect={x:lumaState.x, y:lumaState.y, life:2.2, maxLife:2.2}`, pull nearby rifts (within 180px) toward Luma by adding `±40` to their `vx/vy` in the direction of Luma, override `cryText` to `'BLACK HOLE!!'`, reset timer to `5+Math.random()*3`. Also tick `demoBhEffect.life-=dt` each frame and null it when `life<=0`.

- [x] **T14 — Draw Luma demo in `draw.js` (void captive narwhal block ~line 241)** — if `lumaState.demoBhEffect` is set: compute `t=1-bh.life/bh.maxLife`, draw expanding purple ring at `r=10+t*80` and dark singularity core at `r*0.35`, both fading with `alpha=bh.life/bh.maxLife`. Use same `shadowColor:'#aa00ff'` style as the boss black-hole visual.

- [x] **T15 — Scale CSS font vars ×1.3 in `styles.css:3–23`** — update all `--font-*` vars. Emoji sizes round to nearest even number:
  | var | old | new |
  |---|---|---|
  | --font-ui | 17px | 22px |
  | --font-ui-sm | 15px | 20px |
  | --font-ui-xs | 13px | 17px |
  | --font-popup-title | 22px | 29px |
  | --font-popup-label | 18px | 23px |
  | --font-popup-body | 14px | 18px |
  | --font-popup-note | 12px | 16px |
  | --font-btn | 16px | 21px |
  | --font-btn-lg | 22px | 29px |
  | --font-btn-sm | 15px | 20px |
  | --font-sand-dollars | 18px | 23px |
  | --font-status | 22px | 29px |
  | --font-title-p | 13px | 17px |
  | --font-win-title | 42px | 55px |
  | --font-boss-lose-title | 24px | 31px |
  | --font-boss-lose-sub | 16px | 21px |
  | --font-emoji-xl | 72px | 94px |
  | --font-emoji-lg | 64px | 84px |
  | --font-emoji-md | 52px | 68px |
  | --font-emoji-sm | 48px | 62px |

- [x] **T16 — Scale `CANVAS_FONT` ×1.3 in `constants.js:80–92`** — each value is a string like `'bold 20px Nunito,sans-serif'`; extract the px number, multiply by 1.3, round to nearest integer, and reconstruct the string. Update all tier values and `CANVAS_FONT_BASE_ANIM` (a bare number):
  | key | old | new |
  |---|---|---|
  | xs | 15px | 20px |
  | sm | 17px | 22px |
  | sm_bold | 18px | 23px |
  | md | 20px | 26px |
  | md_bold | 20px | 26px |
  | lg_bold | 23px | 30px |
  | emoji_sm | 21px | 27px |
  | emoji_md | 25px | 33px |
  | emoji_lg | 35px | 46px |
  | CANVAS_FONT_BASE_ANIM | 32 | 42 |
