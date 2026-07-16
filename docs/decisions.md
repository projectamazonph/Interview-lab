# Architecture Decision Records — Interview Lab

**Format:** Michael Nygard's ADR template

---

## ADR-001: Next.js App Router (Standalone Output)

**Status:** ✅ ACCEPTED — **superseded in part, see note**

**Context:** Need a React framework with SSR, API routes, and Vercel deployment support. The app requires rich interactivity for interview sessions alongside static marketing pages.

**Decision:** Use Next.js with App Router in standalone output mode for Vercel deployment. (Originally written against v15; the repo has since moved to Next.js 16 — see `package.json`.)

**Consequences:**
- ✅ Server Components for landing/marketing pages (fast, SEO)
- ✅ API Routes for interview sessions, auth, exports
- ✅ Standalone output optimized for Vercel
- ⚠️ **Correction:** `src/middleware.ts` only rate-limits `/api/*` — it does not check auth. Every API route calls `getUserFromRequest()`/`verifyAuth()` (`src/lib/auth-helpers.ts`) individually; there is no middleware-level auth gate. The "Middleware for auth protection" consequence originally listed here never matched the implementation.

---

## ADR-002: PostgreSQL via Prisma

**Status:** ✅ ACCEPTED — supersedes the original SQLite-for-dev plan

**Context:** Rapid development requires zero-config database. Production needs concurrent access and durability.

**Original decision (no longer current):** SQLite for development, PostgreSQL planned for production migration.

**Current state:** `prisma/schema.prisma` has `provider = "postgresql"` with no SQLite fallback — `DATABASE_URL` (a Postgres connection string) is required for local dev too, not just production.

**Consequences:**
- ✅ One database engine everywhere — no dev/prod schema drift
- ✅ Type-safe queries via Prisma
- ⚠️ Local dev now needs a reachable Postgres instance (or a service like Neon/Supabase) instead of a zero-config SQLite file

---

## ADR-003: Custom JWT Auth with Dual Storage

**Status:** ✅ ACCEPTED

**Context:** Need secure auth without external providers. Mobile users may face cookie issues — need fallback.

**Decision:** 
- Primary: HttpOnly cookies (jose library)
- Fallback: localStorage token cache
- Role + tier embedded in JWT payload

**Consequences:**
- ✅ XSS/CSRF protection via cookies
- ✅ Graceful degradation for mobile issues
- ⚠️ Two auth paths to maintain and test

---

## ADR-004: Ethereal Glass Design System

**Status:** ✅ ACCEPTED

**Context:** The app serves a competitive market (interview prep). Premium, distinctive design is a key differentiator. Generic Tailwind/shadcn would blend in.

**Decision:** Custom Ethereal Glass design system:
- OLED black backgrounds with radial gradient orbs
- Glass-morphism cards (backdrop-blur-xl, double-bezel borders)
- Space Grotesk + Plus Jakarta Sans typography
- Phosphor Icons (light weight)
- Framer Motion animations with custom curves

**Consequences:**
- ✅ Distinctive premium brand identity
- ✅ Memorable user experience drives retention
- ⚠️ Custom components require more maintenance
- ⚠️ Glass effects can affect performance on low-end devices

---

## ADR-005: Z AI SDK for Coaching Features

**Status:** ✅ ACCEPTED — **implementation only partially matches this decision, see note**

**Context:** Need reliable AI integration for interview coaching, resume analysis, and content generation. Must handle streaming, scoring, and structured output.

**Decision:** Use Z AI Web Dev SDK for all AI-powered features:
- Streaming interview conversations
- Real-time scoring and feedback
- Resume extraction and analysis
- Cover letter generation

**Current state:** Only `POST /api/ai/coach` (interview scoring) actually calls `z-ai-web-dev-sdk`. `POST /api/ai/resume-review`, `/api/ai/cover-letter`, and `/api/ai/assessment-score` instead call `BrowserLLMIntegration` (`src/lib/browser-llm-integration.ts`) — a `"use client"`-tagged singleton invoked from server route handlers, which tries `window.ai` (rarely present server-side) and falls back to rule-based/templated JSON. Each of those three routes also has its own hardcoded JSON fallback in its `catch` block. "Single AI provider for all features" is not currently true.

**Consequences:**
- ✅ Built-in streaming support (coach route)
- ⚠️ Vendor lock-in on the coach route — migration path unclear
- ⚠️ Usage costs scale with user base
- ⚠️ Resume review / cover letter / assessment scoring do not depend on Z AI at all today, and can silently return templated output on any error

---

## ADR-006: Framer Motion for Animation

**Status:** ✅ ACCEPTED

**Context:** Need premium, smooth animations for glass UI components — scroll reveals, staggered list entries, hover physics, page transitions.

**Decision:** Framer Motion with custom cubic-bezier curves (`ease-premium`, `ease-spring`, `ease-out-heavy`) for all animations.

**Consequences:**
- ✅ Most mature React animation library
- ✅ Scroll-triggered animations (IntersectionObserver built-in)
- ✅ Layout animations for list/dashboard transitions
- ⚠️ Bundle size impact (~15KB gzip)
