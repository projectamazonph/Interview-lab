# Architecture — Interview Lab

**Version:** 1.1 | **Updated:** 2026-07-16 (corrected against the actual implementation — see `CLAUDE.md` for the verification notes)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser                                │
├──────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router — Standalone Output (Vercel)           │
│                                                              │
│  ┌─────────────────────────┐  ┌───────────────────────────┐  │
│  │      Client Layer       │  │      Server Layer          │  │
│  │                         │  │                            │  │
│  │ • JWT Auth Cache (LS)   │  │ • Prisma ORM + PostgreSQL │  │
│  │ • Ethereal Glass UI     │  │ • Z AI SDK (coach route)  │  │
│  │ • Interview Flows       │  │ • BrowserLLMIntegration   │  │
│  │ • Framer Motion Anim.   │  │   (resume/cover/assess.)  │  │
│  │ • React state/context   │  │ • JWT (jose) Auth         │  │
│  │   (no external store)   │  │ • Export Pipeline         │  │
│  └─────────────────────────┘  │ • API Routes              │  │
│                                └───────────────────────────┘  │
│  Tailwind CSS v4 · Space Grotesk + Plus Jakarta Sans          │
│  Phosphor Icons (light weight) · Framer Motion               │
└──────────────────────────────────────────────────────────────┘
```

No state-management library (Zustand, Redux, etc.) is installed or used — client state is plain React state/context (`src/lib/auth-context.tsx`).

---

## Route Structure

**This is not a multi-route app.** `src/app/page.tsx` is a single client component acting as a state machine, not a router. Logged-out users see `LandingPage` → `AuthScreen`; once authenticated, `AppLayout` wraps a `renderView()` switch keyed by an `ActiveView` string (`dashboard`, `interview`, `resume`, `cover-letter`, `assessments`, `downloads`, `guides`, `admin`, `pricing`, …). There is no `/dashboard/interviews/[roleId]/[sessionId]` URL — switching features is a state change inside this one page, not a Next.js navigation. (An earlier version of this doc described a nested route tree; it never matched the implementation.)

Actual Next.js routes:

```
/                → src/app/page.tsx — the state-machine shell described above
/login           → thin login page
/register        → thin registration page
/about           → static marketing page
/contact         → static marketing page
/dashboard       → separate thin page (not the same as the "dashboard" ActiveView inside `/`)

/api/*           → all backend logic — see CLAUDE.md for the route list
```

---

## Database Schema

### Core Entities

The table below is a simplified read of the real model names in `prisma/schema.prisma` — see that file for the authoritative field list (it also has `AgentRun`, `GuideProgress`, `Subscription`, `Payment`, `VerificationToken`, `RateLimitEntry`, `AppSetting`, `Download`, `Guide`, `Assessment`, and `QuestionAttempt`, none of which are listed here for brevity):

| Entity | Key Fields | Relations |
|--------|------------|-----------|
| **User** | id, email, name, passwordHash, subscriptionTier, isAdmin, emailVerified | → UserProfile, Resume[], CoverLetter[], InterviewSession[], Subscription |
| **InterviewSession** | id, userId, mode, targetRole, overallScore, transcript, startedAt, completedAt | → User, QuestionAttempt[] |
| **QuestionAttempt** | id, sessionId, questionId, userAnswer, aiFeedback, score, rubricBreakdown | → InterviewSession, Question |
| **Resume** | id, userId, originalText, targetRole, score, improvedVersion, truthFlags | → User |
| **CoverLetter** | id, userId, jobDescription, tone, generatedLetter, truthFlags | → User |
| **Question** | id, role, difficulty, type, skillArea, question, sampleAnswer, status | → QuestionAttempt[] |

### Auth Flow

```
Login → POST /api/auth/login (client fetch from src/app/login/page.tsx, not a Server Action)
  → Validate credentials (bcrypt)
  → Generate JWT (jose, 24h expiry — src/lib/session.ts)
  → Set HttpOnly cookie (interviewlab_session; httpOnly, secure in prod, sameSite=lax)
  → Cache token in localStorage (client-side fallback)
  → Client-side state transition to the authenticated view (src/app/page.tsx)

Every API route → calls getUserFromRequest()/verifyAuth() (src/lib/auth-helpers.ts) individually
  → src/middleware.ts does NOT check auth — it only rate-limits /api/* (60/min general,
    10/15min on /api/auth/login|register); there is no middleware-level auth gate
```

### AI Coaching Flow (Z AI SDK) — coach route only

```
User submits an interview answer → POST /api/ai/coach
  → Inline system prompt (interview coach persona, src/app/api/ai/coach/route.ts)
  → ZAI.create() (z-ai-web-dev-sdk) → single request/response, not a streamed chat
  → Returns score + rubric breakdown + follow-up question as JSON
  → Client saves the attempt
```

Resume review, cover letter, and assessment scoring (`/api/ai/resume-review`, `/api/ai/cover-letter`, `/api/ai/assessment-score`) do **not** use Z AI SDK — they call `BrowserLLMIntegration` (`src/lib/browser-llm-integration.ts`), a `"use client"`-tagged class invoked from the server route, with a hardcoded JSON fallback in each route's `catch` block.

---

## Export Pipeline

```
User requests download (resume/cover letter/report)
  → POST /api/export (API route, not a Server Action)
  → Choose format:
     • DOCX → docx library → structured Word document
     • PDF → pdfkit → formatted PDF with styling
     • Excel → exceljs → data tables + formatting
  → Return file → Browser download
```

---

## Design System Tokens

The real, authoritative tokens live in `src/app/globals.css` (e.g. `--color-pa-navy: #050505`, `--color-glass-border`, `--background`, `.ease-premium`) — the actual variable names differ from an earlier draft of this doc. Concept (OLED black background, glass-morphism borders, Indigo/violet/emerald/amber/rose accents, Space Grotesk + Plus Jakarta Sans, custom cubic-bezier motion curves) still holds; read `globals.css` directly rather than this doc for exact values, so this section doesn't drift out of sync again.

---

## Deployment Architecture

```
[Vercel Edge Network]
        ↓
[Next.js 16 Standalone Output]
  - SSR pages (landing, about, contact, thin dashboard/login/register pages)
  - The authenticated app itself: a single client-rendered page (src/app/page.tsx)
  - API Routes (interview sessions, auth, exports, subscription, admin, …)
  - Static assets (downloads, images, fonts)
        ↓
[PostgreSQL] — via DATABASE_URL, same provider for local dev and production (no SQLite)
        ↓
[Z AI SDK Cloud API] — interview coaching only (POST /api/ai/coach)
[BrowserLLMIntegration] — resume analysis, cover letters, assessment scoring (rule-based/templated, not Z AI)
```
