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
| **Resume Lab** | Paste your resume text, get AI review with truth flags and improvement suggestions |
| **Cover Letter Studio** | Generate role-targeted cover letters with multiple tones |
| **Practice Tests** | Timed assessments with AI-scored results |
| **Learning Paths** | Beginner → Intermediate → Advanced guides per role |
| **Download Center** | Templates, checklists, worksheets |
| **Admin Panel** | Analytics dashboard and question management |

## 💰 Pricing

**Free, always.** Interview Lab is a free companion to [Project Amazon PH Academy](https://projectamazonph.com). All features are available to all users — no paid tiers.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.1 (App Router, standalone) |
| **Runtime** | Bun (CI uses npm) |
| **Database** | Prisma v6 + PostgreSQL (PostgreSQL only) |
| **Auth** | Custom JWT sessions (jose) + HttpOnly cookies |
| **UI** | Tailwind CSS v4 + "Field Manual" light design system |
| **Icons** | Phosphor Icons (light weight) |
| **Fonts** | Space Grotesk (headings) + Plus Jakarta Sans (body) |
| **AI** | Z AI Web Dev SDK for coaching, scoring, content generation |
| **Export** | Resume/cover-letter export: docx, PDF (pdfkit). Download Center resources: PDF, DOCX, and Excel (exceljs) — a separate, unrelated code path |

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
│   │   ├── auth/               # Register, login, logout, email verify, forgot/reset password
│   │   ├── cron/                # Scheduled maintenance (rate-limit + token cleanup)
│   │   ├── interview/          # Mock interview sessions
│   │   ├── questions/          # Question bank + count
│   │   ├── assessments/        # Practice test assessments
│   │   ├── profile/            # User profile (GET/PUT)
│   │   ├── dashboard/          # Dashboard aggregation
│   │   ├── resume/             # Resume text review (paste, not file upload)
│   │   ├── cover-letter/       # Cover letter generation
│   │   ├── ai/                 # AI endpoints (coach, scoring, resume, cover)
│   │   ├── admin/              # Admin analytics + question management
│   │   ├── guides/             # Learning path guides
│   │   ├── downloads/          # Download center
│   │   └── export/             # DOCX/PDF export
│   ├── page.tsx                # The app itself — a client-side SPA (landing, auth, dashboard, all feature views)
│   └── about/, contact/, privacy/, terms/, reset-password/  # Standalone marketing/utility pages
├── components/
│   ├── interview-lab/          # Feature components rendered inside the SPA (Field Manual design system)
│   └── ui/                     # Shared primitives (field-card, field-button, etc.)
├── lib/
│   ├── auth-helpers.ts         # Server-side JWT session verification
│   ├── subscription-guard.ts   # Feature access checks (product is free — always allows)
│   ├── types.ts                # TypeScript interfaces
│   └── utils.ts                # cn() utility
└── hooks/                      # Custom React hooks

prisma/                         # Prisma schema (PostgreSQL)
__tests__/                      # Test suites — api/, components/, lib/, unit/, stress/ (see docs/TESTING.md)
docs/                           # PRD, architecture, feature specs
.zscripts/                      # Dev/build/startup scripts
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test __tests__/api/resume-coverletter.test.ts

# Run API tests only
bun test __tests__/api/
```

### Test Coverage

Covers auth flows (register/login/logout/password reset), question bank filtering, interview session creation and server-side answer scoring, resume/cover-letter CRUD, rate limiting, and AI response parsing. See `docs/TESTING.md` for the full file breakdown.

Most tests use in-memory stubs — no database or server required. A subset also runs as live-server integration tests against a real Postgres instance in CI (see `.github/workflows/ci.yml`).

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server with logging |
| `bun run build` | Production build (standalone) |
| `bun run db:push` | Push Prisma schema to PostgreSQL |
| `bun run db:generate` | Generate Prisma client |
| `bun run test` | Run test suite |
| `bun run lint` | ESLint check |

## 🎨 Design System — "Field Manual" (light theme)

> The earlier "Ethereal Glass" dark design was reverted. The live app uses a clean light "Field Manual" system.

- **Palette:** Warm off-white (`#FAFAF7`) with subtle grain/border texture, primary orange (`#FF6B35`) accents
- **Colors:** Ink scale for text, emerald success, amber warnings, rose danger
- **Motion:** Framer Motion scroll reveals, stagger, hover physics (no custom cubic-beziers)
- **Components:** `FieldCard` (solid surface, thin border, soft shadow), `FieldButton` (default/outline/ghost), `FieldBadge`, `Alert`
- **Icons:** Phosphor Icons in `weight="light"` — no thick-stroked icons
- **Typography:** Space Grotesk for headings, Plus Jakarta Sans for body

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection URL — must be a **pooled** connection in production (see `docs/DEPLOYMENT.md`) |
| `DIRECT_URL` | Unpooled PostgreSQL connection, used only for `db:push`/`db:migrate` |
| `JWT_SECRET` | Secret for signing JWT session tokens (min. 32 characters) |
| `NEXT_PUBLIC_APP_URL` | App base URL |
| `CRON_SECRET` | Authorizes the scheduled `/api/cron/cleanup` route |

See `.env.example` for the full list, including optional rate-limit overrides.

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
