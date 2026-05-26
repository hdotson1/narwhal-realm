# Art Assets

All assets are PNG with transparency. The game canvas is 800×600 px.  
Placeholders (copies of the originals) are already in place so the game runs immediately.

---

## Narwhals — 128×128 px each

Draw the narwhal **tusk pointing up** (toward the top of the canvas). The game rotates each sprite to aim toward its target, so the up-facing pose is the neutral orientation. Keep the narwhal body centered in the square with a little transparent padding on all sides so rotation looks smooth.

| File | Character | Colour palette |
|---|---|---|
| `narwhal-player.png` | Player narwhal | Soft lavender / `#c9a0ff` |
| `narwhal-water.png` | Squirt — Water narwhal | Ocean blue / `#0088ff` |
| `narwhal-fire.png` | Spark — Fire narwhal | Orange-red / `#ff5511` |
| `narwhal-earth.png` | Root — Earth narwhal | Forest green / `#44aa00` |
| `narwhal-air.png` | Breeze — Air narwhal | Sky blue / `#88aaff` |
| `narwhal-void.png` | Luma — Void narwhal | Deep purple / `#8800ff`, near-black body |

---

## Enemies — 96×96 px each

Stylised robot/creature enemies, one per element. Draw them **facing forward** (toward the viewer) so they look threatening from any approach direction. Keep the sprite centered in the square.

| File | Element | Colour palette |
|---|---|---|
| `enemy-water.png` | Water | Blues / cyans |
| `enemy-fire.png` | Fire | Reds / oranges |
| `enemy-earth.png` | Earth | Browns / greens |
| `enemy-air.png` | Air | Light blues / whites |
| `enemy-void.png` | Void | Purples / blacks |

---

## Boss — 300×220 px

| File | Character | Notes |
|---|---|---|
| `cybertruck-boss.png` | Evil Cybertruck | Draw the truck **facing right**. The truck moves side-to-side across the top of the screen. Stainless-steel angular body, glowing teal accents, menacing headlights. The code overlays animated orange exhaust flames on the left side during Phase 2, so keep that area clear of important detail. |

---

## Display sizes (for reference)

These are the sizes the game renders each PNG at — useful for checking proportions:

| Asset | In-game display size |
|---|---|
| Player narwhal | 80×80 px |
| Companion narwhals | 44×44 px (scaled to 55%) |
| Captive narwhals | 80×80 px |
| Enemies | 48×48 px |
| Boss Cybertruck | 140×100 px |
