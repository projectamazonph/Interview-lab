# Development Plan — Interview Lab

**Version:** 1.0 | **Status:** Active Development | **Last Updated:** 2026-07-02

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Interview Lab                          │
├──────────────────────────────────────────────────────────┤
│  Next.js 15 (App Router) + TypeScript + Bun              │
│  Tailwind CSS 4 + Ethereal Glass Design System           │
│  Framer Motion (animations)                              │
├──────────────────────┬───────────────────────────────────┤
│   Client             │   Server                          │
│                      │                                   │
│  • Auth (JWT cache)  │  • Prisma + SQLite                │
│  • Glass UI          │  • Z AI SDK (coaching)            │
│  • Interview flows   │  • Export pipeline (docx/PDF/xlsx)│
│  • Resume upload     │  • JWT auth (jose)                │
└──────────────────────┴───────────────────────────────────┘
```

---

## Phase 1: Core Platform — Auth, Database & Layout

**Status:** ✅ COMPLETE

| Task | Details |
|------|---------|
| Next.js 15 App Router scaffold | TypeScript, Tailwind v4, Bun runtime |
| Prisma schema | Users, Subscriptions, Questions, Answers, Resumes, CoverLetters |
| JWT auth system | jose + HttpOnly cookies + localStorage client cache |
| Role system | Admin, user roles with tier gating |
| Ethereal Glass design system | Theme tokens, glass components, dark mode |
| Landing page | Marketing page with feature showcase |

---

## Phase 2: AI Mock Interviews

**Status:** ✅ COMPLETE

| Task | Details |
|------|---------|
| Z AI SDK integration | Streaming interview sessions |
| Role-specific prompts | 6 VA roles with distinct interview frameworks |
| Scoring engine | Real-time AI scoring with criteria breakdown |
| Answer recording | Transcript + score persistence |
| Question bank | 264+ questions across roles and difficulty levels |

---

## Phase 3: Resume Lab & Cover Letter Studio

**Status:** ✅ COMPLETE

| Task | Details |
|------|---------|
| Resume upload (PDF/DOCX) | File parsing, text extraction |
| AI resume analysis | Extraction, truth flags, improvement suggestions |
| Cover letter generation | 3 tones (Professional/Enthusiastic/Concise) |
| Export pipeline | DOCX, PDF, Excel generation |

---

## Phase 4: Practice Tests & Learning Paths

**Status:** ✅ COMPLETE

| Task | Details |
|------|---------|
| Timed assessments | 15/30/45 min configurable tests |
| Auto-scoring | Answer key + AI-assisted grading |
| Learning paths | Beginner → Intermediate → Advanced per role |
| Progress tracking | Per-role, per-path completion tracking |

---

## Phase 5: Subscription & Payments

**Status:** ✅ COMPLETE

| Task | Details |
|------|---------|
| Tier system | Free / Starter (₱499/mo) / Pro (₱999/mo) |
| Usage limits | Per-tier quotas (interviews, resumes, etc.) |
| Download gating | Tier-based content access |
| Admin tier management | Override, trial, coupon support |

---

## Phase 6: Admin Panel

**Status:** ✅ COMPLETE

| Task | Details |
|------|---------|
| Analytics dashboard | Users, sessions, revenue, trends |
| User management | CRUD, tier changes, activity view |
| Question management | Add/edit/delete questions by role/difficulty |
| Content management | Learning paths, download resources |

---

## Phase 7: Advanced Features (Planned)

| Task | Priority | Notes |
|------|----------|-------|
| PostgreSQL migration | High | Production scale requirement |
| Video interview simulation | High | Record + AI analyze body language/tone |
| Multi-language (Taglish) | Medium | Localize interface + content |
| Peer review system | Medium | Community answer reviews |
| Company-specific tracks | Medium | Custom interviews for specific employers |
| Mobile app | Low | React Native for offline interviews |
| Job board integration | Low | OnlineJobs.ph, Upwork API |

---

## Open Questions

1. **Payments:** GCash/PayMaya integration? Stripe for international?
2. **Content scaling:** How to manage 264+ questions as roles evolve?
3. **AI costs:** Z AI SDK usage-based pricing — cost per interview session?
