# Working Log — 2026-06-07

**Session goal**: Bring all four documentation files (README.md, CLAUDE.md, 001, 002) into sync with the current codebase — primarily to reflect the module split and hi-DPI scaling work that had never been documented, and to correct stale values, asset names, and structural descriptions.

---

## Changes

### Plan document created (prior session, included in this commit)
**Why**: A doc audit was scoped in advance to identify all stale references across the four target files.
**What**: Created `docs/planning/2026_06_06_00_doc_audit_and_update.md` capturing the goal, context, design decisions, out-of-scope items, and task checklist.
**Files**: `docs/planning/2026_06_06_00_doc_audit_and_update.md`

### README.md — description, How to Run, How to Play
**Why**: The description named only the Cybertruck; the run path was missing `src/`; the control-mode toggle button was undocumented.
**What**: Updated description to "evil orca driving a Cybertruck"; corrected run path to `src/index.html`; added control toggle row to the How to Play table.
**Files**: `README.md`

### README.md — project structure table
**Why**: The table listed a single monolithic `index.html` and used root-level asset paths; the codebase has been split into 7 JS modules under `src/` and all assets live in `src/assets/`.
**What**: Replaced the single `index.html` entry with all 9 `src/` files (index.html, styles.css, and the 7 JS modules); corrected all asset paths to `src/assets/`; renamed `cybertruck-boss.png` → `orca-boss.png`.
**Files**: `README.md`

### CLAUDE.md — architecture section
**Why**: The architecture paragraph still described the pre-split three-file structure and referenced `game.js`, which no longer exists.
**What**: Updated to describe nine files; listed the 7 JS modules in load order; linked to 001 for full descriptions. Removed all `game.js` references.
**Files**: `CLAUDE.md`

### CLAUDE.md — state machine, game loop, key variables, drawing
**Why**: `boss` state description referenced the Cybertruck; `quiz` appeared in the game loop's "states that skip update" list (quiz is never set); `controlMode` was undocumented; `drawCybertruck` rendered an `orca-boss` asset with no explanation.
**What**: Updated `boss` row to "Evil Orca boss fight"; removed `quiz` from the game loop description; added `controlMode` to the Key Global Variables table; clarified that `drawCybertruck` renders the `orca-boss` PNG (function name predates the redesign).
**Files**: `CLAUDE.md`

### docs/implementation/001 — state machine table and notes
**Why**: `quiz` was listed as an active state (it is dormant — HTML element exists but the state value is never set); `boss` row still said "Final Cybertruck boss fight"; `#bossLoseScreen` and `controlMode` were undocumented.
**What**: Marked `quiz` row as dormant with explanation; updated `boss` row to "Evil Orca boss fight"; added blockquote notes documenting the `#bossLoseScreen` trivia retry flow (state='lose' → correct answer → state='boss') and the `controlMode` variable with a cross-reference to CLAUDE.md. Updated the `update()` skip-states description to remove `quiz`.
**Files**: `docs/implementation/001_game_systems_overview.md`

### docs/implementation/001 — image loading and UI overlay
**Why**: Image key `cybertruck-boss` was listed but the actual key registered in `state.js` is `orca-boss`; `#bossLoseScreen` was absent from the UI overlay table; `#quizPopup` had no dormant annotation.
**What**: Updated example key from `cybertruck-boss` to `orca-boss`; added `#bossLoseScreen` row; annotated `#quizPopup` as dormant.
**Files**: `docs/implementation/001_game_systems_overview.md`

### docs/implementation/001 — boss section header
**Why**: Section header said "Boss Fight" with no reference to the orca, inconsistent with the updated state machine table.
**What**: Renamed section to "Evil Orca Boss Fight".
**Files**: `docs/implementation/001_game_systems_overview.md`

### docs/implementation/002 — CANVAS_FONT values and CANVAS_FONT_BASE_ANIM
**Why**: All nine CANVAS_FONT tier values in the doc were the pre-hi-DPI values (roughly half the current sizes); CANVAS_FONT_BASE_ANIM was documented as 32 but is 42 in code.
**What**: Updated all nine tier values verbatim from `constants.js`; updated CANVAS_FONT_BASE_ANIM to 42 and corrected the assembled font-string example.
**Files**: `docs/implementation/002_text_sizing_and_scale.md`

### Stale quiz comment in game loop
**Why**: The comment in `gameLoop` still listed `quiz` as a state that intentionally skips `update`.
**What**: Removed `quiz` from the comment; now reads "fact, shop states intentionally skip update".
**Files**: `src/update.js`

### Ability slot activation feedback (unlisted playtest session, included here)
**Why**: Triggering the air heal or void black hole had no visual feedback on the ability slot itself.
**What**: Added a `slotPulse` CSS keyframe animation and `.activating` slot class; the keydown handler for air and void ability keys now applies `.activating` to the relevant slot. The canvas click handler was simplified to always call `shootPlayer` — the duplicate air/void special cases that had lived in both keydown and click are now handled exclusively in keydown.
**Files**: `src/styles.css`, `src/input.js`

### Void ability UX and balance adjustments (unlisted playtest session, included here)
**Why**: Void ability could be triggered outside the boss fight (no-op but confusing); black hole damage range was too high.
**What**: Added a guard in the void keydown handler that shows "Reach the boss first!" if state is not `boss`. Adjusted black hole damage from 20–40% to 10–30% of boss max HP.
**Files**: `src/input.js`

### Remove auto-select void on meetLuma (unlisted playtest session, included here)
**Why**: Automatically selecting the void element when Luma's intro dialog opened could silently override the player's current selection.
**What**: Removed the `if(!selectedElement) setSelected('void')` call from `meetLuma`.
**Files**: `src/update.js`

---

## Notes

- The unlisted playtest session changes (three entries above) were uncommitted and undocumented when this session began; they are included here for completeness.
- `update.js:717` stale quiz reference noted in the plan has been addressed (comment was at line 730 after prior session edits shifted the file).
- `#quizPopup` HTML element and CSS remain in place intentionally — the void keeper quiz may be re-activated in a future session.
