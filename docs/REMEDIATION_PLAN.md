# Interview Lab Remediation and Modernization Plan

**Status:** Implementation in progress on `feat/remediation-foundation`
**Risk:** High (authentication, secrets, AI providers, database migration, and broad deletion)
**Baseline:** `main` at `f1b4cce`; 38 test files and approximately 380 `it`/`test` declarations found by static inventory. The full suite, build, lint, and coverage baseline must still be established in a working Bun environment.

### Implementation ledger

| Date | Slice | Evidence | Status | Next |
| --- | --- | --- | --- | --- |
| 2026-08-21 | Reproducible default test suite | 426 passed, 85 opt-in live-server tests skipped without `TEST_BASE_URL` | Complete | Run live-server phase with PostgreSQL |
| 2026-08-21 | Trusted client-IP policy | Valid Red reproduced rotating `x-forwarded-for` bypass; 20 focused tests Green; new helper at 100% coverage | Complete | Current-database authorization |
| 2026-08-21 | Session revocation | JWT/database version matching, centralized session restore, additive migration, and logout-all endpoint | Complete in code | Rehearse migration and live-server flow on PostgreSQL |
| 2026-08-21 | Repository baseline | TypeScript pass; build pass; lint 0 errors/30 warnings; total coverage 38.81% statements, 39.71% branches, 38.48% functions, 40.11% lines | Partial | Warning cleanup and coverage closure by vertical slice |

## 1. Outcomes

This program will:

1. Remove payment, subscription, pricing, tier, upgrade, and monetization behavior from the product and data model.
2. Repair the AI workflows and make their provider/model configuration manageable by administrators.
3. Support mainstream LLM providers and custom OpenAI-compatible endpoints without coupling product features to a vendor SDK.
4. Close the confirmed security, reliability, accessibility, content, and documentation gaps from the audit.
5. Replace temporary/placeholder visual assets and unsupported marketing claims with verified copy and purpose-built generated imagery.
6. Enforce test-driven development, SOLID boundaries, and non-bypassable quality gates.
7. Reach complete, explicitly measured automated coverage for owned application code, with critical user journeys also covered by integration and browser tests.
8. Replace Interview Lab's current Field Manual styling with a global React/Tailwind implementation of the `amazon-ph-simulators` **Amazon Pro** design system.

## 2. Non-negotiable engineering protocol

Every behavior change follows one observable Red-Green-Refactor loop. Production behavior must not be written before a test fails for the intended reason. Refactors require characterization tests first. Tests may not be deleted, skipped, weakened, or replaced by snapshots merely to make a gate pass.

### Required loop record

Each PR must record:

- Behavior and acceptance example.
- Test level and command.
- Red failure and why it is valid.
- Smallest Green change and passing result.
- Refactor performed, if any.
- Related regression checks.
- Remaining risk.

### SOLID enforcement

The provider/model feature has these real change axes:

| Change axis | Owner | Stable contract | Volatile detail | Required proof |
| --- | --- | --- | --- | --- |
| AI use case | Feature service | structured completion request/result | prompt and response schema | unit + schema tests |
| Provider transport | provider adapter | `LLMProvider` contract | vendor SDK/HTTP API | shared contract suite |
| Provider selection | resolver | enabled configuration resolves to adapter/model | database and defaults | integration tests |
| Secret storage | credential vault | write/decrypt/rotate without disclosure | encryption implementation | security tests |
| Admin management | admin use case/API | authenticated CRUD/test/activate contract | Next.js transport/UI | API + component + E2E tests |
| Observability | run recorder | redacted outcome/latency/token metadata | provider response formats | integration tests |

Dependency direction must be `feature policy -> LLM contract <- provider adapters`. Next.js, Prisma, vendor SDKs, and environment access stay in infrastructure/composition code. Adding a provider must not require editing feature prompts or route handlers. All adapters must pass the same contract tests; unsupported capabilities must be represented as explicit capabilities, not no-op methods.

### Completion gates

A PR is not complete until all applicable checks pass:

```bash
bun install --frozen-lockfile
bunx prisma validate
bunx prisma generate
bunx tsc --noEmit
bun run lint
bun run test:coverage
bun run build
```

