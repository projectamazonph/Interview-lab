# Architecture — Interview Lab

**Version:** 1.1 | **Updated:** 2026-07-16

> **Known drift:** the subscription endpoints below (`/api/subscription/status`,
> `/api/subscription/usage`) do not exist — the product has no paid tiers.
> `POST /api/export` only produces DOCX/PDF; Excel export lives in a separate,
> unrelated route (`/api/downloads/[id]`), not in the export pipeline
> described here. See `CLAUDE.md` at the repo root for the current
> architecture.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser                                │
├──────────────────────────────────────────────────────────────┤
│  Next.js 16.1.1 App Router — Standalone Output (Vercel)       │
│                                                              │
│  ┌─────────────────────────┐  ┌───────────────────────────┐  │
│  │      Client Layer       │  │      Server Layer          │  │
│  │                         │  │                            │  │
│  │ • JWT Auth Cache (LS)   │  │ • Prisma ORM + SQLite     │  │
│  │ • Ethereal Glass UI     │  │ • Z AI SDK (coaching)     │  │
│  │ • Interview Flows       │  │ • JWT (jose) Auth         │  │
│  │ • Framer Motion Anim.   │  │ • Export Pipeline         │  │
│  │ • Zustand State         │  │ • API Routes              │  │
│  └─────────────────────────┘  └───────────────────────────┘  │
│                                                              │
│  Tailwind CSS v4 · Space Grotesk + Plus Jakarta Sans          │
│  Phosphor Icons (light weight) · Framer Motion               │
└──────────────────────────────────────────────────────────────┘
```

---

## Route Structure

```
/                           → Landing page
/login                      → Login
/register                   → Registration
/dashboard                  → User dashboard (progress, stats)
/about                      → About page
/contact                    → Contact page
```

### API Routes

```
POST   /api/auth/register           → User registration
POST   /api/auth/login              → User login
POST   /api/auth/logout             → User logout
POST   /api/auth/verify-email       → Email verification
GET    /api/questions               → List questions (role, difficulty filters)
GET    /api/questions/count         → Question count
POST   /api/interview               → Create interview session
GET    /api/interview/[id]          → Get interview session
POST   /api/interview/[id]/complete → Complete interview
GET    /api/dashboard               → Dashboard aggregation
GET    /api/profile                 → Get user profile
PUT    /api/profile                 → Update user profile
POST   /api/resume                  → Upload resume
GET    /api/resume/[id]             → Get resume
POST   /api/cover-letter            → Generate cover letter
GET    /api/cover-letter/[id]       → Get cover letter
GET    /api/assessments             → List assessments
GET    /api/assessments/[id]        → Get assessment
GET    /api/guides                  → List guides
GET    /api/guides/[id]             → Get guide
POST   /api/guides/progress        → Update guide progress
GET    /api/downloads              → List downloads
GET    /api/downloads/[id]         → Get download
POST   /api/export                 → Export DOCX/PDF/Excel
POST   /api/ai/coach               → AI interview coach
POST   /api/ai/resume-review        → AI resume review
POST   /api/ai/cover-letter         → AI cover letter generation
POST   /api/ai/assessment-score     → AI assessment scoring
GET    /api/subscription/status     → Get subscription status
GET    /api/subscription/usage      → Get usage limits
POST   /api/subscription/checkout   → Create checkout session
POST   /api/subscription/webhook    → Stripe webhook
POST   /api/subscription/manage     → Manage subscription
GET    /api/admin/questions         → Admin: manage questions
GET    /api/admin/analytics         → Admin: analytics
```

---

## Database Schema

### Core Entities

| Entity | Key Fields | Relations |
|--------|------------|-----------|
| **User** | id, email, name, passwordHash, subscriptionTier, isAdmin, emailVerified | → UserProfile, Resume[], CoverLetter[], InterviewSession[], AgentRun[], GuideProgress[], Subscription, Payment[] |
| **UserProfile** | id, userId, targetRole, experienceLevel, toolsKnown, weakAreas, onboardingDone | → User |
| **Question** | id, role, difficulty, type, skillArea, question, whyEmployersAsk, strongAnswerPoints, weakAnswerWarnings, sampleAnswer, answerFormat, timeLimit, status | → QuestionAttempt[] |
| **InterviewSession** | id, userId, mode, targetRole, overallScore, transcript | → User, QuestionAttempt[] |
| **QuestionAttempt** | id, sessionId, questionId, userAnswer, aiFeedback, score, rubricBreakdown | → InterviewSession, Question |
| **Resume** | id, userId, originalText, targetRole, score, improvedVersion, truthFlags | → User |
| **CoverLetter** | id, userId, jobDescription, tone, generatedLetter, truthFlags | → User |
| **Assessment** | id, title, role, difficulty, description, datasetInfo, answerKey, rubric | |
| **Download** | id, title, fileType, role, fileName, accessTier, category, downloadCount | |
| **Guide** | id, title, slug, level, role, content, status | → GuideProgress[] |
| **GuideProgress** | id, userId, guideId, completed, checklist | → User, Guide |
| **AgentRun** | id, userId, agentType, input, output, safetyFlags | → User |
| **Subscription** | id, userId, tier, status, stripeCustomerId, stripePriceId, stripeSubscriptionId, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd | → User |
| **Payment** | id, userId, amount, currency, status, stripePaymentId, stripeInvoiceId, description, metadata | → User |
| **AppSetting** | key, value | |
| **VerificationToken** | id, token, email, expiresAt | |
| **RateLimitEntry** | id, key, count, resetTime | |

### Auth Flow

```
Login → Server Action
  → Validate credentials (bcrypt)
  → Generate JWT (jose, configurable expiry)
  → Set HttpOnly cookie (httpOnly, secure, sameSite=lax)
  → Cache token in localStorage (client-side fallback)
  → Redirect to dashboard

