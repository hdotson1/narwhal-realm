# Narwhal Realm

A browser-based action game where you rescue narwhals from five elemental realms and defeat the final boss — an evil Cybertruck.

## How to Run

Open `index.html` in any modern browser. No install, no build step, no server required.

## How to Play

| Input | Action |
|---|---|
| WASD / Arrow keys | Move |
| Mouse | Aim |
| Click | Shoot |
| 1–5 | Select active companion ability |

Rescue narwhals by touching them, then escort each one back to the hub portal. Unlock all five companions to challenge the boss.

## Project Structure

| Path | Purpose |
|---|---|
| `index.html` | Entire game — HTML, CSS, and ~2000 lines of JavaScript |
| `narwhal-*.png` | Narwhal sprites (player + 5 companions) |
| `enemy-*.png` | Enemy robot sprites, one per element |
| `bg-*.svg` | Realm background images |
| `cybertruck-boss.png` | Boss sprite |
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