Schema and critical-flow PRs must also run a real PostgreSQL migration test, seed test, live-server API suite, and browser E2E suite. CI must reject focused tests, `.only`, unexpected `.skip`/`.todo`, reduced coverage, leaked secrets, or a dirty generated-code diff.

## 3. Target AI architecture

### Domain contracts

- `LLMCompletionRequest`: messages/system prompt, response format, temperature, token limit, timeout, abort signal, and feature identifier.
- `LLMCompletionResult`: content, normalized finish reason, provider/model IDs, usage when available, latency, and request correlation ID.
- `LLMProvider`: completion plus declared capabilities.
- `ProviderResolver`: resolves the active enabled configuration for a feature and returns a configured adapter.
- `CredentialVault`: encrypts/decrypts versioned credentials and supports rotation; plaintext never crosses the service boundary or appears in API responses/logs.
- `ModelConfigurationRepository`: persists provider metadata, model entries, per-feature defaults, status, and timestamps.

The existing `src/lib/ai/client.ts` seam will be evolved rather than duplicated. The exported global `ai = new ZAIProvider()` singleton will be removed; handlers will receive a resolver/use-case dependency through the composition root.

### Provider options

First-party presets:

- OpenAI
- Anthropic
- Google Gemini
- Azure OpenAI
- Amazon Bedrock
- Mistral
- Groq
- OpenRouter
- Existing Z AI integration, retained only if its runtime contract is verified

Custom providers use an OpenAI-compatible endpoint with admin-supplied display name, base URL, API key, model ID, optional organization/project headers, timeout, and additional allow-listed headers. URLs must be HTTPS outside local development; private/link-local/metadata addresses and redirect escapes must be blocked to prevent SSRF. Arbitrary headers, query-string secrets, and browser-side credentials are prohibited.

### Persistence

Add normalized models (names are provisional until the migration PR):

- `LlmProviderConfig`: ID, provider kind, display name, encrypted credential envelope, base URL, enabled state, validation status, timestamps, and optimistic-lock version.
- `LlmModelConfig`: provider relation, provider model ID, display name, capabilities, context/output limits when known, enabled state, and timestamps.
- `LlmFeatureRouting`: feature key, primary model, optional fallback model, timeout, and timestamps.

Do not store secrets in the generic string-valued `AppSetting` table. Use authenticated encryption (AES-256-GCM or a managed KMS envelope), a versioned server-only master key, unique nonce per value, and rotation metadata. The admin read API returns only `hasCredential` and a safe suffix/fingerprint, never ciphertext or plaintext.

### Admin page

Add an **AI Providers** section to the authenticated admin area with:

- Provider list, enabled/disabled and health states.
- Add/edit provider preset or custom endpoint.
- Write-only API key input with replace/remove semantics.
- Models list with manual model entry and optional provider discovery.
- Per-feature model assignment for coach, assessment scoring, resume review, and cover-letter generation.
- Test connection action using a minimal non-user prompt, explicit timeout, redacted error, and audit event.
- Activate/change confirmation, safe fallback selection, and warning before disabling an in-use model.
- Credential rotation and last-tested metadata.

All mutations require a freshly resolved database admin identity, CSRF protection, strict schemas, audit logging, rate limiting, and generic client errors. Provider diagnostics must redact keys, authorization headers, prompt content, and raw vendor payloads.

### AI reliability fixes

- Validate provider output against feature-specific runtime schemas; TypeScript generics alone are insufficient.
- Distinguish timeout, cancellation, authentication, rate limit, unavailable model, malformed output, and provider outage errors.
- Use bounded retry with jitter only for safe transient failures; never retry validation/authentication failures blindly.
- Add optional, explicitly configured fallback routing with loop prevention and a total time budget.
- Preserve truthfulness and anti-fabrication guardrails for resumes, cover letters, and coaching.
- Record redacted `AgentRun` metadata for provider/model, latency, success/failure category, usage, and safety outcome.
- Provide a deterministic, honest user fallback when AI is unavailable; do not present canned content as model-generated.

## 4. Payment and tier removal

This is a removal migration, not a dormant-code cleanup.

### Inventory to delete or simplify

