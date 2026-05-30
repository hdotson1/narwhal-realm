# Working Logs

Per-session logs that record what changed, why decisions were made, and what was deferred. One file per coding session.

## When to Create

Run `/document-and-commit-session` at the end of every coding session. The skill writes the log, updates any relevant implementation docs, and commits everything.

## File Naming

```
YYYY_MM_DD_II_<short_description>.md
```

Use today's date, a zero-padded two-digit index starting at `00` (incrementing for each log created on the same date, resetting to `00` the next day), and a 3–5 word snake_case description matching the session goal.

Example: `2026_05_29_00_add_boss_phase4.md`

## Document Structure

```markdown
# Working Log — YYYY-MM-DD

**Session goal**: One sentence describing what this session set out to accomplish.

---

## Changes

### <Short title for this change>
**Why**: One sentence on the motivation.
**What**: One or two sentences on what was added, changed, or removed.
**Files**: Comma-separated list of affected files.

*(Repeat for each logical group of changes)*

---

## Notes
Decisions made, blockers hit, things deferred, follow-ups needed.
```

## Rules

- Focus on *what* and *why*, not *how* — implementation detail belongs in `docs/implementation/`.
- No code snippets.
- One entry per logical change, not one per edit or function touched.
- Keep the Notes section brief; it is not a narrative.
