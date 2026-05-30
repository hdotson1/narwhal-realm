---
name: plan
description: Plan a coding session by outlining the tasks to be completed, the goals of the session, and any relevant information that will guide the development process.
argument-hint: Provide a brief outline of the tasks you plan to complete during this coding session, along with the goals you aim to achieve. Include any relevant information or context that will help guide your development process.

---

You are planning a development session for this project. Follow these steps in order.

## Step 1: Understand the Goal

If the user provided a goal with the `/plan` command, use it. If not, ask: "What do you want to build or fix in this session?"

Once you have a goal, state it back in one sentence and confirm before proceeding.

## Step 2: Deep Dive on Relevant Code

The entire game is in `index.html`. Read CLAUDE.md for the architecture overview, then read the specific sections of `index.html` relevant to your goal. Use line numbers to anchor your understanding.

Focus on:
- Which state(s) are involved (see the state machine in CLAUDE.md)
- Which global variables the feature reads or writes
- Which functions you'll need to add to or modify
- Any obstacles, interactions, or rendering code in the affected realm(s)

Be thorough. Note constraints, patterns, or gotchas you discover. The goal is to understand the current code well enough to plan without surprises.

## Step 3: Clarify Intent

Based on your deep dive, identify the 2–4 most important unknowns or ambiguities. Ask them as a numbered list. Wait for answers before continuing.

Focus on:
- Scope: what is and isn't included
- Design choices where multiple valid approaches exist
- Anything that would require a different implementation if the answer changed

Do not ask about things that are obvious from the code or that you can reasonably decide yourself.

## Step 4: Write the Plan Document

Create a plan document at:
```
docs/planning/YYYY_MM_DD_II_<short_description>.md
```

Use today's date, a zero-padded two-digit index (`00`, `01`, …) that increments for each plan created on the same date, and a 3–5 word snake_case description of the goal.

Use this structure:

```markdown
# Plan: <Goal Title>
**Date**: YYYY-MM-DD

## Goal
One clear paragraph describing what this session will accomplish and why.

## Context
Key facts about the current state of the relevant systems. Include line number
ranges in index.html for anything important. Keep it tight.

## Design Decisions
The choices made and the rationale. Include alternatives considered and why they
were ruled out.

## Out of Scope
Explicitly list what this plan does NOT address, to prevent scope creep.

## Tasks
- [ ] Task 1 — brief description
- [ ] Task 2 — brief description
...
```

Each task should be a concrete action referencing a specific function or line range in `index.html`. Order by dependency.

## Step 5: Validate the Plan

Use the Agent tool to spawn a sub-agent with this prompt:

> "Review the following development plan for a single-file browser game (index.html, ~2000 lines, no build step). Check it for: (1) clarity — are the tasks specific and actionable, or are any vague? (2) completeness — are there obvious missing steps, like wiring up new state transitions or updating the render path? (3) architectural fit — does the plan work within the single-file constraint and respect the existing state machine? (4) scope — is anything underspecified that would block execution? Return a brief bulleted critique. Be critical, but if the plan is solid, say so."
>
> [paste full plan document content here]

After the sub-agent responds, present its feedback to the user. If there are significant issues, offer to revise. If the plan is solid, tell the user:

> "Plan written to `docs/planning/<filename>`. Run `/execute` to begin implementation."