- Prisma: `Subscription`, `Payment`, `User.subscriptionTier`, their relations, Stripe fields, and tier-only indexes/data.
- Content: `Download.accessTier` becomes unnecessary; every valid resource is available based on normal authentication/content status.
- Code: subscription guards, entitlement implementation, subscription hook, pricing page, upgrade modal, subscription banner, tier types/constants, and all related callers.
- Seed/tests: pro/starter users, tiered downloads, entitlement/guard tests, and tier-based fixtures/assertions.
- Copy/docs: pricing, upgrade, subscription, payment history, Stripe, monetization phases, and nonexistent subscription API routes.
- CI/PR template: replace the subscription acceptance item with free-access and authorization checks.

### Safe migration sequence

1. Characterize current free-access behavior with API and UI tests.
2. Query production-like data counts for subscription/payment rows and export a rollback archive before destructive migration.
3. Remove runtime reads/writes and make all resources independent of tier fields.
4. Deploy compatibility code that tolerates old columns while no longer using them.
5. Apply a reviewed migration that drops foreign keys, tables, relations, and columns; verify on a restored production snapshot.
6. Remove compatibility code and stale tests/docs.

Rollback requires a documented database backup/restore point. A down migration that recreates empty payment tables is not adequate if rows existed.

### Acceptance behavior

- No pricing/upgrade/payment/subscription UI, routes, imports, schema fields, seed values, docs, or product metadata remain.
- Every authenticated user can access every published interview, guide, download, resume, cover-letter, and practice-test capability subject only to legitimate safety/rate limits.
- Authorization remains user/admin based; removing tiers must not weaken ownership checks.

## 5. Security and platform gaps

### P0 — before feature expansion

1. **Trusted client IP:** stop trusting the first unverified `x-forwarded-for` value. Parse only the platform-defined trusted header/proxy chain, use a safe fallback, and test spoofing and malformed lists.
2. **Fresh authorization:** stop authorizing from stale JWT `isAdmin`/tier claims. Resolve the current user record for protected actions. Remove tier claims as part of payment removal.
3. **Session revocation:** add a session version or server-side session record; increment/revoke after password change, account disablement, privilege changes, and security events.
4. **AI secrets:** encrypted storage, strict redaction, server-only access, rotation procedure, and secret scanning.
5. **Admin mutation protection:** current database authorization, CSRF/origin checks, validation, rate limiting, and audit trail.

### P1 — reliability and correctness

- Replace in-memory global API rate limiting with a shared production store or platform rate-limit service; preserve deterministic local/test adapters.
- Define runtime schemas for request bodies and serialized JSON fields at API boundaries.
- Review manually serialized JSON columns and migrate high-value structures to PostgreSQL `Json` only where the compatibility benefit justifies it.
- Add consistent correlation IDs and structured, privacy-safe errors/metrics.
- Test ownership on every `[id]` route and enumeration-resistant not-found responses.
- Add accessibility checks for keyboard navigation, focus, names, contrast, reduced motion, and mobile layouts.

## 6. Visual content and claim integrity

Create an asset manifest before generating anything: current path, consumer, purpose, dimensions/aspect ratio, alt text, status, and replacement prompt. Review every SVG under `public/images/illustrations`, the OG image, logos, empty states, and landing-page visuals.

Replace only assets confirmed to be placeholders, low-quality, duplicated, misleading, or inconsistent with the Field Manual system. Generate cohesive, original illustrations depicting Filipino Amazon VA candidates in realistic remote-work/interview contexts. Do not generate UI screenshots, logos, certificates, employer marks, or factual diagrams. Export optimized WebP/AVIF with responsive sizes while retaining an accessible fallback where needed.

Remove or substantiate marketing claims such as “70%,” “3x higher offer rate,” “hired within 2 weeks,” and testimonials. Unverified statistics/testimonials must be rewritten as non-quantified product benefits, not decorated with generated identities or implied evidence.

Visual acceptance requires desktop and mobile screenshot comparison, no layout shift, meaningful alt text (or empty alt for decorative images), acceptable image weight, correct social-preview rendering, and no placeholder asset references.

## 7. Global Amazon Pro theme migration

