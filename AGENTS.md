# AGENTS.md — Interview Lab

> **Amazon VA Interview Preparation Platform** — AI-powered mock interviews, resume coaching, cover letter generation, and practice tests for aspiring Amazon VAs.

## Identity

| Field | Value |
|-------|-------|
| **Owner** | Ryan Roland Dabao |
| **Purpose** | Help Filipino VAs prepare for Amazon roles (PPC, Account, Listing, Reporting, Agency VA) |
| **Status** | Active development |
| **Domain** | interview-lab.vercel.app |

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 16 (App Router) | Standalone output |
| **Runtime** | Bun | Package management + scripts |
| **Database** | Prisma v6 + SQLite | Local dev |
| **Auth** | JWT (jose v6) + HttpOnly cookies + localStorage client cache | Custom |
| **UI** | Tailwind CSS v4 | Custom glass design system |
| **Icons** | Phosphor Icons (light weight) | No thick-stroked icons |
| **Animation** | Framer Motion v12 | Scroll reveals, stagger, hover physics |
| **Fonts** | Space Grotesk (headings) + Plus Jakarta Sans (body) | No Inter/Roboto |
| **AI** | Z AI Web Dev SDK | Coaching, scoring, content generation |
| **Export** | docx, PDF (pdfkit), Excel (exceljs) | Resource downloads |
| **Testing** | Vitest | unit + API + component tests |

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
│   ├── hooks/            ← Custom hooks
│   └── lib/              ← Utilities, AI client, helpers
├── prisma/
│   └── schema.prisma     ← Database schema
├── __tests__/            ← Test files (api/, components/)
├── docs/                 ← Project documentation
├── agent-ctx/            ← Agent context files
├── codegraphs/           ← Code dependency graphs
└── next.config.ts        ← Next.js configuration
```

## Conventions

- **TypeScript strict** — no `any` without justification
- **ESLint flat config** — `eslint.config.mjs`
- **Vitest** — tests colocated in `__tests__/` mirroring `src/` structure
- **Prisma** — generate client on `postinstall`
- **Path aliases** — `@/` maps to `src/`
- **Custom design tokens** — defined in Tailwind config, not arbitrary values

## Guardrails

### DO NOT
- ❌ Commit `.env` or secrets
- ❌ Use thick-stroked icons (Phosphor `weight="light"` always)
- ❌ Add dependencies without checking if 50 lines of custom code suffice
- ❌ Skip Prisma generate after schema changes
- ❌ Use Inter/Roboto fonts

### DO
- ✅ Use Space Grotesk for headings, Plus Jakarta Sans for body
- ✅ Run `bun test` before PRs
- ✅ Run `bun run build` before deploy
- ✅ Keep AI prompts in `src/lib/` not scattered across components
- ✅ Document new env vars

## Build & Deploy

```bash
bun dev                    # http://localhost:3000
bun run build              # prisma generate + next build
bun test                   # Vitest
bun run test:api           # API tests only
bun run lint               # ESLint
bun run db:push            # Schema push (dev)
bun run db:migrate         # Create migration
bun run db:reset           # Reset + seed
```

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `src/app/` | All routes + API |
| `src/lib/` | AI client config, business logic |
| `agent-ctx/` | Agent working context files |
| `docs/` | Architecture docs, redesign plans |
| `KANBAN.md` | Project board |
| `TODO.md` | Task tracking |

---

*Updated: 2026-07-02 | Part of Ryan's Hermes Agent workspace*
