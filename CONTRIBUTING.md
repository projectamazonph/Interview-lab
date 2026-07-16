# Contributing to Interview Lab

## Before making changes

Read `AGENTS.md`, the relevant requirements, architecture notes, tests, and recent decisions in `docs/`. Keep the change focused on one coherent outcome.

## Development loop

1. Create or select a small task with acceptance criteria.
2. Write or update a failing test.
3. Implement the smallest passing change.
4. Run formatting, linting, type checking, tests, and the build.
5. Update documentation and changelog entries when behavior changes.
6. Open a reviewable change with evidence of validation.

## Commit guidance

Use clear, imperative commit messages. Explain why the change exists when the diff does not make that obvious. Avoid mixing refactors, formatting churn, generated output, and behavior changes in one commit.

## Pull requests

Include the problem, solution, scope boundaries, tests run, risks, screenshots or recordings for UI work, migration or rollback steps, and documentation changes.

## AI Content Guardrails

When modifying AI-related features (mock interviews, resume coaching, cover letter generation):
- All AI prompts must be in `src/lib/` not scattered in components
- Content must pass the guardrails defined in `docs/07-guardrails.md`
- AI-generated content must include truthfulness warnings
- No fabrication of Amazon tool experience claims

## Tech Stack Conventions

| Layer | Tool |
|-------|------|
| Runtime | Node (`package-lock.json` tracked; Bun also works, no `bun.lock` in the repo) |
| Framework | Next.js 16 (App Router) |
| Database | Prisma + PostgreSQL only (no SQLite fallback — `DATABASE_URL` required) |
| Auth | JWT (jose) + HttpOnly cookies |
| Styling | Tailwind CSS v4 with glass design system |
| Icons | Phosphor Icons (weight="light" only) |
| Fonts | Space Grotesk (headings) + Plus Jakarta Sans (body) |

## Common Commands

```bash
bun install                          # Install dependencies (or npm install)
bun run dev                          # Start dev server on :3000
bun run build                        # Production build (prisma generate + next build)
bun test __tests__/api/              # API unit tests — 218 pass; ~38 fail without a running dev
                                      # server (4 live-integration files) — expected, not a regression
npx vitest run __tests__/components  # Component tests — needs vitest's jsdom env
bun run lint                         # ESLint
bun run db:push                      # Push schema to DATABASE_URL (Postgres)
bun run db:generate                  # Generate Prisma client
```

Plain `bun run test` / `npm test` do not run the whole suite cleanly — 7 of the `__tests__/api/*.test.ts` files import from `'bun:test'`, which plain `vitest run` can't load. Use the two commands above instead.
