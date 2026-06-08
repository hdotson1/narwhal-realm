# Narwhal Realm

A browser-based action game where you rescue narwhals from five elemental realms and defeat the final boss — an evil orca driving a Cybertruck.

## How to Run

Open `src/index.html` in any modern browser. No install, no build step, no server required.

## How to Play

| Input | Action |
|---|---|
| WASD / Arrow keys | Move |
| Mouse | Aim |
| Click | Shoot |
| 1–5 | Select active companion ability |
| Control toggle button | Switch movement between WASD and mouse-click steering |

Rescue narwhals by touching them, then escort each one back to the hub portal. Unlock all five companions to challenge the boss.

## Project Structure

| Path | Purpose |
|---|---|
| `src/index.html` | Game markup and UI overlay |
| `src/styles.css` | All CSS |
| `src/constants.js` | Constants: canvas size, fonts, narwhal/realm/element definitions |
| `src/state.js` | Image loading, all mutable game state variables |
| `src/obstacles.js` | Obstacle themes, generation, drawing, void physics |
| `src/draw.js` | All draw functions and `render()` |
| `src/update.js` | Game logic: `update()`, `gameLoop()`, boss, shop, realm transitions |
| `src/input.js` | Keyboard and mouse event listeners |
| `src/main.js` | Button wiring, startup |
| `src/assets/narwhal-*.png` | Narwhal sprites (player + 5 companions) |
| `src/assets/enemy-*.png` | Enemy robot sprites, one per element |
| `src/assets/bg-*.svg` | Realm background images |
| `src/assets/orca-boss.png` | Boss sprite |
| `ART-ASSETS.md` | Art spec — sizes, palettes, and orientation notes for all assets |
| `docs/` | Project documentation |

## Documentation

| Folder | Purpose |
|---|---|
| [docs/planning/](docs/planning/) | Session plans written before coding begins |
| [docs/working_logs/](docs/working_logs/) | Per-session change and decision logs |
| [docs/implementation/](docs/implementation/) | Technical reference for game systems |

## Development

See [CLAUDE.md](CLAUDE.md) for architecture details and AI-assisted development guidance.
