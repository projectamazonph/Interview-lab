# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Interview Lab — a free Next.js web app that helps Filipino VAs prepare for Amazon roles (PPC, Account, Listing, Reporting, Agency VA) via AI mock interviews, resume/cover-letter coaching, practice tests, and learning paths. Companion product to Project Amazon PH Academy; there are no paid tiers (subscription/pricing code exists but is dormant — see "Subscriptions are dormant" below).

## Commands

```bash
bun install            # install deps (postinstall runs prisma generate)
bun run dev             # dev server on :3000
bun run build           # prisma generate + next build (standalone output)
bun run start           # start production build

bun run lint             # ESLint (flat config, eslint.config.mjs)
bunx tsc --noEmit        # type check (CI runs this separately from build)

bun run test              # full Vitest suite
bun run test:watch        # watch mode
bun run test:api          # __tests__/api only
bun run test:components   # __tests__/components only
bun run test:coverage     # with v8 coverage
bun test __tests__/api/resume-coverletter.test.ts   # run a single file
bun test -t "creates user with valid email"          # run tests matching a name

bun run db:push       # push prisma/schema.prisma to Postgres (dev)
bun run db:migrate    # create + apply a migration
bun run db:reset      # reset db and reseed
bun run db:seed       # tsx prisma/seed.ts
bun run db:generate   # regenerate Prisma client
```