The canonical visual reference is `projectamazonph/amazon-ph-simulators` at audited commit `4c0e5f33b09feedbac1df6f2e1ea19cfb84e882e`, specifically `assets/tokens.css`, `assets/shell.css`, `assets/responsive.css`, the component rules in `assets/skin.css`, and `tests/design-system-contract.test.cjs`. Reconfirm the source commit immediately before implementation so upstream theme changes are either deliberately included or pinned.

### Target identity

Interview Lab will use the same **Amazon Pro** visual language:

- Brand/navy: `#131921` with the supporting navy scale.
- Primary accent: Amazon orange `#FF9900`, including hover/pressed/tint variants.
- Seller Central-style light surfaces: `#F7F8FA` page, white cards, subtle gray borders, restrained shadows.
- Text/link/semantic palettes matching the simulator tokens, including Amazon link blue and green/amber/red states.
- Typography: Archivo for display, PT Sans for body, IBM Plex Mono for technical data, and Barlow Condensed only for compact labels.
- 4px spacing system, 6px controls, 8px cards, 44px minimum interactive targets, fluid headings, and the simulator breakpoint semantics.
- Shared Project Amazon PH Academy chrome, confident training/operator voice, visible orange keyboard focus, reduced-motion support, and responsive mobile navigation.

### Architecture decision

Do **not** copy `skin.css` or `shell.js` into the Next.js application. Those files are compatibility layers for standalone legacy HTML pages and rely on broad selectors, `!important`, DOM injection, and hidden native chrome. Interview Lab will implement the same design semantics natively:

- Map canonical simulator tokens into `src/app/globals.css` CSS variables and Tailwind v4 theme variables.
- Create or normalize semantic primitives for buttons, cards, badges/chips, fields, dialogs, tabs, tables, alerts, navigation, and page containers.
- Build one React application shell for public, authenticated, and admin contexts with explicit variants, shared header/footer behavior, mobile drawer, skip link, focus management, and safe-area handling.
- Keep product feature layouts distinct. The global theme owns tokens and primitive appearance; Resume Lab, Mock Interview, Question Bank, Practice Tests, Learning Paths, Download Center, dashboard, and admin retain task-specific information architecture.
- Remove legacy `glass-*`/`Field*` naming during migration when it obscures the Amazon Pro contract; use temporary compatibility exports only to keep each PR small.
- Ban new arbitrary brand hex values, page-level font imports, duplicate shells, and feature-local reimplementations of shared primitives.

### Migration sequence

1. Create a cross-repository token/component parity matrix and approve intentional differences required by Interview Lab accessibility or framework constraints.
2. Add characterization screenshots and interaction tests for every current route at phone, tablet, and desktop widths.
3. Introduce Amazon Pro tokens, locally bundled fonts, base/reset rules, focus/reduced-motion behavior, and theme contract tests without changing feature behavior.
4. Implement the shared shell and primitives in Storybook-equivalent fixture pages or test harnesses before migrating feature pages.
5. Migrate one vertical slice at a time: public/auth, dashboard/shell, interview tools, document tools, learning/resources, then admin/AI providers.
6. Remove Field Manual tokens, hard-coded colors, legacy component aliases, and duplicate chrome only after repository-wide caller migration is proven Green.
7. Regenerate product imagery and screenshots against the completed theme, then update README/metadata/docs.

### Theme tests and acceptance

- Static contract test ensures required canonical tokens exist and forbidden legacy/hard-coded brand values do not reappear.
- Shared component contract tests cover all variants and disabled/loading/error/focus states.
- Browser tests cover drawer focus trap, Escape/outside close, active navigation, skip link, keyboard-only operation, reduced motion, and 44px targets.
- Automated accessibility checks pass WCAG 2.2 AA for critical pages; semantic state colors are not the only signal.
- Visual regression baselines cover all routes at 320/375/768/1024/1440px and light mode. Dark mode is out of scope unless separately requested.
- No horizontal overflow, clipped dialogs, hidden content behind fixed chrome, duplicate headers/footers, cumulative layout shift from fonts/images, or route-specific theme drift.
- A reviewer opening Interview Lab beside SimGrid immediately recognizes the same Project Amazon PH Academy system while each Interview Lab tool remains functionally distinct.

## 8. Complete test coverage program

“Complete coverage” means both metric completeness and behavioral completeness. A 100% line number alone is not sufficient.

