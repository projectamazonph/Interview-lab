# Interview Lab — Thorough Fix Plan

> Audited 2026-07-19. A sequenced, merge-ready plan. Each phase: **goal → files → changes → verification**.
> Phases are independently shippable; **Phase 0 must land first**.

---

## Phase 0 — Reconcile Reality & Delete Dead Code
*Why first: docs/architecture are wrong. Fix the map before the journey.*

### 0.1 Documentation truth-up
**Files:** `AGENTS.md`, `README.md`, `REDESIGN-PLAN.md`, `REMEDIATION_PLAN.md`, `docs/architecture.md`
- Rewrite AGENTS.md "Design System" section: replace *"Ethereal Glass / OLED black / sky `#007EFF`"* with the live **"Field Manual" light theme** (`#FAFAF7` bg, `#FF6B35` accent, `FieldCard`/`FieldButton`).
- README Tech Stack: change `UI` row to "Tailwind v4 + Field Manual design system"; fix `Export` row ("pdfkit" → "pdfkit + manual PDF builder" or remove pdfkit after Phase 3).
- `REMEDIATION_PLAN.md`: delete false claim that `downloads/[id]/route.ts` is 879 lines (it's 53).
- Mark `REDESIGN-PLAN.md` as **superseded** (glass redesign was reverted) — or delete it.

### 0.2 Delete dead code
| File | Reason |
|------|--------|
| `src/lib/browser-llm-integration.ts` (338 lines) | Not imported anywhere; fake rule-based AI |
| `src/components/interview-lab/UpgradeModal.tsx` | Stub, no-op |
| `src/components/interview-lab/SubscriptionBanner.tsx` | Stub, no-op |
| `src/lib/pricing.ts` (tier config) — *optional* | Only powers stubs; keep if PricingPage ever real |

**Verify:** `grep -r "browser-llm-integration\|UpgradeModal\|SubscriptionBanner" src` → no results; `bun run build` passes.

---

## Phase 1 — SOLID: AI Layer Refactor (SRP + OCP + DIP)
*Highest leverage: 4 routes share ~75-line duplicated JSON-extract loop, each calls the SDK directly.*

### 1.1 `src/lib/ai/client.ts` — AIProvider abstraction (DIP)
```ts
export interface AIProvider {
  complete(system: string, user: string, opts?: { schema?: ZodSchema; signal?: AbortSignal }): Promise<unknown>;
}
export class ZAIProvider implements AIProvider { /* timeout 30s, abort, retry-once */ }
export const ai: AIProvider = new ZAIProvider();
```
- Add `AbortSignal.timeout(30000)` + `try/catch` around `ZAI.create().chat.completions.create`.

### 1.2 `src/lib/ai/handlers.ts` — `createAIHandler` factory (OCP)
```ts
export function createAIHandler<T>(buildPrompt, schema: ZodSchema<T>) {
  return async (req) => { /* auth → call ai.complete with schema → validate → return */ };
}
```
- Centralize `extractJsonArray`/`extractJsonObject` parsing into tested util `src/lib/ai/json.ts`.

### 1.3 Split routes
- `src/lib/ai/coach.ts`, `resume.ts`, `cover-letter.ts`, `assessment.ts` — each exports `buildPrompt()` + a zod `schema`.
- Refactor `src/app/api/ai/{coach,resume-review,cover-letter,assessment-score}/route.ts` to ~15 lines each calling `createAIHandler`.

### 1.4 Add zod schemas
- `src/lib/ai/schemas.ts`: `CoachFeedbackSchema`, `ResumeReviewSchema`, `CoverLetterSchema`, `AssessmentScoreSchema` (replaces runtime `as` casts).

**Verify:** `__tests__/ai/client.test.ts` (mock `z-ai-web-dev-sdk`), `handlers.test.ts` (valid + malformed JSON → 500), `bun run test`.

---

## Phase 2 — SOLID: Export Layer (SRP)
### 2.1 `src/lib/export/docx.ts`
- Move `generateDocx` out of `export/route.ts` into its own module.

### 2.2 `src/lib/export/pdf.ts` — replace hand-rolled byte builder
- Use already-installed `pdfkit` (currently unused). Fixes **silent truncation** (`if (y < 50) break`) by paginating.
- Add `content` size guard (reject > 50k chars) to prevent abuse.

### 2.3 `src/app/api/export/route.ts`
- Becomes ~12 lines: auth → dispatch to `docx.ts` / `pdf.ts`.

**Verify:** `export.test.ts` generates real .docx/.pdf, asserts multi-page content isn't truncated.

---

## Phase 3 — SOLID: Entitlement Honesty (LSP)
### 3.1 `src/lib/subscription/entitlement.ts`
```ts
export interface EntitlementService { canAccess(feature): boolean; tier: string; }
export class FreeEntitlement implements EntitlementService { canAccess() { return true; } }
```
- `subscription-guard.ts` returns real interface; `use-subscription.ts` returns `FreeEntitlement` honestly (remove fake `-1`/no-op that *implies* gating).

**Verify:** `subscription.test.ts`.

---

## Phase 4 — Component Decomposition (SRP)
### 4.1 `MockInterview.tsx` (618 →)
`src/components/interview-lab/mock-interview/{Setup,ActiveSession,Complete,useInterview}.tsx`

### 4.2 Standardize error/empty states
- `ResumeLab` raw red `<div>` → `Alert` component (already built in `ui/`).
- Add skeletons to `MockInterview`/`ResumeLab` to match `DashboardView`.

### 4.3 A11y fix
- `QuestionBank`: remove nested interactive (inner "Practice" button inside `role="button"` div) → make card a real `<article>` with a separate button.

**Verify:** `bun run lint`, component render tests.

---

## Phase 5 — Infra & Correctness
### 5.1 Rate limiter (`middleware.ts`)
- Replace in-memory `Map` with **Upstash Redis** (`@upstash/ratelimit`) so it works across Vercel serverless.
- Trust `x-forwarded-for` only behind Vercel proxy; add `x-vercel-ip` fallback.

### 5.2 Font drift (`globals.css`)
- `JetBrains Mono`/`Inter` declared but unused → align to Space Grotesk + Plus Jakarta Sans (per spec) or update spec.

### 5.3 `db.ts`
- Gate `log: ['query']` behind explicit `LOG_QUERIES=1` env (confirm off in prod).

---

## Effort & Sequencing

| Phase | Work | Est. | Risk |
|-------|------|------|------|
| 0 | Doc truth-up + dead-code deletion | 1 day | 🟢 none |
| 1 | AI layer SOLID refactor + zod | 4 days | 🟡 medium (test coverage needed) |
| 2 | Export layer split + pdfkit | 1 day | 🟡 medium |
| 3 | Entitlement honesty | 1 day | 🟢 low |
| 4 | Component decomposition + UI polish | 4 days | 🟡 medium |
| 5 | Rate limiter + fonts + db | 2 days | 🟡 medium |

**Total: ~13 dev-days.** Phases are independently shippable; Phase 0 must land first.

---

## Suggested first PR
**"Phase 0: Reconcile docs & remove dead code"** — smallest diff, zero behavioral risk, unblocks everything.
