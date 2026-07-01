# Architecture — Interview Lab

**Version:** 1.0 | **Updated:** 2026-07-02

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser                                │
├──────────────────────────────────────────────────────────────┤
│  Next.js 15 App Router — Standalone Output (Vercel)          │
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
/(auth)/login               → Login
/(auth)/register            → Registration

/(dashboard)/
├── /                       → User dashboard (progress, stats)
├── interviews/             → AI Mock Interviews
│   ├── /                   → Role selection
│   ├── [roleId]            → Start interview
│   └── [roleId]/[sessionId] → Active interview + scoring
├── resume/                 → Resume Lab
│   └── /                   → Upload, review, improve
├── cover-letter/           → Cover Letter Studio
│   └── /                   → Generate, customize, download
├── practice-tests/         → Practice Tests
│   ├── /                   → Test selection
│   └── [testId]            → Active test + results
├── learning/               → Learning Paths
│   ├── /                   → Path selection
│   └── [pathId]            → Path content + progress
├── downloads/              → Download Center (tier-gated)
└── profile/               → User profile + settings

/(admin)/
├── dashboard              → Analytics
├── users/                 → User management
├── questions/             → Question bank management
└── content/              → Content management
```

---

## Database Schema

### Core Entities

| Entity | Key Fields | Relations |
|--------|------------|-----------|
| **User** | id, email, name, password, role, tier | → Interview[], Resume[], CoverLetter[] |
| **Interview** | id, userId, role, score, answers, feedback, startedAt, completedAt | → User |
| **Resume** | id, userId, content, analysis, improvements, createdAt | → User |
| **CoverLetter** | id, userId, role, tone, content, createdAt | → User |
| **TestAttempt** | id, userId, type, score, answers, duration, completedAt | → User |
| **Question** | id, role, difficulty, text, idealAnswer, category | |
| **Progress** | id, userId, pathId, moduleId, completed, score | → User |

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
User starts interview → POST /api/interviews/start
  → Load role-specific prompt + questions
  → Initialize Z AI SDK session
  → Stream AI responses (real-time chat)
  → Each answer → AI scores + gives feedback
  → Interview complete → POST /api/interviews/complete
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
[Next.js 15 Standalone Output]
  - SSR pages (landing, interviews, resume)
  - API Routes (interview sessions, auth, exports)
  - Static assets (downloads, images, fonts)
        ↓
[SQLite Database] (dev)
[PostgreSQL] (planned production)
        ↓
[Z AI SDK Cloud API]
  - Interview coaching
  - Resume analysis
  - Content generation
```
