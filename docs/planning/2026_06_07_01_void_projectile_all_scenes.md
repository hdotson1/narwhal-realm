# Plan: Void Black Hole Fires as Projectile in All Scenes
**Date**: 2026-06-07

## Goal
Correct the void ability (key 5 / Luma) so it fires a void projectile toward the cursor in any active game state (`playing`, `carrying`, `boss`) instead of being restricted to boss-only and dealing instant % damage. When the projectile hits a target or reaches the cursor position, it spawns the black hole visual effect. In boss fights the hit also applies 10–30% of boss max HP as bonus damage and shows the "% HP" text; in all other contexts the visual is text-free. Update implementation docs to match the new behavior.

## Context

**Current code state** (post plan `_00_` execution):

`input.js:30–50` — void branch: guards with `if(state!=='boss')` → returns early with "Reach the boss first!"; inside boss block, applies instant 10–30% HP damage directly to `boss.hp` and sets `blackHoleEffect` at `boss.x/y`. The `.activating` CSS pulse and cooldown check are already correct.

`draw.js:343` — the entire `blackHoleEffect` render block (lines 347–379) is wrapped inside `if(state==='boss'){…}`. A black hole spawned in a non-boss state would tick down via the `||0.016` fallback (draw.js:349) but never render.

`update.js:777` — `if(blackHoleEffect)blackHoleEffect.dtRef=dt;` is inside the boss early-return block only. Non-boss states never populate `dtRef`.

`src/index.html:40` — controls hint still reads `"1-5 select active element"` (update from original plan was never applied).

`CLAUDE.md:39` — describes Luma as "fires a black-hole projectile or instant boss damage during the boss fight."

`docs/implementation/001:92` — Luma Special column: "Black-hole projectile; instant phase damage in boss fight."

`docs/implementation/001:127` — `blackHoleEffect` described as "created when Luma fires her void ability during the boss fight; it pulls all enemy projectiles toward a point and deals instant phase damage."

`shootPlayer` (`update.js:148–154`) already produces void special projectiles with `r:20` and `pullRadius:200`. Tagging `projectiles[projectiles.length-1]` after the call is safe — `shootPlayer` only pushes to the array.

## Design Decisions

- **Remove boss restriction**: Delete the `if(state!=='boss')` guard and the entire direct-damage block from the void branch. Call `shootPlayer(player.x,player.y,mouseX,mouseY,n,true)` then tag the new projectile with `isVoidSpecial:true`, `targetX:mouseX`, `targetY:mouseY`. Cooldown, `.activating` animation, and `showStatus` call stay in place.

- **Arrival detection**: In `updateProjectiles`, after position update and pull-radius logic, check: `p.isVoidSpecial && Math.hypot(p.x-p.targetX, p.y-p.targetY) < 35`. The 35 px threshold accounts for 350 px/s travel speed at 60fps (~5–6 px/frame overshoot margin). On arrival: spawn `blackHoleEffect={x:p.targetX, y:p.targetY, life:3.5, maxLife:3.5}` (no `pct`), call `spawnBurst(p.targetX, p.targetY, '#8800ff', 20)`, set `p.life=0` to remove the projectile.

- **Enemy hit → black hole effect**: In `checkProjHitEnemies`, inside the existing hit block (after applying damage), add: `if(proj.isVoidSpecial) blackHoleEffect={x:proj.x,y:proj.y,life:3.5,maxLife:3.5};` (no `pct`). Normal projectile damage + removal logic are unchanged.

- **Boss hit → black hole + % bonus damage**: In the `updateBoss` projectile filter (lines 710–723), the existing hit block is: `boss.hp-=proj.dmg; boss.dmgFlash=0.12; spawnBurst(…); document.getElementById('bossFill')…; if(boss.hp<=0){…win…}`. Insert the `isVoidSpecial` block between `boss.hp-=proj.dmg` and `boss.dmgFlash=0.12`: `if(proj.isVoidSpecial){const pct=0.10+Math.random()*0.20; boss.hp=Math.max(0,boss.hp-Math.round(boss.maxHp*pct)); blackHoleEffect={x:proj.x,y:proj.y,life:3.5,maxLife:3.5,pct:Math.round(pct*100)};}`. Do NOT duplicate `boss.dmgFlash`, the DOM update, or the win-check — all three already run on the lines immediately following the insertion point and remain correct after the extra damage is applied.

- **Text conditional in draw.js**: Change `if(t<0.7)` at draw.js:368 to `if(blackHoleEffect.pct && t<0.7)` so the "% HP" text only appears in boss contexts.

- **Move blackHoleEffect render block out of boss guard**: Cut the `if(blackHoleEffect){…}` block from inside `if(state==='boss'){…}` and place it immediately after that block closes (before the `enemies.forEach` that draws enemy HP bars). This lets the visual render in `playing` and `carrying` states.

- **`dtRef` fix for non-boss states**: Add `if(blackHoleEffect)blackHoleEffect.dtRef=dt;` in the non-boss update path, alongside the existing `updateProjectiles(dt)` call near `update.js:865`.

- **Controls text**: Update `index.html:40` from `"1-5 select active element"` to `"1–3 select element • 4 heal • 5 black hole"`.

