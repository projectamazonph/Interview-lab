# Interview Lab — Remediation Plan & Handoff

**Date:** 2026-07-17
**PR #4 merged at:** 2026-07-17T05:33:17Z (commit `190b3be`)

---

## Product context

Interview Lab is a **free companion** to [Project Amazon PH Academy](https://projectamazon.ph). All features are available to all users — no paid tiers, no subscription gating.

---

## ✅ Completed (PR #4 + follow-up)

| Finding | Fix |
|---|---|
| FieldButton missing `outline` variant | Added outline variant to `fieldButtonVariants` |
| Subscription checkout bypass | Removed subscription API endpoints entirely |
| Subscription manage `change` action | Removed subscription API endpoints entirely |
| JWT fallback secret | Requires 32+ char `JWT_SECRET` at startup |
| Questions API unauthenticated | Server-side auth + tier checks; strips premium fields for free tier |
| Guides API unauthenticated | Server-side auth + tier checks; locks content behind entitlement |
| Verification token logged | Removed `console.log`; async/await DB calls |
| Rate limiter non-atomic | Wrapped in `db.$transaction`; fail-closed |
| Fabricated aggregate rating | Removed from structured data |
| Pre-existing FieldBadge/Button type errors | Added missing variants |
| Subscription tier gating | `subscription-guard.ts` always returns `allowed: true` |
| Subscription endpoints | Removed `src/app/api/subscription/` entirely |
| Pricing page / UpgradeModal / SubscriptionBanner | Stubbed to no-op (kept imports compiling) |
| README pricing table | Replaced with "Free, always" notice |

---

## 🔴 Phase 1 — Must fix before public launch

### P1.1 — Server AI adapter
**Files:** `src/lib/browser-llm-integration.ts`, `src/app/api/ai/*/route.ts` (4 routes)
**Problem:** The `BrowserLLMIntegration` module is marked `"use client"` and depends on `window.ai`. Server routes import it and silently fall back to rule-based templates that fabricate experience claims.
**Fix:**
- Create `src/lib/server-ai.ts` with:
  - Schema-validated structured output (zod)
  - Explicit provider configuration (OpenAI/Anthropic)
  - Timeouts and abort handling
  - Input length limits
  - Per-user quota enforcement
  - Truthfulness checks
- Replace all `BrowserLLMIntegration` imports in API routes
- Add privacy/provider disclosure to UI

### P1.2 — Client auth from server session
**Files:** `src/lib/auth-context.tsx`
**Problem:** Auth state restored from `localStorage` (modifiable); no server validation on startup.
**Fix:**
- Add `GET /api/auth/session` endpoint returning authenticated user from cookie
- On app mount, validate session via server endpoint instead of reading localStorage
- Keep localStorage as a cache layer with server re-validation
- Ensure logout clears both cookie and localStorage atomically

### P1.3 — ESLint fixes & re-enablement
**Files:** `eslint.config.mjs`, `src/app/page.tsx`, `src/components/interview-lab/AdminPanel.tsx`, `PricingPage.tsx`, `QuestionBank.tsx`
**Problem:** 35 rules disabled; 9 pre-existing ESLint errors block CI.
**Fix:**
- Fix the 9 ESLint errors across 4 files (setState in effects, hoisting, const reassignment)
- Re-enable important rules incrementally: `no-unused-vars`, `no-console`, `react-hooks/exhaustive-deps`, `no-fallthrough`
- Remove blanket `off` overrides
- Add `lint-staged` pre-commit hook

---

## 🟡 Phase 2 — Required within next development cycle

### P2.1 — Rate limiter upgrade
**Files:** `src/middleware.ts`, `src/lib/rate-limit.ts`
**Problem:** In-memory `Map` in middleware doesn't persist across serverless instances; IP parsing trusts unvalidated `x-forwarded-for`.
**Fix:**
- Replace in-memory Map with Upstash/Redis for middleware rate limiting
- Add trusted proxy chain configuration
- Add `Retry-After` header with actual reset timestamp

### P2.2 — Prisma schema hardening
**Files:** `prisma/schema.prisma`
**Changes needed:**
- Convert string fields to enums: `role`, `difficulty`, `status`, `tier`, `billingPeriod`, `currency`, `fileType`, `subscriptionStatus`, `paymentStatus`
- Add Prisma `Json` fields for: `toolsKnown`, `weakAreas`, `transcript`, `rubricBreakdown`, `truthFlags`, `answerKey`, `metadata`
- Add indexes on: `userId`, `sessionId`, `questionId`, `expiresAt`, `resetTime`, `createdAt`
- Model assessment attempts properly (user, timestamps, answers, score, rubrics, status, AI version)

### P2.3 — Download route decomposition
**Files:** `src/app/api/downloads/[id]/route.ts` (53 lines — earlier "879-line" estimate was inaccurate)
**Problem:** Route handles auth, tier checks, multiple document formats, database access, and analytics.
**Fix:**
- Extract document builders: `src/lib/documents/pdf.ts`, `docx.ts`, `xlsx.ts`, `text.ts`
- Extract template renderers: `src/lib/templates/amazon-training.ts`
- Keep route focused on auth, routing, and response

### P2.4 — Export endpoint size limits
**Files:** `src/app/api/export/route.ts`
**Problem:** No input size validation; PDF silently truncates at page bottom.
**Fix:**
- Add content length limits
- Replace handcrafted PDF with proper pagination (e.g., `pdf-lib` or `pdfkit` with page break support)
- Add request body size validation middleware

### P2.5 — Add test coverage thresholds
**Files:** `vitest.config.ts`, `__tests__/`
**Problem:** Coverage configuration exists but has no minimum thresholds; excludes pages, layouts, and shared UI.
**Fix:**
- Set per-file coverage thresholds (e.g., 60% lines, 50% branches)
- Remove blanket excludes for components
- Add integration tests for auth flows, onboarding, interviews, resume gen, admin
- Add browser tests for critical user journeys

### P2.6 — Operational documentation
**Problem:** README previously documented Bun runtime but CI uses npm; described SQLite but schema is PostgreSQL. (README corrected 2026-07-19; standalone output already in `next.config.ts`.)
**Fix:**
- Standardize on one package manager (npm, given CI/Vercel use it)
- Update README to reflect PostgreSQL-only schema
- Add `output: "standalone"` to `next.config.ts`
- Document required env vars with descriptions
- Add setup/teardown scripts for development

---

## ⚪ Phase 3 — Before public launch gate

### P3.1 — Privacy & legal
- Add privacy policy page with data retention and account deletion
- Add AI provider disclosure (what data is sent to third-party APIs)
- Resolve license contradiction (GPL v3 vs "Private, all rights reserved")
- Add cookie consent banner
- Add terms of service page

### P3.2 — Honest structured data
- Remove `offers.price: "0"` from structured data if product is truly free (or add proper "Free" offer)
- Add real user review/rating system before claiming ratings

### P3.3 — Security hardening
- Session penetration tests
- Authorization penetration tests on all API routes
- Add `helmet`-style security headers
- Rate limit all API endpoints consistently
- Add input validation middleware for all POST/PUT routes

### P3.4 — Operational readiness
- Error monitoring (Sentry or similar)
- Load tests on AI, export, and download endpoints
- Accessibility audit (WCAG 2.1 AA)
- Add health check endpoint (`GET /api/health`)
- Add structured logging (not just `console.log`)
- Database backup and restore procedure

---

## 📊 Summary of remaining work

| Phase | Items | Estimated effort |
|---|---|---|
| 🔴 Phase 1 (blockers) | 3 items | 2–3 sprints |
| 🟡 Phase 2 (cycle) | 6 items | 4–6 sprints |
| ⚪ Phase 3 (launch gate) | 4 items | 2–3 sprints |

---

## 📝 Handoff notes

### Current branch state
- `main` at commit `190b3be` with PR #4 merged
- Subscription system stubbed (not removed) to keep imports compiling
- 3 stub files created: `PricingPage.tsx`, `UpgradeModal.tsx`, `SubscriptionBanner.tsx`

### Key architecture decisions to carry forward
1. **Auth:** JWT in HttpOnly cookies with DB re-verification on every request (keep this pattern)
2. **Tier enforcement:** All subscription guard functions return `allowed: true` — product is free
3. **Rate limiting:** The `db.$transaction` pattern is correct for persistent storage; middleware needs Redis/Upstash for serverless
4. **AI:** Build a proper server adapter rather than trying to fix the client-side `BrowserLLMIntegration`

### Files most likely to conflict with future work
- `src/lib/browser-llm-integration.ts` — will be replaced entirely by P1.1
- `src/app/api/downloads/[id]/route.ts` — needs full decomposition (P2.3)
- `prisma/schema.prisma` — needs migration (P2.2)
- `eslint.config.mjs` — needs rules re-enabled (P1.3)
- `src/lib/auth-context.tsx` — needs session endpoint (P1.2)

### Stub files (to be removed when components are refactored)
- `src/components/interview-lab/PricingPage.tsx`
- `src/components/interview-lab/UpgradeModal.tsx`
- `src/components/interview-lab/SubscriptionBanner.tsx`
- `src/lib/use-subscription.ts`
