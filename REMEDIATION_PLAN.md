# Interview Lab — Remediation Plan & Handoff

**Date:** 2026-07-17
**PR #4 merged at:** 2026-07-17T05:33:17Z (commit `190b3be`)

---

## ✅ Completed in PR #4

| Finding | Fix |
|---|---|
| FieldButton missing `outline` variant | Added outline variant to `fieldButtonVariants` |
| Subscription checkout bypass | Returns 503 "Paid plans not available" |
| Subscription manage `change` action | Blocked for paid tier upgrades |
| JWT fallback secret | Requires 32+ char `JWT_SECRET` at startup |
| Questions API unauthenticated | Server-side auth + tier checks; strips premium fields for free tier |
| Guides API unauthenticated | Server-side auth + tier checks; locks content behind entitlement |
| Verification token logged | Removed `console.log`; async/await DB calls |
| Rate limiter non-atomic | Wrapped in `db.$transaction`; fail-closed |
| Fabricated aggregate rating | Removed from structured data |
| Pre-existing FieldBadge/Button type errors | Added missing variants |

---

## 🔴 Phase 1 — Must fix before paid launch

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

### P1.2 — Real payment integration
**Files:** `src/app/api/subscription/webhook/route.ts`, `src/app/api/subscription/checkout/route.ts`
**Problem:** Webhook is a placeholder (no signature verification, no subscription sync). Price IDs are empty strings.
**Fix:**
- Configure Stripe price IDs in environment
- Implement signed webhook handler
- Add `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` events
- Use webhook as the sole subscription activation path
- Add `idempotencyKey` to payment records
- Wrap billing mutations in `db.$transaction`

### P1.3 — Subscription record consistency
**Files:** `src/lib/pricing.ts`, `prisma/schema.prisma`
**Problem:** `User.subscriptionTier` and `Subscription.tier` are dual sources of truth; mutations aren't transactional.
**Fix:**
- Designate `Subscription.tier` as the single source of truth
- Derive `User.subscriptionTier` via a view or computed field
- Wrap all billing mutations in `db.$transaction`
- Add Prisma enums for `tier`, `status`, `billingPeriod`

### P1.4 — ESLint fixes & re-enablement
**Files:** `eslint.config.mjs`, `src/app/page.tsx`, `src/components/interview-lab/AdminPanel.tsx`, `PricingPage.tsx`, `QuestionBank.tsx`
**Problem:** 35 rules disabled; 9 pre-existing ESLint errors block CI.
**Fix:**
- Fix the 9 ESLint errors across 4 files (setState in effects, hoisting, const reassignment)
- Re-enable important rules incrementally: `no-unused-vars`, `no-console`, `react-hooks/exhaustive-deps`, `no-fallthrough`
- Remove blanket `off` overrides
- Add `lint-staged` pre-commit hook

### P1.5 — Client auth from server session
**Files:** `src/lib/auth-context.tsx`
**Problem:** Auth state restored from `localStorage` (modifiable); no server validation on startup.
**Fix:**
- Add `GET /api/auth/session` endpoint returning authenticated user from cookie
- On app mount, validate session via server endpoint instead of reading localStorage
- Keep localStorage as a cache layer with server re-validation
- Ensure logout clears both cookie and localStorage atomically

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
**Files:** `src/app/api/downloads/[id]/route.ts` (879 lines)
**Problem:** Monolithic route handles auth, tier checks, 4 document formats, database access, and analytics.
**Fix:**
- Extract document builders: `src/lib/documents/pdf.ts`, `docx.ts`, `xlsx.ts`, `text.ts`
- Extract template renderers: `src/lib/templates/amazon-training.ts`
- Keep route focused on auth, routing, and response

### P2.4 — Export endpoint size limits
**Files:** `src/app/api/export/route.ts`
**Problem:** No input size validation; PDF silently truncates at page bottom.
**Fix:**
- Add content length limits matching subscription tier
- Replace handcrafted PDF with proper pagination (e.g., `pdf-lib` or `pdfkit` with page break support)
- Add request body size validation middleware

### P2.5 — Add test coverage thresholds
**Files:** `vitest.config.ts`, `__tests__/`
**Problem:** Coverage configuration exists but has no minimum thresholds; excludes pages, layouts, and shared UI.
**Fix:**
- Set per-file coverage thresholds (e.g., 60% lines, 50% branches)
- Remove blanket excludes for components
- Add integration tests for auth flows, onboarding, interviews, resume gen, admin, and plan enforcement
- Add browser tests for critical user journeys

### P2.6 — Operational documentation
**Problem:** README documents Bun runtime but CI uses npm; describes SQLite but schema is PostgreSQL; no standalone output config.
**Fix:**
- Standardize on one package manager (npm, given CI/Vercel use it)
- Update README to reflect PostgreSQL-only schema
- Add `output: "standalone"` to `next.config.ts`
- Document required env vars with descriptions
- Add setup/teardown scripts for development

---

## ⚪ Phase 3 — Before paid launch gate

### P3.1 — Privacy & legal
- Add privacy policy page with data retention and account deletion
- Add AI provider disclosure (what data is sent to third-party APIs)
- Resolve license contradiction (GPL v3 vs "Private, all rights reserved")
- Add cookie consent banner
- Add terms of service page

### P3.2 — Honest metadata
- Remove `offers.price: "0"` from structured data if paid tiers exist
- Add proper pricing schema if billing is active
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
| 🔴 Phase 1 (blockers) | 5 items | 3–4 sprints |
| 🟡 Phase 2 (cycle) | 6 items | 4–6 sprints |
| ⚪ Phase 3 (launch gate) | 4 items | 2–3 sprints |

---

## 📝 Handoff notes

### Current branch state
- `main` at commit `190b3be` with PR #4 merged
- The PR branch `fix/critical-security-and-build-issues` can be deleted

### Known CI state
- ESLint: 9 pre-existing errors (4 files untouched by PR #4)
- Vercel: fails on pre-existing analytics route runtime error
- Neither is a regression from PR #4

### Key architecture decisions to carry forward
1. **Auth:** JWT in HttpOnly cookies with DB re-verification on every request (keep this pattern)
2. **Tier enforcement:** Server-side `subscription-guard.ts` helpers are the right pattern — extend them, don't duplicate
3. **Rate limiting:** The `db.$transaction` pattern is correct for persistent storage; middleware needs Redis/Upstash for serverless
4. **AI:** Build a proper server adapter rather than trying to fix the client-side `BrowserLLMIntegration`

### Files most likely to conflict with future work
- `src/lib/browser-llm-integration.ts` — will be replaced entirely by P1.1
- `src/app/api/downloads/[id]/route.ts` — needs full decomposition (P2.3)
- `prisma/schema.prisma` — needs migration (P2.2)
- `eslint.config.mjs` — needs rules re-enabled (P1.4)
- `src/lib/auth-context.tsx` — needs session endpoint (P1.5)
