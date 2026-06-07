# Plan: Art Asset Integration — Sand Dollar & Element Projectiles
**Date**: 2026-06-07

## Goal
Replace the coin emoji (🪙) everywhere in the game with the new sand dollar PNG art, and replace the plain glowing-circle enemy projectiles with element-specific PNGs that rotate to face their direction of travel. The sand dollar image will appear in all coin contexts: the canvas coin pickup objects, the HUD icon, the void portal lock text, pickup particles, shop dialog text, and status messages. Enemy projectile images (512×862 px) will pivot around the center of their top 512×512 px square so the sprite's "head" always points in the direction of travel.

## Context

**Files and key lines:**
- `src/constants.js` — all shared constants (ENEMY_SIZE=48, NARWHAL_SIZE=80); `PROJ_IMG_SIZE` will be added here
- `src/state.js:10-13` — image loading block; all new PNGs must be registered here
- `src/index.html:23` — `<div id="sandDollars">🪙 0</div>` — needs img + span restructure
- `src/draw.js:202-217` — `drawCoinPickups()` — currently draws 🪙 emoji via canvas fillText
- `src/draw.js:173-178` — void portal lock text renders `🪙` inline in canvas fillText
- `src/draw.js:377-398` — projectile render loop; player shots lines 378-386, enemy shots lines 387-398
- `src/draw.js:401-405` — particle renderer; handles `'text'` type; needs `'coin-img'` type added
- `src/update.js:107` — `showStatus()` uses `el.textContent`; needs switch to `innerHTML`
- `src/update.js:160-172` — `updateCoinPickups()`; spawns `{type:'text',text:'+🪙',...}` particle
- `src/update.js:166,501,822` — three places that set `#sandDollars` textContent to `'🪙 '+sandDollars`
- `src/update.js:332-335` — `updateParticles()`; static-type guard (`'text'||'coin'`); needs `'coin-img'` added
- `src/update.js:489-501` — shop dialog text; uses `textContent`, includes 🪙 in template literals
- `src/update.js:824,830` — two `showStatus()` calls with inline 🪙

**New art files (already in `src/assets/`):**
- `sand-dollar.png` — square-ish, for HUD icon and coin pickups
- `water-projectile.png`, `fire-projectile.png`, `earth-projectile.png`, `air-projectile.png`, `void-projectile.png` — each 512×862 px, art points upward, pivot at (256, 256) from top-left

**Projectile rotation math:**
- Canvas angle 0 = right; art points up = angle −π/2. So `rotation = Math.atan2(p.vy, p.vx) + Math.PI/2`
- Display size `s = PROJ_IMG_SIZE` (36 px, slightly smaller than ENEMY_SIZE=48)
- Full rendered height: `s * (862/512)` so the tail extends behind the projectile
- Draw call: `ctx.drawImage(img, -s/2, -s/2, s, s*(862/512))` after translate+rotate — places image so the pivot square center sits at the projectile's (x,y) position

## Design Decisions

**Sand dollar in canvas text (void portal, pickup particle):**
Canvas `fillText()` cannot embed images. For the void portal lock text (draw.js:173-178), the string is split around the coin icon and the image is drawn inline using `ctx.measureText()` to position segments. For the pickup particle, a new `'coin-img'` particle type is introduced that draws the sand dollar image instead of text, with the same float-up animation as the current `'text'` type (`p.y-(1-alpha)*20`).

**Sand dollar in HTML text (HUD, shop dialog, status messages):**
- HUD: `index.html:23` restructured to `<img id="sandDollarIcon"> <span id="sandDollarCount">0</span>`. All three JS HUD-update sites changed to target `#sandDollarCount`.
- `showStatus()` switched from `textContent` to `innerHTML`; the two callers that include a coin icon pass an `<img>` HTML snippet instead of 🪙.
- Shop dialog `shopText` element switched from `textContent` to `innerHTML`; coin references in template literals replaced with an `<img>` snippet.