Bun is the package manager (`bun.lock` is committed — don't add a `package-lock.json`). CI (`.github/workflows/ci.yml`) also uses Bun; it runs `tsc --noEmit`, `lint`, `db:push`, `db:seed`, `bun run test`, `bun run build`, then boots the built server and runs a live-server integration subset (`__tests__/api/auth.test.ts`, `resources.test.ts`, `questions-interview-ai.test.ts`, `user-paths.test.ts`) against it before a gitleaks secret scan. Match that sequence when validating a change end-to-end.

Database is **PostgreSQL only** (`prisma/schema.prisma` `provider = "postgresql"`) — despite older docs mentioning SQLite for MVP/dev, do not reintroduce SQLite.

## Architecture

**Stack**: Next.js 16 (App Router, standalone output) · React 19 · Prisma 6 + PostgreSQL · Tailwind CSS v4 · custom JWT auth (`jose`) · Vitest.

### Request flow

Route handlers under `src/app/api/**/route.ts` are the only place that touches the database and AI provider — components never call Prisma or the AI SDK directly, they call these routes via `fetch`. A typical handler:

1. `getUserFromRequest(request)` (`src/lib/auth-helpers.ts`) reads the `interviewlab_session` HttpOnly JWT cookie and resolves the `User` row. Returns `null` on missing/invalid/expired token — no header-based auth exists anymore (`x-user-id` was removed as an impersonation vector, see the comment at the top of `auth-helpers.ts`).
2. Manual input sanitization/validation inline (no schema library like zod is used — see `src/lib/sanitize.ts` for `sanitizeText`/`sanitizeRichText` HTML-stripping helpers).
3. Prisma call via the shared `db` client (`src/lib/db.ts`, a global-singleton pattern to survive Next.js dev hot-reload).
4. `NextResponse.json(...)`, always inside try/catch with a generic error message on failure (never leak internals).

`src/middleware.ts` applies IP-based rate limiting to all `/api/*` routes ahead of the handlers (in-memory `Map`, Edge-runtime-safe — it cannot use `fs`/`db`, which is why the auth routes *also* do their own DB-backed rate limiting for persistence across restarts — see `src/lib/rate-limit.ts` and its use in `/api/auth/login`, `/api/auth/register`).

### AI integration

All model calls go through `src/lib/ai/`:
- `client.ts` — `ZAIProvider`, a thin adapter over `z-ai-web-dev-sdk` adding a hard timeout + `AbortSignal` support. Swap providers here without touching route handlers. Use `completeJson<T>()` to get parsed JSON back.
- `handlers.ts` — `createAIHandler()`, a factory that wraps auth + validation + model call + JSON-parse-failure/provider-error fallbacks so individual AI routes (`src/app/api/ai/*`) stay ~15 lines. New AI endpoints should use this factory rather than hand-rolling the request lifecycle.
- `coach.ts`, `resume.ts`, `cover-letter.ts`, `assessment.ts` — per-feature system prompts and prompt-building logic.
- `json.ts` — `extractJson()` for pulling a JSON payload out of a raw model completion.

**Prompts must stay in `src/lib/ai/`, never inline in components or route handlers** (`AGENTS.md`, `CONTRIBUTING.md`). AI-generated resume/cover-letter/coaching content must carry truthfulness warnings and must not fabricate tool/employer experience — see `docs/07-guardrails.md` for the full guardrail list (no job/income guarantees, no fake credentials, no protected-characteristic-based advice, etc.) before touching any AI-facing feature.

### Auth & sessions

`src/lib/session.ts` issues/verifies signed JWTs (`jose`, HS256) stored as an HttpOnly + Secure(prod) + SameSite=Lax cookie (`createSession`, `verifySession`, `getSession` for server components, `verifyToken` for raw tokens). `JWT_SECRET` must be ≥32 chars and is read lazily (not at import time) so tests can set it in `__tests__/setup.ts`. `src/lib/auth-context.tsx` is the client-side React context; it also keeps a localStorage cache but the cookie is the source of truth server-side.

### Subscriptions are dormant

The product is free — every feature is open to every user. `src/lib/subscription-guard.ts` and `src/lib/subscription/entitlement.ts` still exist and are wired into routes for structural continuity, but `entitlement.canAccess()` effectively always allows. Don't build new tier-gating logic; if you touch this area, keep it a no-op unless explicitly asked to reintroduce paid tiers. `Subscription`/`Payment` Prisma models exist but are unused by any live feature.

### Data model

Single `prisma/schema.prisma`, one `User` fanning out to `UserProfile`, `Resume[]`, `CoverLetter[]`, `InterviewSession[]` → `QuestionAttempt[]` (joins `Question`), `GuideProgress[]` → `Guide`, `AgentRun[]` (AI call audit log), `Subscription`/`Payment` (dormant, see above). `Question`, `Assessment`, `Download`, `Guide` are content tables managed through the admin panel (`src/app/api/admin/**`, `src/components/interview-lab/AdminPanel.tsx`), gated by `verifyAdmin()`/`user.isAdmin`. Most JSON-shaped fields (`transcript`, `truthFlags`, `rubricBreakdown`, `checklist`, etc.) are stored as `String` and JSON-serialized manually, not native Postgres `Json` columns — follow that pattern for new fields unless there's a reason to change it.

### UI / design system

Design system is called "Field Manual" (light theme — a prior dark "Ethereal Glass" design was reverted; ignore any docs that still describe glass/dark styling as current). Primitives live in `src/components/ui/` and are exported under `Field*` names (`FieldCard`, `FieldButton`, `FieldBadge`) even though some files keep their legacy `glass-*.tsx` filenames (e.g. `FieldCard` is defined in `glass-card.tsx`) — go by the exported component name, not the filename, when searching. Feature/page components live in `src/components/interview-lab/` (one file per app section: `MockInterview.tsx`, `ResumeLab.tsx`, `CoverLetterStudio.tsx`, `DashboardView.tsx`, `AdminPanel.tsx`, etc.), consumed by the thin route files in `src/app/`.

Conventions: Phosphor Icons at `weight="light"` only (no thick-stroke icons); Space Grotesk for headings / Plus Jakarta Sans for body (never Inter/Roboto as the primary font, even though Inter appears as a fallback in the CSS font stack); Framer Motion for scroll reveals/stagger/hover (no custom cubic-bezier easings); colors and spacing come from CSS variables in `src/app/globals.css` + `tailwind.config.ts`, not arbitrary Tailwind values.

### Path aliases & tests

`@/*` maps to `src/*` (`tsconfig.json`, mirrored in `vitest.config.ts`). Tests live in `__tests__/`, not colocated with source, split into `api/` (route handler tests, many run twice — once in-process, once as live-server integration in CI), `components/`, `lib/`, `unit/`, and `stress/`. `__tests__/setup.ts` sets a dummy `JWT_SECRET` and stubs `localStorage`/`crypto.subtle`/`fetch` for jsdom. API tests generally use in-memory stubs rather than a real database, except the CI-only integration subset that runs against a real Postgres + live `next start` server.

## Guardrails from AGENTS.md / CONTRIBUTING.md

- Don't commit `.env` or secrets.
- Don't add a dependency if ~50 lines of custom code would suffice.
- Run `bun run test` and `bun run build` before considering a change done.
- Keep AI prompts in `src/lib/ai/`, not in components or routes.
- Document any new environment variable.

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