Middleware → Check HttpOnly cookie on protected routes
  → Cache check via localStorage mirror
  → If invalid/missing → redirect to login
  → If valid → attach user context → proceed
```

### AI Coaching Flow (Z AI SDK)

```
User starts interview → POST /api/interview
  → Load role-specific prompt + questions
  → Initialize Z AI SDK session
  → Stream AI responses (real-time chat)
  → Each answer → AI scores + gives feedback
  → Interview complete → POST /api/interview/[id]/complete
  → Save transcript + scores + feedback
  → Return results page
```

---

## Export Pipeline

```
User requests download (resume/cover letter/report)
  → Server Action
  → Choose format:
     • DOCX → docx library → structured Word document
     • PDF → pdfkit → formatted PDF with styling
     • Excel → exceljs → data tables + formatting
  → Return file → Browser download
```

---

## Design System Tokens

```css
/* Ethereal Glass — Design Tokens */

:root {
  /* Background */
  --bg-primary: #050505;        /* OLED black */
  --bg-glass: rgba(255,255,255,0.03);
  --bg-glass-hover: rgba(255,255,255,0.06);
  
  /* Glass Effect */
  --glass-border: rgba(255,255,255,0.06);
  --glass-border-hover: rgba(255,255,255,0.12);
  --glass-blur: blur(24px);
  
  /* Accents */
  --accent-primary: #6366f1;    /* Indigo */
  --accent-secondary: #8b5cf6;  /* Violet */
  --accent-success: #10b981;    /* Emerald */
  --accent-warning: #f59e0b;    /* Amber */
  --accent-danger: #f43f5e;     /* Rose */
  
  /* Typography */
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  
  /* Motion */
  --ease-premium: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## Deployment Architecture

```
[Vercel Edge Network]
        ↓
[Next.js 16.1.1 Standalone Output]
  - SSR pages (landing, dashboard, about, contact)
  - API Routes (auth, interview, questions, assessments, subscription, admin, ai, export, guides, downloads, resume, cover-letter, profile, dashboard)
  - Static assets (downloads, images, fonts)
        ↓
[SQLite Database] (dev)
[PostgreSQL] (production — Neon/Supabase)
        ↓
[Z AI SDK Cloud API]
  - Interview coaching
  - Resume analysis
  - Cover letter generation
  - Assessment scoring
```