**Why `innerHTML` instead of a helper:** Only hardcoded internal strings are injected — no user input — so there is no XSS risk. Using `innerHTML` is simpler than a wrapper element approach.

**Enemy projectile fallback:** If the image hasn't loaded, fall back to the current glowing circle so the game is never broken mid-load.

**Player projectiles unchanged:** Player shots remain glowing circles per the agreed scope.

## Out of Scope
- Changing enemy projectile hitbox sizes (p.r stays as-is: 7–9 px)
- Applying projectile images to player shots
- Animating the sand dollar (bobbing coin pickup already bobs; the image just replaces the emoji)
- Changing any narwhal art or enemy art

## Tasks
- [ ] Task 1 — `constants.js`: add `const PROJ_IMG_SIZE=36;`
- [ ] Task 2 — `state.js:10-13`: add `'sand-dollar'`, `'water-projectile'`, `'fire-projectile'`, `'earth-projectile'`, `'air-projectile'`, `'void-projectile'` to the image loading array (file names match asset names exactly)
- [ ] Task 3 — `index.html:23`: keep outer `<div id="sandDollars">` (id must stay — `update.js` hides it during the boss fight via `style.display='none'`); replace inner text `🪙 0` with `<img src="assets/sand-dollar.png" style="width:18px;height:18px;vertical-align:middle;margin-right:3px;"><span id="sandDollarCount">0</span>`
- [ ] Task 4 — `draw.js:drawCoinPickups()` (lines 203-217): replace `ctx.fillText('🪙',c.x,by)` with `ctx.drawImage(IMAGES['sand-dollar'], c.x-12, by-12, 24, 24)` (keep glow shadow, remove emoji shadow)
- [ ] Task 5 — `draw.js:173-178` (void portal lock text): replace inline `🪙` with image-interleaved canvas rendering using `ctx.measureText()` to split text around a 16 px sand-dollar drawImage
- [ ] Task 6 — `draw.js:387-398` (enemy projectile loop): for each enemy projectile, wrap entirely in `ctx.save()`/`ctx.restore()` to protect the transform stack, then `ctx.translate(p.x,p.y); ctx.rotate(Math.atan2(p.vy,p.vx)+Math.PI/2)` and draw `ctx.drawImage(IMAGES[p.element+'-projectile'], -s/2, -s/2, s, s*(862/512))`; set `ctx.shadowColor=p.color; ctx.shadowBlur=10` before the drawImage for the element glow; add fallback circle (current code) when image not yet loaded; boss-fight projectiles also use `enemyProjectiles` and will naturally receive sprite treatment — no special guard needed
- [ ] Task 7 — `draw.js:401-405` (particle renderer): add `else if(p.type==='coin-img')` branch that draws the sand-dollar image at the float-up position (`p.y-(1-alpha)*20`) with `ctx.globalAlpha=alpha`
- [ ] Task 8 — `update.js:332-335` (`updateParticles` static-type guard): add `||p.type==='coin-img'` so coin-img particles don't get vx/vy movement applied
- [ ] Task 9 — `update.js:168` (`updateCoinPickups` particle spawn): change `{type:'text',text:'+🪙',...}` to `{type:'coin-img', x:c.x, y:c.y-10, life:0.7, maxLife:0.7}`
- [ ] Task 10 — `update.js:166,501,822` (HUD updates): change all three `document.getElementById('sandDollars').textContent='🪙 '+sandDollars` to `document.getElementById('sandDollarCount').textContent=sandDollars`
- [ ] Task 11 — `update.js:107` (`showStatus`): change `el.textContent=msg` to `el.innerHTML=msg`
- [ ] Task 12 — `update.js:824,830` (two `showStatus` callers with 🪙): replace inline `🪙` in those two string literals with the `<img>` HTML snippet (defined as a constant at top of function or inline)
- [ ] Task 13 — `update.js:489-501` (shop dialog): change `document.getElementById('shopText').textContent=...` to `.innerHTML=...` for both the affordable and unaffordable branches; replace `🪙` in template literals with `<img>` snippet
