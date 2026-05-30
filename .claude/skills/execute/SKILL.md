---
name: execute
description: Execute a coding session by following the outlined plan, completing the tasks, and achieving the goals set for the session. This involves writing code, testing, and documenting your work as needed.
argument-hint: Provide any relevant information or context that will help guide your execution process or extra details about the tasks you are working on during this coding session. The planning document should also be included in the context to ensure that the execution is aligned with the outlined plan.
---

You are executing a development session for this project. Your job is to implement the plan faithfully and precisely.

## Step 1: Load the Plan

Find the plan document. Check `docs/planning/` for the most recent `.md` file, or ask the user which plan to follow if there are multiple candidates.

Read the plan fully. Confirm the goal and task list with the user before writing any code:

> "I'll be working from `<filename>`. Goal: <goal>. Tasks: <numbered list>. Ready to proceed?"

## Step 2: Prepare

Before touching any part of `index.html`, read the relevant sections. Understand the existing code before modifying it. Note which global variables and functions are involved.

## Step 3: Execute Tasks in Order

Work through the task list one at a time. For each task:
1. State which task you're starting.
2. Make the changes.
3. State what you did and why, briefly.
4. Move to the next task.

### Architecture Rules (always apply)

- **Single file**: Everything lives in `index.html`. Do not add external JS files, modules, or build steps.
- **No new dependencies**: Do not add script tags for external libraries unless the plan explicitly requires it.
- **State machine**: All game mode transitions must go through the `state` variable. Never bypass or shortcut the state machine.
- **Canvas rendering**: All drawing goes through the 2D canvas API. Follow existing patterns (`drawBackground`, `drawNarwhal`, `drawRobot`, etc.).
- **Game loop**: New per-frame logic belongs in `update(dt)` or `render()`. Do not add `setInterval` or additional `requestAnimationFrame` calls.

### When to Stop and Ask

Stop and ask the user before proceeding if:
- The plan is ambiguous and the choice would significantly change the implementation
- Implementing a task would require changes well outside the plan's stated scope
- A function or section of `index.html` is in a state that contradicts what the plan assumed
- You're unsure which of two valid approaches is preferred

Do not ask about small stylistic choices or anything you can reasonably decide yourself.

## Step 4: Quick Review

After completing all tasks, do a quick pass over your changes:
- Check that all new state transitions are handled in both `update` and `render`.
- Check that new global variables are initialized at declaration and reset in any relevant reset functions.
- Look for obvious mistakes: off-by-one errors, missing `break` in switch statements, unreachable code.

## Step 5: Wrap Up

Do NOT commit. Tell the user:

> "Implementation complete. Run `/document-and-commit-session` to write the working log and commit."

List any follow-up items you noticed during execution that weren't in the plan (edge cases not handled, things deferred, related debt). Keep it brief.
