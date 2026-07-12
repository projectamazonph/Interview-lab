# Interview Lab

An **Amazon VA Interview Preparation Platform** — a full-stack Next.js app that helps virtual assistants prepare for Amazon-related roles (PPC, Account, Listing, Reporting, Agency VA) with AI-powered mock interviews, resume coaching, cover letter generation, practice tests, and downloadable resources.

## Tech Stack

- **Framework:** Next.js 15 (App Router, standalone output)
- **Runtime:** Bun
- **Database:** Prisma + SQLite
- **Auth:** Custom JWT sessions (jose + HttpOnly cookies) + localStorage client-side cache
- **UI:** Tailwind CSS 4 + custom glass design system + Phosphor Icons (light weight)
- **Animation:** Framer Motion (scroll reveals, stagger, hover physics)
- **Fonts:** Space Grotesk (headings) + Plus Jakarta Sans (body)
- **AI:** Z AI Web Dev SDK for coaching, scoring, and content generation
- **Export:** docx, PDF (pdfkit), Excel (exceljs)

## Design System — Ethereal Glass

The app uses a premium dark-mode glass aesthetic:

- **Palette:** OLED black (`#050505`) with radial gradient orbs, glass-morphism cards, and `backdrop-blur-xl`
- **Colors:** Indigo/violet accents, emerald success, amber warnings, rose danger — all with glass transparency
- **Motion:** Custom cubic-bezier curves (`ease-premium`, `ease-spring`, `ease-out-heavy`), Framer Motion scroll reveals, staggered animations
- **Components:** Double-bezel glass cards, pill CTAs with trailing icon pattern, glass inputs/badges
- **Icons:** Phosphor Icons in `weight="light"` — no thick-stroked icons
- **Typography:** Space Grotesk for headings, Plus Jakarta Sans for body — no Inter/Roboto

## Features

- **AI Mock Interviews** — Role-specific interview sessions with real-time AI feedback and scoring
- **Question Bank** — 264+ questions across 6 VA roles and 3 difficulty levels
- **Resume Lab** — Upload resume, get AI review with truth flags and improvement suggestions
- **Cover Letter Studio** — Generate role-targeted cover letters with multiple tones
- **Practice Tests** — Timed assessments with AI-scored results
- **Learning Paths** — Beginner → Intermediate → Advanced guides per role
- **Download Center** — Templates, checklists, worksheets (tier-gated)
- **Subscription Tiers** — Free / Starter (₱499/mo) / Pro (₱999/mo) with usage-based limits
- **Admin Panel** — Analytics dashboard and question management

## Getting Started

```bash
bun install
bun run db:push    # Seed SQLite database
bun run dev        # Start dev server on :3000
```

Or use the startup script:

```bash
bash .zscripts/dev.sh
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Dev server with logging |
| `bun run build` | Production build (standalone) |
| `bun run db:push` | Push Prisma schema to SQLite |
| `bun run db:generate` | Generate Prisma client |
| `bun run test` | Run Vitest suite |
| `bun run test:api` | API route tests only |
| `bun run lint` | ESLint check |

## Project Structure

```
src/
  app/                      # Next.js App Router (pages + API routes)
  components/
    interview-lab/          # Page components (all using glass design system)
    ui/                     # Shared primitives (glass-card, glass-button, glass-input, glass-badge, shadcn base)
  lib/
    animations.ts           # Framer Motion variants (fadeUp, stagger, slideUp, scaleIn)
    auth-context.tsx         # Auth provider + login/register/logout
    auth-helpers.ts          # Server-side JWT + header auth
    pricing.ts               # Tier configs (Free/Starter/Pro) and limits
    subscription-guard.ts    # Feature access checks per tier
    types.ts                 # TypeScript interfaces
    utils.ts                 # cn() utility
  hooks/                    # Custom React hooks (use-toast)
prisma/                     # Schema (SQLite)
docs/                       # PRD, architecture, feature specs (13 docs)
agent-ctx/                  # Agent context docs for AI orchestration
__tests__/                  # Vitest test suites (API, components, stress)
.zscripts/                  # Dev/build/startup scripts
```

## Environment Variables

Set in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite connection string |
| `JWT_SECRET` | Secret for signing JWT session tokens |
| `NEXT_PUBLIC_APP_URL` | App base URL |

## Documentation

- `docs/` — Product specs, technical architecture, question banks, scoring rubrics
- `REDESIGN-PLAN.md` — Full UI/UX redesign plan with per-page specifications
- `PONYTAIL-AUDIT.md` — Codebase audit for over-engineering (applied cleanup)
- `worklog.md` — Development session logs

## Notes

- Dependencies pruned from 74 to 28 packages — see `PONYTAIL-AUDIT.md`.
- Run `bun install` after cloning to restore `node_modules`.
# Force Vercel rebuild Wed Jul  8 06:19:01 UTC 2026


## 📊 Codegraph

See [codegraphs/Interview-lab.md](./codegraphs/Interview-lab.md) for the full dependency graph.
