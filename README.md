<div align="center">

# 🎙️ Interview Lab

**Amazon VA Interview Preparation Platform**

AI-powered mock interviews, resume coaching, cover letter generation, and practice tests
for aspiring Amazon Virtual Assistants.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/projectamazonph/Interview-lab)

[Live Demo](https://interview-lab.vercel.app) · [Report Bug](https://github.com/projectamazonph/Interview-lab/issues) · [Request Feature](https://github.com/projectamazonph/Interview-lab/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Mock Interviews** | Role-specific interview sessions with real-time AI feedback and scoring |
| **Question Bank** | 264+ questions across 6 VA roles and 3 difficulty levels |
| **Resume Lab** | Upload resume, get AI review with truth flags and improvement suggestions |
| **Cover Letter Studio** | Generate role-targeted cover letters with multiple tones |
| **Practice Tests** | Timed assessments with AI-scored results |
| **Learning Paths** | Beginner → Intermediate → Advanced guides per role |
| **Download Center** | Templates, checklists, worksheets |
| **Admin Panel** | Analytics dashboard and question management |

## 💰 Pricing

**Free, always.** Interview Lab is a free companion to [Project Amazon PH Academy](https://projectamazon.ph). All features are available to all users — no paid tiers.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.1 (App Router, standalone) |
| **Runtime** | Bun |
| **Database** | Prisma v6 + SQLite (dev) / PostgreSQL (prod) |
| **Auth** | Custom JWT sessions (jose) + HttpOnly cookies |
| **UI** | Tailwind CSS v4 + custom glass design system |
| **Icons** | Phosphor Icons (light weight) |
| **Fonts** | Space Grotesk (headings) + Plus Jakarta Sans (body) |
| **AI** | Z AI Web Dev SDK for coaching, scoring, content generation |
| **Export** | docx, PDF (pdfkit), Excel (exceljs) |

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- Git

### Setup

```bash
# Clone the repo
git clone https://github.com/projectamazonph/Interview-lab.git
cd Interview-lab

# Install dependencies
bun install

# Set up the database
bun run db:push

# Start the dev server
bun run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Quick Start (alternative)

```bash
bash .zscripts/dev.sh
```

## 📁 Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   │   ├── auth/               # Register, login, logout, email verify
│   │   ├── interview/          # Mock interview sessions
│   │   ├── questions/          # Question bank + count
│   │   ├── assessments/        # Practice test assessments
│   │   ├── profile/            # User profile (GET/PUT)
│   │   ├── dashboard/          # Dashboard aggregation
│   │   ├── subscription/       # Checkout, status, usage, webhook
│   │   ├── resume/             # Resume upload + AI review
│   │   ├── cover-letter/       # Cover letter generation
│   │   ├── ai/                 # AI endpoints (coach, scoring, resume, cover)
│   │   ├── admin/              # Admin analytics + question management
│   │   ├── guides/             # Learning path guides
│   │   ├── downloads/          # Download center
│   │   └── export/             # DOCX/PDF/Excel export
│   └── [pages]/                # Page routes
├── components/
│   ├── interview-lab/          # Page components (glass design system)
│   └── ui/                     # Shared primitives (glass-card, glass-button, etc.)
├── lib/
│   ├── auth-helpers.ts         # Server-side JWT + header auth
│   ├── pricing.ts              # Tier configs (Free/Starter/Pro) and limits
│   ├── subscription-guard.ts   # Feature access checks per tier
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # cn() utility
└── hooks/                      # Custom React hooks

prisma/                         # Prisma schema (SQLite/PostgreSQL)
__tests__/                      # Test suites
├── api/                        # API route unit tests (218 tests)
│   ├── interview-session.test.ts
│   ├── questions.test.ts
│   ├── auth-register.test.ts
│   ├── auth-login.test.ts
│   ├── assessments.test.ts
│   ├── profile-dashboard.test.ts
│   ├── subscription.test.ts
│   └── resume-coverletter.test.ts
└── components/                 # Component tests
docs/                           # PRD, architecture, feature specs
.zscripts/                      # Dev/build/startup scripts
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test __tests__/api/subscription.test.ts

# Run API tests only
bun test __tests__/api/
```

### Test Coverage

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `interview-session.test.ts` | 21 | Session creation, answer submission, auth/authz |
| `questions.test.ts` | 38 | Question bank filtering, role/difficulty, structure |
| `auth-register.test.ts` | 34 | Registration validation, email/password, bot protection |
| `auth-login.test.ts` | 26 | Login flow, rate limiting, session, email sanitization |
| `assessments.test.ts` | 20 | Assessment list/get/submit, answer key stripping |
| `profile-dashboard.test.ts` | 23 | Profile whitelisting, sanitization, dashboard stats |
| `subscription.test.ts` | 31 | Pricing logic, checkout, tier validation, payments |
| `resume-coverletter.test.ts` | 25 | Resume CRUD, cover-letter tones, truth flags |
| **Total** | **218** | **All API routes, all green** |

Tests use in-memory stubs — no database or server required.

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server with logging |
| `bun run build` | Production build (standalone) |
| `bun run db:push` | Push Prisma schema to SQLite |
| `bun run db:generate` | Generate Prisma client |
| `bun run test` | Run test suite |
| `bun run lint` | ESLint check |

## 🎨 Design System — Ethereal Glass

The app uses a premium dark-mode glass aesthetic:

- **Palette:** OLED black (`#050505`) with radial gradient orbs, glass-morphism cards, `backdrop-blur-xl`
- **Colors:** Indigo/violet accents, emerald success, amber warnings, rose danger
- **Motion:** Custom cubic-bezier curves, Framer Motion scroll reveals, staggered animations
- **Components:** Double-bezel glass cards, pill CTAs, glass inputs/badges
- **Icons:** Phosphor Icons in `weight="light"` — no thick-stroked icons
- **Typography:** Space Grotesk for headings, Plus Jakarta Sans for body

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite connection string (`file:./dev.db`) or PostgreSQL URL |
| `JWT_SECRET` | Secret for signing JWT session tokens |
| `NEXT_PUBLIC_APP_URL` | App base URL |

## 📚 Documentation

- `docs/PRD.md` — Product requirements
- `docs/BUILD_SPEC.md` — Technical build specification
- `docs/TESTING.md` — Testing strategy
- `docs/SECURITY.md` — Security considerations
- `docs/DEPLOYMENT.md` — Deployment guide
- `docs/ENGINEERING_DIARY.md` — Development journal
- `AGENTS.md` — AI agent context and coding standards
- `REDESIGN-PLAN.md` — Full UI/UX redesign plan

## 📄 License

Private — © 2026 Ryan Roland Dabao. All rights reserved.
