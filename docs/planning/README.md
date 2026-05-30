# Planning Documents

Pre-implementation documents that define scope, architecture decisions, and task breakdown before a coding session begins. Once implementation starts, planning docs are not updated — they are a record of intent, not a living document.

## When to Create

Run `/plan` before any non-trivial session. The skill generates the document automatically after gathering your goal and asking clarifying questions.

## File Naming

```
YYYY_MM_DD_II_<short_description>.md
```

Use today's date and a 3–5 word snake_case description of the goal. II should be an index number that starts with 00 and increments for each log created on a given date, resetting to 00 for the next day.

Example: `2026_05_29_01_add_boss_phase4.md`

## Document Structure

```markdown
# Plan: <Goal Title>
**Date**: YYYY-MM-DD

## Goal
One clear paragraph describing what this session will accomplish and why.

## Context
Key facts about the current state of the relevant systems. Include line number
ranges in index.html for anything important.

## Design Decisions
Choices made and the rationale. Include alternatives considered and why they
were ruled out.

## Out of Scope
Explicitly list what this plan does NOT address, to prevent scope creep.

## Tasks
- [ ] Task 1 — brief description
- [ ] Task 2 — brief description
```

## Rules

- Write the plan before touching any code; do not revise it once implementation begins.
- Tasks should be concrete actions referencing specific functions or line ranges in `index.html`.
- The out-of-scope section is mandatory — it forces you to define the boundary.
- Check tasks off during the session (the `/document-and-commit-session` skill uses them).