- **Doc updates**: Two lines in `001_game_systems_overview.md` and one line in `CLAUDE.md` describe the old boss-only instant-damage behavior; all three are updated to reflect projectile-based, any-scene firing.

- **Clear `blackHoleEffect` on realm transitions**: `startBoss()` already sets `blackHoleEffect=null`. `enterRealm()` does not — a void shot fired in `playing`/`carrying` state then immediately entering a portal would let the visual persist into the next realm. Add `blackHoleEffect=null` to `enterRealm` alongside the existing `projectiles=[]` reset.

**Not changed**: Cooldown values (boss-mode void stays 5000 ms, normal stays 10000 ms). `freeNarwhal` auto-select for elements 1–3 (intentionally unchanged; void bypasses `freeNarwhal` entirely via `meetLuma`). Void projectile pull radius during flight (already 200 px for special shots). Void companion auto-fire in boss mode fires normal (non-special) void projectiles with no `isVoidSpecial` flag — correct and unchanged.

## Out of Scope
- Rebalancing black hole damage or cooldowns
- Adding AOE damage on arrival (enemies not at exact cursor position are unaffected at landing; they are still pulled during flight via `pullRadius`)
- Gamepad/mobile controls
- Any changes to elements 1–3

## Tasks
- [ ] **`src/input.js` void branch (lines 30–50)**: Remove `if(state!=='boss')` guard and return; remove direct boss HP damage block; call `shootPlayer(player.x,player.y,mouseX,mouseY,n,true)` then tag `projectiles[projectiles.length-1]` with `isVoidSpecial:true, targetX:mouseX, targetY:mouseY`; keep the existing slot5 `s5.classList.add('activating')` + `animationend` listener; add `showStatus('🌑 Black Hole!',1.5)` after the activating call
- [ ] **`src/update.js` updateProjectiles (lines 275–299)**: After the pull-radius `forEach`, add arrival detection: `if(p.isVoidSpecial&&Math.hypot(p.x-p.targetX,p.y-p.targetY)<35){blackHoleEffect={x:p.targetX,y:p.targetY,life:3.5,maxLife:3.5};spawnBurst(p.targetX,p.targetY,'#8800ff',20);p.life=0;}`
- [ ] **`src/update.js` checkProjHitEnemies (lines 309–329)**: Inside the hit block, before `hit=true`, add: `if(proj.isVoidSpecial)blackHoleEffect={x:proj.x,y:proj.y,life:3.5,maxLife:3.5};`
- [ ] **`src/update.js` updateBoss projectile filter (lines 710–723)**: Insert between the existing `boss.hp-=proj.dmg` line and `boss.dmgFlash=0.12` line: `if(proj.isVoidSpecial){const pct=0.10+Math.random()*0.20;boss.hp=Math.max(0,boss.hp-Math.round(boss.maxHp*pct));blackHoleEffect={x:proj.x,y:proj.y,life:3.5,maxLife:3.5,pct:Math.round(pct*100)};}` — do NOT add another `boss.dmgFlash`, DOM update, or win-check; the existing lines immediately after handle all three correctly with the combined damage already applied
- [ ] **`src/update.js` non-boss update path (near line 865)**: Add `if(blackHoleEffect)blackHoleEffect.dtRef=dt;` alongside the `updateProjectiles(dt)` call in the non-boss branch
- [ ] **`src/update.js` `enterRealm` function**: Add `blackHoleEffect=null;` alongside the existing `projectiles=[];` reset to prevent the visual persisting across portal transitions
- [ ] **`src/draw.js` blackHoleEffect render block (lines 347–379)**: Move the entire `if(blackHoleEffect){…}` block out of the `if(state==='boss')` guard and place it after that guard's closing brace; change `if(t<0.7)` to `if(blackHoleEffect.pct&&t<0.7)` so "% HP" text only shows on boss hits
- [ ] **`src/index.html` line 40**: Update the controls `div` to `"1–3 select element • 4 heal • 5 black hole"` and remove the now-redundant third line `"4 = air heals everyone"` so the hint reads two lines instead of three
- [ ] **`CLAUDE.md` narwhal companions paragraph**: Replace "Void (Luma) fires a black-hole projectile or instant boss damage during the boss fight." with "Void (Luma) fires a black-hole projectile toward the cursor in any active scene; on boss hit it also deals 10–30% of boss max HP as bonus damage."
- [ ] **`docs/implementation/001_game_systems_overview.md` Luma row (line 92)**: Update Special column from "Black-hole projectile; instant phase damage in boss fight" to "Fires a void projectile toward cursor in any active scene; on boss hit also deals 10–30% bonus HP damage and shows the black hole visual"
- [ ] **`docs/implementation/001_game_systems_overview.md` blackHoleEffect description (lines 127–128)**: Update from "created when Luma fires her void ability during the boss fight; it pulls all enemy projectiles toward a point and deals instant phase damage" to "spawned when a void special projectile hits a target or reaches its cursor target position, in any active state; in boss fights only, also applies 10–30% of boss max HP as bonus damage and renders the '% HP' text"
