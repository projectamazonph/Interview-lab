# Testing Strategy

## Philosophy

Write tests that verify behavior, not implementation details. Tests should be maintainable, readable, and provide confidence when refactoring.

## Test Structure

```
__tests__/
├── api/                    # API route tests (unit + live-server integration subset)
│   ├── assessments.test.ts
│   ├── auth.test.ts                    # live-server integration (CI only)
│   ├── auth-login.test.ts
│   ├── auth-register.test.ts
│   ├── auth-verify-email.test.ts
│   ├── interview-session.test.ts
│   ├── profile-dashboard.test.ts
│   ├── questions.test.ts
│   ├── questions-count.test.ts
│   ├── questions-interview-ai.test.ts  # live-server integration (CI only)
│   ├── resources.test.ts               # live-server integration (CI only)
│   ├── resume-coverletter.test.ts
│   └── user-paths.test.ts              # live-server integration (CI only)
├── components/             # Component tests
│   ├── auth-context.test.ts
│   ├── hydration-safety.test.ts
│   ├── mock-interview.test.tsx
│   ├── onboarding-quiz.test.tsx
│   ├── resume-lab.test.tsx
│   └── types-constants.test.ts
├── lib/                    # Library unit tests
│   ├── rate-limit.test.ts
│   ├── sanitize.test.ts
│   └── session.test.ts
├── unit/                   # AI/export unit tests
│   ├── ai-handlers.test.ts
│   ├── ai-json.test.ts
│   ├── entitlement.test.ts
│   ├── export-docx.test.ts
│   └── export-pdf.test.ts
└── stress/                 # Load/stress tests
    └── stress-test.ts
```

The four files marked "live-server integration" run twice: once as ordinary Vitest tests against in-memory stubs, and once in CI against a real `next start` server + Postgres (see CI Integration below).

## Test Commands

| Command | Purpose |
|---------|---------|
| `bun run test` | Full Vitest suite |
| `bun run test:api` | API route tests only |
| `bun run test:components` | Component tests only |
| `bun run test:watch` | Watch mode for development |

## Test Coverage Priorities

1. **Auth flows** — register, login, logout, password reset, JWT/tokenVersion validation
2. **Question bank** — filtering, retrieval, pagination
3. **Interview session** — creation, answer submission, server-side scoring
4. **Rate limiting** — DB-backed limiter correctness
5. **AI feedback** — response parsing and scoring breakdown

Interview Lab has no paid tiers (see README) — there is no subscription-gating behavior to test; `checkQuestionBankAccess`/`checkGuideAccess`/etc. exist for structural continuity but always allow.

## CI Integration

`.github/workflows/ci.yml` runs on every push/PR to `main`: TypeScript check, ESLint, `db:push` + `db:seed` against a real Postgres service container, the full Vitest suite, a production build, then boots `next start` and re-runs the four live-server integration tests (`auth.test.ts`, `resources.test.ts`, `questions-interview-ai.test.ts`, `user-paths.test.ts`) against it, followed by a gitleaks secret scan.

```bash
bun run test              # what the "Unit tests" CI step runs
bun run build              # what the "Build" CI step runs
```

## Writing Tests

### API Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('POST /api/auth/register', () => {
  it('creates user with valid email and password', async () => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'secure123' })
    });
    expect(res.status).toBe(201);
  });
  
  it('rejects duplicate email', async () => {
    // ...
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/lib/auth-context';

it('shows login form', () => {
  render(<AuthProvider><LoginForm /></AuthProvider>);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});
```

## Mocking

- Use `vi.mock()` for external dependencies
- Mock AI SDK responses in tests
- Use MSW for HTTP mocking if needed

## Definition of Done for Tests

- [ ] Happy path covered
- [ ] Important failure paths covered
- [ ] Tests pass in CI
- [ ] No flaky tests (retry logic handled properly)
- [ ] Test data cleaned up after tests
