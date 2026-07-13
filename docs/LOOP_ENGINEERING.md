# Loop Engineering Guide

## Overview

This project uses bounded implementation loops for feature development. Each loop has clear objectives, acceptance criteria, and stop conditions.

## Loop Orchestrator Integration

Use the companion Loop Orchestrator Skill for bounded implementation cycles. Provide:
- One objective
- Explicit acceptance criteria
- A test or validator command
- An iteration budget
- Known constraints and blockers
- The first hypothesis or inspection target

## Development Loop Pattern

```
1. DEFINE objective
   - What user problem are we solving?
   - What does success look like?

2. WRITE test first
   - Add smallest failing test
   - Prove the acceptance criteria fail

3. IMPLEMENT
   - Write minimum passing code
   - Keep scope tight

4. VERIFY
   - Run tests
   - Check lint and typecheck
   - Verify build

5. REFACTOR
   - Clean up while tests pass
   - Preserve behavior

6. RECORD
   - Update BUILD_LOG.md
   - Note any new understanding
   - Check if loop is complete
```

## Example Loop: Interview Session Scoring

### Objective
User receives AI feedback after submitting an interview answer.

### Acceptance Criteria
- [ ] User submits answer via API
- [ ] AI generates feedback with rubric breakdown
- [ ] Score stored in database
- [ ] User sees feedback in results

### Commands
```bash
bun run test:api          # Verify API tests pass
bun run build             # Verify build succeeds
```

### Iteration Budget
3 iterations maximum

### Stop Conditions
- All acceptance criteria met
- Tests passing
- Code reviewed

## Using Loop Orchestrator

When continuing implementation through bounded loops:

1. Surface this document to Loop Orchestrator
2. Provide the specific objective for this iteration
3. Reference acceptance criteria and commands
4. Track progress in BUILD_LOG.md

## Handoff Protocol

Stop and return to Project Bootstrap when:
- A new architectural decision is needed
- Missing source-of-truth document discovered
- Scope change requested
- Significant risk identified
