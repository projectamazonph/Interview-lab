# PRD — Interview Lab

**Version:** 1.0 | **Status:** Approved | **Last Updated:** 2026-07-02

---

## Product Overview

Interview Lab is an **AI-powered interview preparation platform** purpose-built for Filipino virtual assistants seeking Amazon-related roles. It provides role-specific mock interviews, resume coaching, cover letter generation, practice tests, and learning paths — all designed to bridge the gap between general VA work and specialized Amazon roles (PPC, Account Management, Listing Optimization, Reporting, Agency VA).

**Core Value Proposition:** From VA to Amazon specialist — AI-powered preparation that turns uncertain candidates into confident, interview-ready professionals.

---

## Target Audience

### Primary: Filipino VA Candidates
- Current VAs aiming for Amazon specialization roles
- Career shifters entering the VA industry
- New graduates seeking VA roles
- Device: Mobile-first, desktop-secondary

### Secondary: VA Agencies & Coaches
- Agencies screening candidates for Amazon roles
- Coaches preparing students for VA placement
- HR teams standardizing interview assessments

---

## Role Coverage (6 VA Roles)

| Role | Focus Areas | Questions |
|------|-------------|-----------|
| **PPC VA** | Amazon advertising, campaign management, bid optimization, keyword research | 44+ |
| **Account VA** | Seller Central, account health, inventory management, case logs | 44+ |
| **Listing VA** | Product listings, SEO optimization, A+ Content, image requirements | 44+ |
| **Reporting VA** | Data analysis, Excel/Sheets, KPI tracking, dashboard creation | 44+ |
| **Agency VA** | Multi-client management, communication, reporting cadence | 44+ |
| **General VA** | Email management, calendar, research, data entry, basic tools | 44+ |

---

## User Stories

### Candidate
- US-01: I can practice with AI mock interviews for my target role
- US-02: I can upload my resume and get AI-powered review with truth flags
- US-03: I can generate role-targeted cover letters in multiple tones
- US-04: I can take timed practice tests with AI scoring
- US-05: I can follow structured learning paths (Beginner → Intermediate → Advanced)
- US-06: I can download premium resources (templates, checklists, worksheets)
- US-07: I can track my progress, scores, and improvement over time
- US-08: I can choose from Free / Starter / Pro tiers based on my needs

### Coach / Admin
- US-09: I can review candidate performance and identify weak areas
- US-10: I can manage question banks and interview configurations
- US-11: I can view platform analytics and usage metrics

---

## Feature List

### MVP (v1.0 — Current)
| Feature | Description | Status |
|---------|-------------|--------|
| **AI Mock Interviews** | Role-specific interviews with real-time AI feedback, scoring, and improvement suggestions | ✅ Live |
| **Question Bank** | 264+ questions across 6 roles, 3 difficulty levels, with ideal answer guides | ✅ Live |
| **Resume Lab** | Upload resume (PDF/DOCX), AI extracts + reviews with truth flags (Missing/Could be stronger/Verified) | ✅ Live |
| **Cover Letter Studio** | Generate role-targeted cover letters in Professional/Enthusiastic/Concise tones | ✅ Live |
| **Practice Tests** | Timed assessments (15/30/45 min) with auto-scoring and answer review | ✅ Live |
| **Learning Paths** | Beginner → Intermediate → Advanced progression per role with curated content | ✅ Live |
| **Download Center** | Templates, checklists, worksheets (tier-gated: Free/Starter/Pro) | ✅ Live |
| **Subscription Tiers** | Free (limited), Starter (₱499/mo), Pro (₱999/mo) with usage-based limits | ✅ Live |
| **Admin Panel** | Analytics dashboard, user management, question management | ✅ Live |

### V2 (Planned)
| Feature | Priority |
|---------|----------|
| Video interview simulation (record + analyze) | High |
| Peer review system | Medium |
| Company-specific interview tracks | Medium |
| Multi-language support (Taglish interface) | Medium |
| Mobile app (React Native) | Low |
| Integration with job boards (OnlineJobs.ph, Upwork) | Low |

---

## Design System — Ethereal Glass

| Element | Specification |
|---------|--------------|
| **Background** | OLED black (`#050505`) with radial gradient orbs |
| **Cards** | Glass-morphism with `backdrop-blur-xl`, double-bezel borders |
| **Accent Colors** | Indigo/violet primary, emerald success, amber warning, rose danger |
| **Typography** | Space Grotesk (headings) + Plus Jakarta Sans (body) |
| **Icons** | Phosphor Icons, `weight="light"` — no Inter/Roboto |
| **Motion** | Framer Motion scroll reveals, stagger animations, custom cubic-bezier curves |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Monthly active users | >1,000 |
| Interview sessions per user | >5/month |
| Resume upload completion | >60% |
| Free → Paid conversion | >8% |
| NPS | >50 |
| Avg session duration | >15 min |

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, standalone output) |
| **Runtime** | Bun |
| **Database** | Prisma + SQLite (PostgreSQL planned) |
| **Auth** | Custom JWT (jose + HttpOnly cookies) + localStorage client cache |
| **UI** | Tailwind CSS 4 + Ethereal Glass design system |
| **Animation** | Framer Motion |
| **AI** | Z AI Web Dev SDK (coaching, scoring, content generation) |
| **Export** | docx, PDF (pdfkit), Excel (exceljs) |
| **Fonts** | Space Grotesk + Plus Jakarta Sans |
| **Deploy** | Vercel |

---

## Pricing Tiers

| Feature | Free | Starter (₱499/mo) | Pro (₱999/mo) |
|---------|------|-------------------|----------------|
| Mock Interviews | 2/month | 10/month | Unlimited |
| Resume Reviews | 1/month | 5/month | 15/month |
| Cover Letters | 1/month | 5/month | Unlimited |
| Practice Tests | 1/month | 5/month | Unlimited |
| Download Center | Basic | Premium | All |
| Learning Paths | Limited | Full | Full + Priority |
| Priority Support | — | — | ✅ |
