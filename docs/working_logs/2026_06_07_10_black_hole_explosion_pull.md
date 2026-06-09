# Working Log — 2026-06-07

**Session goal**: Make the void projectile's black hole detonation actively pull and damage nearby enemies for its 3.5-second duration.

---

## Changes

### Black hole pull and tick damage
**Why**: The `blackHoleEffect` was purely cosmetic — enemies passed through it with no consequence.
**What**: Added `updateBlackHoleEffect(dt)` in `update.js` that reads the effect's `life/maxLife` to compute a growing pull radius matching the visual ring (`pullR = 20 + t*260`), pulls all enemies in range with scaled force, deals 20 HP/s tick damage, and kills enemies that drop to zero with coin drops and burst particles — consistent with normal kill handling. Wired into both the boss and normal update paths.
**Files**: src/update.js

---

## Notes
- `life` is only read (not decremented) in `updateBlackHoleEffect` — `draw.js` owns that decrement. Touching it here would halve the effect duration.
- Boss path call is ordered after `checkProjHitEnemies()` and before `updateBossMinion` so dead enemies are removed before their positions update that frame.
- Boss minions (in `enemies[]`) are affected; the boss object itself is not.
- Coin drops are gated on `state !== 'boss'` to match existing drop behavior.
