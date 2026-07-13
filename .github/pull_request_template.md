## Problem

Describe the user or engineering problem this change solves.

## Solution

Explain the smallest coherent change made.

## Scope

State what is included and explicitly excluded.

## Acceptance criteria

- [ ] Observable behavior matches the requirement
- [ ] Important failure paths are handled
- [ ] AI-generated content meets guardrails policy
- [ ] Subscription tier access controls work correctly

## Validation

- [ ] Formatting: `bun run lint --fix`
- [ ] Type checking: `bun run build`
- [ ] Tests: `bun run test`
- [ ] API tests: `bun run test:api`
- [ ] Build: `bun run build`

List actual results. Do not check a gate that was not run.

## Risk and rollback

Describe data, security, compatibility, deployment, and rollback implications.

## Documentation

List updated documents or explain why no documentation change is needed.
