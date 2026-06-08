# Plan: Heal and Black Hole as Instant-Cast Abilities
**Date**: 2026-06-07

## Goal
Change keys 4 (Breeze/heal) and 5 (Luma/black hole) so they trigger their abilities immediately without switching `selectedElement`. The player's active firing element (1–3) is never displaced. This addresses the UX friction of having to re-select a combat element after using a utility ability. Key 5 (black hole) will also be restricted to boss-fight state only; it does nothing in normal realms.

## Context
All input handling lives in `src/input.js`. The keydown listener (lines 2–60) handles number keys 1–5. `setSelected(id)` lives in `src/update.js` (lines 38–47); it sets the global `selectedElement` and toggles the `.active` CSS class on HUD slots. The auto-fire path in `update.js:269–272` skips air when it's selected, but relies on `selectedElement` being a combat element for continuous firing. The click handler in `input.js:67–106` has dead branches for air and void that will become unreachable after this change. Slot styles are in `src/styles.css` lines 42–49; the `.active` class adds a white border + glow.

Current issues in `input.js`:
- Air branch (line 28): calls `setSelected('air')` before healing
- Void branch (line 30): calls `setSelected('void')` before the cooldown check
- `meetLuma` in `update.js:103`: calls `setSelected('void')` if nothing is selected

## Design Decisions
- **Instant-cast, no selection change**: Keys 4 and 5 call their ability logic directly without calling `setSelected`. `selectedElement` is untouched.
- **Slot pulse animation**: A brief CSS keyframe animation (`.activating` class) flashes the slot's border/glow to confirm activation. The class is added via JS and auto-removes after the animation completes using `animationend`. This is visually distinct from the white `.active` ring so players understand it's a one-shot, not a mode switch.
- **Void restricted to boss only**: In normal realms pressing 5 returns early with a brief `showStatus('🌑 Reach the boss first!', 1.2)` hint. The void projectile `else` path (current `input.js` line 50 — `shootPlayer` in non-boss realms) is removed entirely. Cooldown is only set in boss state. The shared `effectiveCooldown` block at lines 12–15 is not moved; it computes before the branch and is still correct.
- **Heal status message**: Add a `showStatus('💨 Healed!', 1.5)` call alongside the existing particle burst, giving parity with the black hole's feedback.
- **Click handler collapse**: The `if (n.element==='air')` and `else if (n.id==='void' && state==='boss')` branches are dead code after this change (void and air are never `selectedElement`). Remove both branches so the handler collapses to the null-guard + a single unconditional `shootPlayer` call.
- **`activeElemLabel` intentionally unchanged**: `setSelected` still updates this label for elements 1–3. Since air and void are never passed to `setSelected` after this change, the label will never display "Breeze — healing mode". The pulse animation and status messages are the feedback path for 4 and 5.
- **`meetLuma` auto-select removed**: The `if(!selectedElement)setSelected('void')` call at `update.js:103` is removed. Void is never a selectable element; if `selectedElement` is null at that point the player simply presses 1–3 to select a combat element.
- **Controls text updated**: The bottom hint currently says "1-5 select active element". Update to "1–3 select element • 4 heal • 5 black hole (boss)".

**Alternatives ruled out**: Keeping void selectable as a "mode" for normal-realm projectile firing — ruled out per user request; the ability is meant as a special, not a sustained mode.

## Out of Scope
- Changing heal amount or black hole damage percentages
- Adding gamepad/mobile controls for the new abilities
- Rebalancing cooldowns
- Any changes to how elements 1–3 behave

## Tasks
- [ ] **`src/styles.css`**: Add `@keyframes slotPulse` and `.abilitySlot.activating` CSS rule (violet/gold glow for 0.4 s) — after the `.abilitySlot.active` rule (line 44)
- [ ] **`src/input.js` air branch (lines 17–28)**: Remove `setSelected('air')` call; add slot4 `.activating` class + `showStatus('💨 Healed!', 1.5)`
- [ ] **`src/input.js` void branch (lines 29–52)**: Remove `setSelected('void')` call; add early `return` (with `showStatus('🌑 Reach the boss first!', 1.2)`) if `state !== 'boss'`; remove the non-boss `else` path (`shootPlayer` at current line 50); add slot5 `.activating` class on successful boss activation only
- [ ] **`src/input.js` click handler (lines 77–105)**: Remove the air `if` branch and the void/boss `else if` branch entirely; collapse handler to null-guard + single unconditional `shootPlayer(player.x,player.y,cx,cy,n,true)` call
- [ ] **`src/update.js` `meetLuma` (line 103)**: Remove `if(!selectedElement)setSelected('void')`
- [ ] **`src/index.html` controls text (line 40)**: Update hint to "1–3 select element • 4 heal • 5 black hole (boss)"
