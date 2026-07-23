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
| **Framework** | Next.js 16.1.1 (App Router) | Standalone output |
| **Runtime** | Bun | Package management + scripts |
| **Database** | Prisma v6 + PostgreSQL | PostgreSQL only (no SQLite) |
| **Auth** | JWT (jose v6) + HttpOnly cookies + localStorage client cache | Custom |
| **UI** | Tailwind CSS v4 | "Field Manual" light design system |
| **Icons** | Phosphor Icons (light weight) | No thick-stroked icons |
| **Animation** | Framer Motion v12 | Scroll reveals, stagger, hover physics |
| **Fonts** | Space Grotesk (headings) + Plus Jakarta Sans (body) | No Inter/Roboto |
| **AI** | Z AI Web Dev SDK | Coaching, scoring, content generation |
| **Export** | docx, PDF (pdfkit), Excel (exceljs) | Resource downloads |
| **Testing** | Vitest | unit + API + component tests |

## Design System — "Field Manual" (light theme)

> NOTE: The "Ethereal Glass" dark design previously described here was reverted. The live app uses the light "Field Manual" system below.

| Element | Spec |
|---------|------|
| **Background** | Warm off-white (`#FAFAF7`) with subtle grain/border texture |
| **Cards** | `FieldCard` — solid surface, thin border, soft shadow, no glass blur |
| **Accents** | Primary orange (`#FF6B35`), ink scale for text, emerald (success), amber (warning), rose (danger) |
| **Motion** | Framer Motion scroll reveals, stagger, hover physics (no custom cubic-beziers) |
| **Components** | `FieldButton` (variants: default/outline/ghost), `FieldCard`, `FieldBadge`, `Alert` |
| **Tokens** | Defined in `globals.css` + Tailwind config (CSS variables, not arbitrary values) |

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
- **Vitest** — tests colocated in `__tests__/` mirroring `src/` structure
- **Prisma** — generate client on `postinstall`
- **Path aliases** — `@/` maps to `src/`
- **Custom design tokens** — defined in Tailwind config, not arbitrary values
- **Package manager** — Use Bun exclusively (bun.lock, not npm package-lock.json)

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
- ✅ Run `bun run test` before PRs
- ✅ Run `bun run build` before deploy
- ✅ Keep AI prompts centralized in `src/lib/`
- ✅ Document new env vars
- ✅ Add truthfulness warnings on AI-generated resume/coach content

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
| `src/lib/` | AI client config, business logic, prompts |
| `docs/07-guardrails.md` | AI content safety policies |
| `docs/08-scoring-rubrics.md` | Interview scoring rubrics |
| `KANBAN.md` | Project board |
| `TODO.md` | Task tracking |

---

*Updated: 2026-07-13 | Part of Ryan's Hermes Agent workspace*

<!-- ASTRYX:START -->
Astryx v0.1.8 · 90+ components
CLI: run every command as `bunx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Frame first: pick the shell (AppShell / Layout+LayoutPanel) and budget regions in px BEFORE writing content (`astryx docs layout`).
- Dense data = rows (Table, List/Item) edge-to-edge — never Card-wrapped list items. Card = dashboard widgets, galleries, settings groups only.
- Status → StatusDot/Token; Badge only for counts and enumerated states, never decoration.
- Custom styling: component props first; else Tailwind utilities backed by tokens (bg-surface, text-primary, rounded-lg) via tailwind-theme.css. No raw hex/px.
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any style={{…}}, raw <div>/<span> layout, imported .css/@apply, or hardcoded/arbitrary value (e.g. bg-[#fff], p-[13px]) with the component or a token-backed utility. If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   90+ components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
