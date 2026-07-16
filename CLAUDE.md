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

Test files are split across two runners plus some live-integration tests, and the package.json `test`/`test:api`/`test:components` scripts (plain `vitest run`) choke on the 7 `__tests__/api/*.test.ts` files that import from `'bun:test'` instead of `'vitest'` (`Cannot bundle Node.js built-in "bun:test"`). Verified working invocations:

```bash
bun test __tests__/api/                        # 218 pass, 38 fail — the 38 are 4 live-integration
                                                 # files below; every in-memory unit test passes
npx vitest run __tests__/components             # 44 pass — needs jsdom (localStorage etc.), which
                                                 # bun's default test env doesn't provide, so this one stays on vitest

# Single file / single test — bun's runner also understands plain vitest imports (describe/it/expect),
# just not vi.mock, so any single __tests__/api file works under bun:
bun test __tests__/api/subscription.test.ts
bun test __tests__/api/subscription.test.ts -t "some test name"
```

`__tests__/api/auth.test.ts`, `user-paths.test.ts`, `questions-interview-ai.test.ts`, and `resources.test.ts` are the 4 **live integration tests** inside `__tests__/api/` — they `fetch()` `http://localhost:3000` directly and need `npm run dev` running first (plus `__tests__/run-api-tests.js` and `__tests__/stress/stress-test.ts`, run directly with node, not through a test runner). Don't run these to check "does my change break tests"; the `bun test __tests__/api/` + `npx vitest run __tests__/components` pair above is the real regression suite (262 tests, matches the count README.md cites).

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
