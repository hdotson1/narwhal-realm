# Implementation Documents

Technical reference describing the game's systems as they are actually implemented. These are updated whenever architectural changes are made — they should always reflect current code, not original design.

## When to Create or Update

After any session that adds a major feature, changes a system's architecture, or establishes a lasting pattern. Bug fixes, balance tuning, and asset swaps generally do not warrant updates.

## File Naming

```
NNN_snake_case_title.md
```

Use a **zero-padded three-digit index** followed by a snake_case description.

Examples: `001_game_loop.md`, `002_state_machine.md`, `003_combat_system.md`

The index controls sort order. Assign the next available number when creating a new document. **Do not renumber existing documents** — renaming breaks links in working logs and planning docs.

## Document Structure

There is no fixed template; structure each doc to suit the system it describes. As a guide, include:

- **Overview** — what the system does and where it lives in `index.html` (line range)
- **Key variables / functions** — names, types, and what they represent
- **Data flow** — how state moves through the system
- **Edge cases / gotchas** — anything non-obvious that would surprise a reader

## Rules

- Describe the system as it exists now, not as it was originally designed.
- Include line number references into `index.html` so readers can jump straight to the code.
- When a refactor changes a described system, update the doc in the same commit.
- Remove sections that are no longer accurate rather than leaving stale notes.
