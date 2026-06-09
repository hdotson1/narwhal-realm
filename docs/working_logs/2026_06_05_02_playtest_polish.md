# Working Log — 2026-06-05

**Session goal**: Apply seven playtest polish improvements — companion realm tips, Breeze healing hint, homing boss projectiles, Luma void black-hole demo, 30% text scale-up, and a trivia telegraph on rescue fact cards.

---

## Changes

### Homing boss projectiles
**Why**: Playtesting showed pattern-1 aimed shots felt too easy to sidestep once fired.
**What**: Added `BOSS_HOMING_FACTOR=0.08` constant and a velocity-blending homing pass in `updateProjectiles` that bends each tagged projectile toward the player each frame without changing its speed. Only pattern-1 (aimed) shots are tagged; spread fans and spiral bursts are left unchanged.
**Files**: `src/constants.js`, `src/update.js`

### Companion realm tips via fact popup
**Why**: Playtests showed players didn't know which companion to use in each realm.
**What**: Added `showRealmTip` function that reuses the existing fact popup to show a companion tip on first entry to fire, earth, and air realms (only if the relevant companion is already rescued). Introduced `factResumeState` variable so the popup's dismiss button returns to `'playing'` for tips and `'carrying'` for rescue — decoupling the two flows without changing the popup DOM. A `realmTipsShown` Set prevents re-triggering on revisit. A 400ms setTimeout delays the tip until the unlock hint toast has settled, with a `state==='playing'` guard to silently no-op if the game state changed before the timer fires.
**Files**: `src/state.js`, `src/main.js`, `src/update.js`

### Breeze healing hint on rescue
**Why**: Players frequently forgot Breeze heals rather than attacks, leading to confusion in combat.
**What**: When `freeNarwhal` displays the air narwhal's fact card, it appends a reminder that Breeze heals the whole team and that [4] activates her power.
**Files**: `src/update.js`

### Trivia telegraph on rescue fact cards
**Why**: Players arrived at the final boss quiz with no memory of the narwhal facts they'd seen.
**What**: Added `#factNote` div (gold italic text) to the fact popup, shown only during narwhal rescues and hidden for meetLuma, showReadyPrompt, and realm tips. Styled via `--font-popup-note` CSS var.
**Files**: `src/index.html`, `src/styles.css`, `src/update.js`

### Luma black-hole demo in void realm
**Why**: Players entering the void realm didn't understand what Luma's power was before rescuing her.
**What**: Every 5–8 seconds while Luma is unrescued, she emits a mini black-hole effect — an expanding purple ring with a dark singularity core drawn at her position, fading over 2.2 seconds — and pulls nearby void rifts toward her. Her cry text overrides to "BLACK HOLE!!" during the effect so players can read what's happening.
**Files**: `src/obstacles.js`, `src/draw.js`

### 30% text scale-up across all systems
**Why**: Playtest feedback consistently cited text as too small to read comfortably.
**What**: All CSS font vars (`--font-*`) scaled ×1.3, rounded to nearest integer (emoji sizes to nearest even). All `CANVAS_FONT` tier strings and `CANVAS_FONT_BASE_ANIM` scaled the same way.
**Files**: `src/styles.css`, `src/constants.js`

---

## Notes
- The `factResumeState` pattern is deliberately minimal — it lives in state.js and is read in a single place (factBtn.onclick). meetLuma and showReadyPrompt are unaffected because they hide factBtn and inject their own transition buttons.
- Text overflow from the 30% scale-up in edge cases is accepted per plan scope.