### Coverage policy

- CI thresholds: 100% statements, branches, functions, and lines for owned application code in the agreed coverage scope.
- Exclusions are limited to framework-only thin route/page composition, generated files, type-only declarations, and design-system primitives already covered by higher-value shared tests. Every exclusion requires an inline reason and review; exclusions may not hide business logic.
- Move logic out of excluded `page.tsx`/`layout.tsx` files when it contains behavior.
- Publish text and LCOV reports as CI artifacts; fail any threshold regression.

### Required layers

1. Pure unit tests for policies, parsing, validation, routing, retry, redaction, and encryption envelopes.
2. Shared provider contract tests for every adapter, including timeout, abort, malformed output, auth failure, rate limit, and capability reporting.
3. API integration tests with PostgreSQL for authentication, ownership, admin configuration, provider switching, payment-removal invariants, and migrations.
4. Component tests for admin provider/model workflows and every material error/empty/loading state.
5. Browser E2E tests for register/login/onboarding, full mock interview, resume review, cover letter, practice test, downloads, admin provider setup/test/activate, access denial, and logout/revocation.
6. Security tests for header spoofing, SSRF, CSRF, secret disclosure, stale privilege, IDOR, rate limiting, and malformed AI payloads.
7. Accessibility tests plus manual keyboard/screen-reader and responsive verification for critical routes.
8. Migration tests from the current schema with representative payment/tier data and rollback/restore rehearsal.

Flaky tests are defects: control time, IDs, randomness, network, and shared state; use narrow fakes at architectural boundaries and real PostgreSQL for persistence contracts.

## 9. Documentation truth pass

Update documentation in the same PR as behavior; do not defer it to the end. Establish these authoritative documents:

- `README.md`: current product, free-access policy, setup, configuration, verified commands, screenshots, and links.
- `AGENTS.md` / `CLAUDE.md`: identical current constraints for free access, provider architecture, secrets, TDD/SOLID gates, and supported commands.
- `docs/architecture.md`: actual routes, current schema, auth/session flow, AI boundaries, and diagrams.
- `docs/TESTING.md`: real directory inventory, test layers, coverage policy, Red-Green-Refactor evidence, and exact CI sequence.
- `docs/SECURITY.md`: threat model, trusted proxy assumptions, session revocation, credential encryption/rotation, SSRF/CSRF controls, and incident response.
- `docs/DEPLOYMENT.md`: required env vars, encryption-key rotation, migration/backup/restore, provider bootstrap, health checks, and rollback.
- `docs/ROADMAP.md`: delete monetization; replace with security, AI administration, content quality, and verified advanced features.
- `docs/decisions.md`: ADRs for free-only product, provider adapter architecture, encrypted credentials, runtime schema validation, and complete-coverage policy.
- Design-system documentation: canonical SimGrid commit, token parity matrix, shared component catalog, layout rules, imagery guidance, accessibility requirements, and visual-regression update procedure.

Archive or rewrite speculative duplicate PRDs/build specs so they are clearly historical and cannot be mistaken for current behavior. Remove nonexistent subscription routes, SQLite/NextAuth claims, stale test counts, missing-document links, and unresolved “TBD” claims once verified.

## 10. Delivery sequence

### Milestone 0 — reproducible baseline

- Repair local dependency/bootstrap instructions without changing locked dependencies.
- Run and record type, lint, tests, coverage, build, seed, and live-server results.
- Produce coverage map, route/ownership matrix, asset manifest, documentation drift matrix, and data-migration inventory.
- Exit: every later change can be compared to a trusted baseline; pre-existing failures are explicitly separated.

### Milestone 1 — security foundation

- Trusted IP handling, current-database authorization, session revocation, shared rate-limit design, admin mutation controls, logging/redaction.
- Exit: security regression suite passes and privilege changes take effect immediately.

### Milestone 2 — payment removal

- Free-access characterization, compatibility release, backup/data decision, schema migration, code/UI/test/doc deletion.
- Exit: repository-wide forbidden-term scan is clean except legitimate Amazon product-pricing training content and historical migration notes.

### Milestone 3 — provider core and AI repair

