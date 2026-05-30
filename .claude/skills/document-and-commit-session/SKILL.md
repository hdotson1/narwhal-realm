---
name: document-and-commit-session
description: Update documentation based on a coding session, including creating working logs and updating implementation documents.
---

## Step 1: Review What Changed

Run `git diff HEAD` and `git status` to see all staged and unstaged changes. Read through the diff carefully. Build a mental model of:
- Which systems were touched
- What was added, changed, or removed
- Why (infer from the code and the plan document if one exists)

Also check `docs/planning/` for the plan document that guided this session. If one exists, read it to confirm the session goal and intended scope.

## Step 2: Write the Working Log

Create a working log at:
```
docs/working_logs/YYYY_MM_DD_II_<short_description>.md
```

Use today's date, a zero-padded two-digit index (`00`, `01`, …) that increments for each log created on the same date, and a 3–5 word snake_case description matching the session goal.

Use this structure:

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
Decisions made, blockers hit, things deferred, follow-ups needed. Keep brief.
```

Guidelines:
- No code snippets in the log
- No implementation detail (that belongs in `docs/implementation/`)
- Focus on *what* and *why*, not *how*
- One entry per logical change, not one per function touched

## Step 3: Update Implementation Docs (if needed)

Check `docs/implementation/`. If the session changed a system's architecture, added a new major subsystem, or established a new pattern, update or create the relevant implementation doc.

Only update implementation docs if the change is architectural or establishes a lasting pattern. Bug fixes, balance tuning, and asset swaps do not warrant doc updates.

New implementation docs use the next available index number: `NNN_snake_case_title.md` (zero-padded, three digits). See `docs/implementation/README.md` for details.

## Step 4: Mark Plan Tasks Complete (if applicable)

If a plan document exists in `docs/planning/`, update the task checkboxes to reflect what was completed. Leave uncompleted tasks unchecked if the session was cut short.

## Step 5: Stage and Commit

Stage all changes including the new working log and any updated docs:
```
git add <specific files>
```

Prefer staging files by name rather than `git add -A`.

Write a commit message that summarizes the session goal in present tense (e.g., "Add third boss phase bullet pattern"). Keep it under 72 characters. Add a blank line then a brief body if the changes need more context.

Commit using:
```
git commit -m "$(cat <<'EOF'
<message>
EOF
)"
```

After committing, confirm success with `git status` and report the commit hash to the user.
