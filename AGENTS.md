# AGENTS.md — Interview Lab

> **Amazon VA Interview Preparation Platform** — AI-powered mock interviews, resume coaching, cover letter generation, and practice tests for aspiring Amazon VAs.

## Identity

| Field | Value |
|-------|-------|
| **Owner** | Ryan Roland Dabao |
| **Purpose** | Help Filipino VAs prepare for Amazon roles (PPC, Account, Listing, Reporting, Agency VA) |
| **Status** | Active development |
| **Domain** | interview-lab.vercel.app |
| **Positioning** | Public landing page is free, positioned as a companion to the paid Project Amazon PH Academy (repo `projectamazonph/amph-v2`). The authenticated app still has its own paid tier system live — see `src/lib/pricing.ts` — the two aren't unified yet. |

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 16.1.1 (App Router) | Standalone output |
| **Runtime** | Node | `package-lock.json` is the tracked lockfile (no `bun.lock` in the repo); Bun also runs the npm scripts fine |
| **Database** | Prisma v6 + PostgreSQL only | `prisma/schema.prisma` has no SQLite fallback — `DATABASE_URL` is required even locally |
| **Auth** | JWT (jose v6) + HttpOnly cookies + localStorage client cache | Custom |
| **UI** | Tailwind CSS v4 | Custom glass design system |
| **Icons** | Phosphor Icons (light weight) | No thick-stroked icons |
| **Animation** | Framer Motion v12 | Scroll reveals, stagger, hover physics |
| **Fonts** | Space Grotesk (headings) + Plus Jakarta Sans (body) | No Inter/Roboto |
| **AI** | Z AI Web Dev SDK | Coaching, scoring, content generation |
| **Export** | docx, PDF (pdfkit), Excel (exceljs) | Resource downloads |
| **Testing** | Vitest + Bun's test runner | split across two runners — see Build & Deploy below |

## Design System — Ethereal Glass

| Element | Spec |
|---------|------|
| **Background** | OLED black (`#050505`) with radial gradient orbs |
| **Cards** | Glass-morphism with `backdrop-blur-xl` |
| **Accents** | Indigo/violet, emerald (success), amber (warning), rose (danger) |
| **Motion** | Custom cubic-bezier: `ease-premium`, `ease-spring`, `ease-out-heavy` |
| **Components** | Double-bezel glass cards, pill CTAs with trailing icon pattern |

## Code Organization

```
Interview-lab/
├── src/
│   ├── app/              ← App Router pages, API routes
│   ├── components/       ← React components (shared + feature)
│   │   ├── interview-lab/  ← Page components
│   │   └── ui/             ← Shared primitives
│   ├── hooks/            ← Custom hooks
│   └── lib/              ← Utilities, AI client, helpers
├── prisma/
│   └── schema.prisma     ← Database schema
├── __tests__/            ← Test files (api/, components/, stress/)
├── docs/                 ← Project documentation
├── agent-ctx/            ← Agent context files
├── codegraphs/           ← Code dependency graphs
└── next.config.ts        ← Next.js configuration
```

## Conventions

- **TypeScript strict** — no `any` without justification
- **ESLint flat config** — `eslint.config.mjs`
- **Tests** — colocated in `__tests__/` mirroring `src/` structure; 7 of the `__tests__/api/*.test.ts` files import from `'bun:test'` and only run under `bun test`, the rest run under `vitest` — see Build & Deploy below
- **Prisma** — generate client on `postinstall`
- **Path aliases** — `@/` maps to `src/`
- **Custom design tokens** — defined in Tailwind config, not arbitrary values
- **Package manager** — `package-lock.json` is the tracked lockfile; `bun` works too (no `bun.lock` committed, so don't add one without also dropping `package-lock.json`)

## Guardrails

### DO NOT
- ❌ Commit `.env` or secrets
- ❌ Use thick-stroked icons (Phosphor `weight="light"` always)
- ❌ Add dependencies without checking if 50 lines of custom code suffice
- ❌ Skip Prisma generate after schema changes
- ❌ Use Inter/Roboto fonts
- ❌ Scatter AI prompts across components (keep in `src/lib/`)

### DO
- ✅ Use Space Grotesk for headings, Plus Jakarta Sans for body
- ✅ Run `bun test __tests__/api/` and `npx vitest run __tests__/components` before PRs (plain `bun run test` / `npm test` do not run the whole suite cleanly — see Build & Deploy below)
- ✅ Run `bun run build` before deploy
- ✅ Keep AI prompts centralized in `src/lib/`
- ✅ Document new env vars
- ✅ Add truthfulness warnings on AI-generated resume/coach content

## Build & Deploy

```bash
bun dev                            # http://localhost:3000
bun run build                      # prisma generate + next build
bun test __tests__/api/            # 218 pass; ~38 fail without a running dev server (4 live-integration files) — expected
npx vitest run __tests__/components   # 44 pass — needs vitest's jsdom env
bun run lint                       # ESLint
bun run db:push                    # Schema push (DATABASE_URL, Postgres)
bun run db:migrate                 # Create migration
bun run db:reset                   # Reset + seed
```

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `src/app/` | All routes + API |
| `src/lib/` | AI client config, business logic, prompts |
| `docs/07-guardrails.md` | AI content safety policies |
| `docs/08-scoring-rubrics.md` | Interview scoring rubrics |
| `KANBAN.md` | Project board |
| `TODO.md` | Task tracking |

---

*Updated: 2026-07-13 | Part of Ryan's Hermes Agent workspace*