- Runtime schemas, provider contracts, resolver, vault, persistence, adapters, normalized errors, fallback policy, observability.
- Exit: all adapters pass the contract suite and existing AI features pass against deterministic fakes plus opt-in provider smoke tests.

### Milestone 4 — admin provider/model page

- Admin APIs, configuration UI, test connection, model/feature routing, activation safety, audit events.
- Exit: full admin E2E succeeds; secrets cannot be read back or leaked.

### Milestone 5 — Amazon Pro global theme

- Token parity matrix, native React/Tailwind primitives, shared shell, page-by-page migration, accessibility and visual-regression coverage.
- Exit: every route passes theme contracts and responsive visual review with no Field Manual or duplicate-shell residue.

### Milestone 6 — content and visual integrity

- Claim cleanup, generated asset replacements, accessibility/performance validation, updated screenshots/OG assets.
- Exit: asset manifest is complete and responsive visual review passes.

### Milestone 7 — coverage closure and documentation

- Close uncovered branches/behaviors one TDD loop at a time, enforce thresholds, reconcile all canonical docs and archive stale documents.
- Exit: all gates pass at required thresholds on a clean checkout and production-like database.

## 11. PR strategy and checkpoints

Use small, reversible PRs; never combine destructive schema removal with the new provider system. Recommended order:

1. Baseline tooling/CI and documentation inventory.
2. Trusted IP and current-role authorization.
3. Session revocation and security tests.
4. Free-access characterization and UI/code removal.
5. Payment/tier database migration.
6. LLM contracts, schemas, and Z-AI characterization.
7. Credential vault and provider configuration persistence.
8. Provider adapters and contract suites.
9. Admin APIs and UI.
10. AI feature migration/reliability/fallback/observability.
11. Amazon Pro tokens, font assets, contract tests, and shared primitives.
12. Shared shell and public/auth/dashboard migration.
13. Feature and admin page theme migration.
14. Generated visual assets, refreshed screenshots, and claim cleanup.
15. Coverage closure, canonical docs, and final release gate.

Each PR needs a rollback note, migration impact, actual Red/Green evidence, changed docs, final diff review, and a binary PASS/BLOCKED gate result. Destructive database work and encryption-key changes require an explicit deployment checkpoint after backup verification.

## 12. Final acceptance checklist

- [ ] Payment, subscription, pricing, tier, upgrade, Stripe, and monetization product behavior is removed end to end.
- [ ] Admins can securely add, test, enable, disable, and route supported or custom LLM providers/models.
- [ ] API keys are encrypted, write-only, redacted, rotatable, and never sent to the browser after submission.
- [ ] Every AI feature validates structured output, handles provider failure honestly, and records privacy-safe diagnostics.
- [ ] Confirmed security findings have permanent regression tests.
- [ ] All owned application code meets 100% statement/branch/function/line thresholds with reviewed exclusions.
- [ ] Critical user/admin journeys pass against a production build and real PostgreSQL.
- [ ] Accessibility, responsive layouts, image performance, and social previews pass review.
- [ ] Every route uses the native Amazon Pro global theme sourced from the audited simulator design tokens and shared component contracts.
- [ ] No stale Field Manual styling, duplicate chrome, arbitrary brand colors, page-specific fonts, or broad legacy CSS overrides remain.
- [ ] All claims are substantiated or rewritten; confirmed placeholders are replaced with approved generated assets.
- [ ] README, engineering instructions, architecture, security, testing, deployment, roadmap, and ADRs match the shipped system.
- [ ] Type, lint, Prisma, test, coverage, build, integration, E2E, migration, secret-scan, and diff-integrity gates all report PASS.

## 13. Decisions required before destructive implementation

1. Confirm whether any production `Subscription` or `Payment` records must be retained outside the live database for accounting/audit purposes and define the retention period.
2. Choose the credential root-of-trust for production: managed KMS/secret manager is preferred; otherwise provide a dedicated versioned encryption key separate from `JWT_SECRET`.
3. Confirm which provider presets should ship enabled in the first release. The architecture can support all listed providers without requiring every adapter in the first deploy.
4. Confirm whether AI routing is global only or may be overridden per feature; this plan recommends per-feature routing with one global default.
5. Approve replacement or removal of unverified statistics and testimonials; generated people must never be presented as real customers.
