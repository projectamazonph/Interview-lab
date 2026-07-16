# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                                    # install deps (package-lock.json is the tracked lockfile;
                                                # docs/AGENTS.md references Bun, but no bun.lock exists in the repo)
npm run dev                                    # dev server on :3000 (Turbopack)
npm run build                                  # prisma generate + next build
npm run lint                                   # ESLint (flat config, eslint.config.mjs)

npm run db:push                                # push prisma/schema.prisma to DATABASE_URL
npm run db:generate                            # regenerate Prisma client (also runs on postinstall)
npm run db:migrate                             # create a migration
npm run db:reset                               # reset DB
```

`prisma/schema.prisma` targets `postgresql` via `DATABASE_URL` — set that env var before any `db:*` command or `build`. `JWT_SECRET` signs session cookies (falls back to a dev default if unset).

### Running tests — the plain `npm test` / `bun test` commands do NOT work cleanly

Test files are split across two incompatible runners, and some are live-integration tests. The package.json `test`/`test:api`/`test:components` scripts all wrap plain `vitest run`, but 7 of the `__tests__/api/*.test.ts` files import from `'bun:test'`, not `'vitest'` — running them under vitest fails immediately with `Cannot bundle Node.js built-in "bun:test"`. Conversely, running the whole suite with `bun test` pulls in the vitest-only files (`vi.mock`-based) and several live-integration tests that need a running server, so *that* fails too. Verified working invocations:

```bash
# Reliable, in-memory, no server needed — this is the "218 tests" the README/AGENTS.md refer to, plus component tests:
bun test __tests__/api/questions.test.ts __tests__/api/auth-register.test.ts __tests__/api/auth-login.test.ts \
  __tests__/api/assessments.test.ts __tests__/api/profile-dashboard.test.ts __tests__/api/subscription.test.ts \
  __tests__/api/resume-coverletter.test.ts                      # bun:test — 197 tests
npx vitest run __tests__/api/interview-session.test.ts __tests__/components   # vitest — 21 + 44 tests

# Single file / single test, in whichever runner that file uses (check its first import):
bun test __tests__/api/subscription.test.ts
npx vitest run __tests__/api/interview-session.test.ts -t "some test name"
```

`__tests__/api/auth.test.ts`, `user-paths.test.ts`, `questions-interview-ai.test.ts`, `resources.test.ts`, `__tests__/run-api-tests.js`, and `__tests__/stress/stress-test.ts` are **live integration tests** — they `fetch()` `http://localhost:3000` directly and need `npm run dev` running first; several also expect a seeded/reachable Postgres via `DATABASE_URL`. Don't run these to check "does my change break tests" — use the in-memory suite above for that, and only reach for these if you're specifically validating against a running server.

## Architecture

### The authenticated app is one route, not a multi-page site

`src/app/page.tsx` is a client component that acts as a state machine, not a router. Logged-out users see `LandingPage` → `AuthScreen`; once authenticated, `AppLayout` wraps a `renderView()` switch keyed by `ActiveView` (dashboard, interview, resume, cover-letter, assessments, downloads, guides, admin, pricing, …). There is no `/dashboard/interview` URL — navigating between features is a state change inside this one page, not a Next.js route change. Real routes (`src/app/*/page.tsx`: `about`, `contact`, `login`, `register`, `dashboard`) are thin/marketing pages separate from this shell. Keep this in mind before assuming a feature needs a new route.

### Auth: cookie session, and middleware does NOT check it

`src/middleware.ts` only rate-limits `/api/*` (60 req/min general, 10 req/15min on `/api/auth/login|register`) — despite `docs/decisions.md` (ADR-001) claiming "Middleware for auth protection," there is no auth check in middleware. Every API route is individually responsible for calling `getUserFromRequest()` / `verifyAuth()` from `src/lib/auth-helpers.ts`. Sessions are signed JWTs (`src/lib/session.ts`, `jose`) in an HttpOnly cookie (`interviewlab_session`); a legacy `x-user-id` header path was deliberately removed as a spoofing risk — don't reintroduce a header-based identity shortcut.

### Subscription tiers are enforced ad hoc per feature, and checkout is fake

`src/lib/pricing.ts` is the single source of truth for tier definitions/limits (free/starter/pro — ₱0/₱499/₱999). `src/lib/subscription-guard.ts` exposes one `checkXAccess(tier, usageCount)` function per feature (interviews, resumes, cover letters, practice tests) — each API route that gates a feature calls the matching check itself; there's no central middleware for this either. `POST /api/subscription/checkout` does **not** call Stripe — it directly writes the `Subscription` row and bumps `user.subscriptionTier` (see the `// Direct upgrade (no Stripe)` comment). The Prisma `Subscription`/`Payment` models have `stripe*` fields reserved for when a real processor is wired in, but none is connected today.

### Public marketing vs. authenticated app are currently inconsistent on pricing — by design, mid-transition

The public landing page (`src/components/interview-lab/LandingPage.tsx`) and root metadata (`src/app/layout.tsx`) were repositioned to present Interview Lab as a 100%-free companion product to **Project Amazon PH Academy** (a separate paid course platform, repo `projectamazonph/amph-v2`, ₱2,999–₱9,999 tiers) — no pricing tiers are shown pre-login. The authenticated app still has the full paid-tier system live: `PricingPage.tsx`, `subscription-guard.ts`, the checkout/webhook/manage routes, and admin tier controls. Don't assume one reflects the other; if asked to make the whole product free, that requires touching the guard checks, `PricingPage.tsx`, and the Prisma tier fields, not just marketing copy.

### AI integration is split across two unrelated systems

- `POST /api/ai/coach` (interview answer scoring) calls the real `z-ai-web-dev-sdk` (`ZAI.create()`), with its system prompt inlined in the route file.
- `POST /api/ai/resume-review`, `/api/ai/cover-letter`, `/api/ai/assessment-score` instead call `BrowserLLMIntegration` (`src/lib/browser-llm-integration.ts`) — a singleton marked `"use client"` but imported and invoked from server route handlers. It attempts `window.ai` (rarely available server-side) and falls back to rule-based/templated JSON. Every one of these routes also has a hardcoded JSON fallback object in its own `catch` block, so a broken AI call still returns a plausible-looking response rather than an error. When touching resume/cover-letter/assessment AI behavior, check both the `BrowserLLMIntegration` logic and the route's catch-block fallback — they can silently diverge.
- `docs/07-guardrails.md` defines the honesty/fairness rules the prompts must encode (no fabricated experience, no protected-characteristic advice, no job/income guarantees). New AI prompts should follow that doc, not just the coach route's inline example.

### Design system: "Ethereal Glass"

OLED-black (`#050505`) background with blurred gradient orbs, glass-morphism cards (`backdrop-blur-xl`, double-bezel borders). Reusable primitives live in `src/components/ui/glass-*.tsx` (`GlassCard`, `GlassButton`, `GlassBadge`, `GlassInput`) — prefer these over the plain shadcn `card.tsx`/`button.tsx` variants for anything in `components/interview-lab/`. Icons are Phosphor (`@phosphor-icons/react`) at `weight="light"` only — never a heavier weight or a different icon set. Fonts are Space Grotesk (headings, `--font-clash`) and Plus Jakarta Sans (body, `--font-plus-jakarta`) — never Inter/Roboto. Motion uses Framer Motion with shared variants/easing curves from `src/lib/animations.ts` (`fadeUpVariants`, `staggerContainer`, `cardHoverVariants`, `ease-premium`), not ad hoc transitions.
