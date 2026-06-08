# Plan: Black Hole Explosion Pull and Damage
**Date**: 2026-06-07

## Goal
When the void projectile's black hole detonates, the `blackHoleEffect` visual (currently purely cosmetic) should actively pull all nearby enemies toward its center and deal continuous damage to anything inside its radius. The effect lasts for its existing 3.5-second duration. Enemies that reach the center or accumulate enough damage die, with the same drop/burst effects as normal kills.

## Context
- `blackHoleEffect` declared in `state.js:69` as `{x, y, life, maxLife, pct, dtRef}` — no gameplay behavior attached
- Visual renders in `draw.js:354–385`: expanding rings where the pull radius (`r = 20 + t*260`) grows from 20px to 280px over 3.5s, where `t = 1 - life/maxLife`
- The traveling void projectile already pulls enemies with `pullRadius=200` and force=400 while in flight (`update.js:278–283`); this plan extends similar logic to the detonation effect
- Two update paths both need the new call:
  - **Boss path**: `update.js:776–795` — boss minions live in `enemies[]`, handled by `checkProjHitEnemies()` at line 792
  - **Normal path**: `update.js:815–874` — standard enemies in `enemies[]`, `checkProjHitEnemies()` at line 874
- Enemy structure: `{x, y, r:18, hp, maxHp, element, dmgFlash}` — matches what we need

## Design Decisions
- **Pull radius matches visual event horizon ring**: `pullR = 20 + t*260`. The effect starts small then expands to cover most of the arena, naturally pulling in more enemies over time.
- **Pull force**: `300 * (1 - d/pullR)` (mirrors the traveling projectile's formula; slightly weaker than in-flight pull since the effect is stationary and lasts longer).
- **Continuous tick damage**: `20 * dt` per frame while inside the radius — an enemy with 35 HP dies in ~1.75s inside the effect. Lethal without being instantaneous. Sets `e.dmgFlash = 0.15` so enemies flash red (consistent with all other damage sources).
- **`life` is read-only in `updateBlackHoleEffect`**: `draw.js:355` already decrements `blackHoleEffect.life` each render frame. The new function must read `life/maxLife` to compute `t` and `pullR` but must never decrement `life` itself — doing so would double-tick and halve the effect duration.
- **Death handling in `updateBlackHoleEffect`**: enemies killed by tick damage get coin spawn (75% chance, non-boss only) and burst particle effects, then are filtered from `enemies[]`. This keeps the logic self-contained and consistent with normal kill handling.
- **Boss-path call order**: `updateBlackHoleEffect(dt)` goes **before** `updateBossMinion` so dead enemies are removed before their positions are updated that same frame.
- **Boss itself not affected**: `boss` object is not in `enemies[]` and already takes 10–30% HP on hit. Only boss minions (which are in `enemies[]`) get pulled and damaged.
- **Paused states**: when `state` is `'fact'` or `'shop'`, `update()` is skipped so the pull/damage also pauses — but `draw.js` keeps ticking `life`. This is intentional: popups pause gameplay, the effect just visually expires faster. Acceptable tradeoff.

## Out of Scope
- Pulling or damaging the player
- Affecting obstacles or the void realm's dynamic rifts
- Visual changes to the black hole effect rings
- Changing the in-flight projectile pull behavior

## Tasks
- [ ] Add `updateBlackHoleEffect(dt)` function in `update.js` after `updateProjectiles` (~line 304): compute `t = 1 - life/maxLife` and `pullR = 20 + t*260` (read-only — do NOT decrement `life`); pull all enemies in range with force `300*(1-d/pullR)`; deal `20*dt` tick damage with `e.dmgFlash=0.15`; filter dead enemies with coin/burst death effects
- [ ] Call `updateBlackHoleEffect(dt)` in the boss path (`update.js:792`), **after** `checkProjHitEnemies()` and **before** `enemies.forEach(e=>updateBossMinion(e,dt))`
- [ ] Call `updateBlackHoleEffect(dt)` in the normal path, on a new line after the chained update calls at `update.js:874` (the chain ends with `checkProjHitEnemies()`)
