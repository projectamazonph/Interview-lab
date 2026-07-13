# Testing Strategy

## Philosophy

Write tests that verify behavior, not implementation details. Tests should be maintainable, readable, and provide confidence when refactoring.

## Test Structure

```
__tests__/
├── api/                    # API route tests
│   ├── auth.test.ts
│   ├── questions-interview-ai.test.ts
│   ├── profile-dashboard.test.ts
│   ├── resources.test.ts
│   └── user-paths.test.ts
├── components/             # Component tests
│   ├── auth-context.test.ts
│   ├── hydration-safety.test.ts
│   └── types-constants.test.ts
└── stress/                # Load/stress tests
    └── stress-test.ts
```

## Test Commands

| Command | Purpose |
|---------|---------|
| `bun run test` | Full Vitest suite |
| `bun run test:api` | API route tests only |
| `bun run test:components` | Component tests only |
| `bun run test:watch` | Watch mode for development |

## Test Coverage Priorities

1. **Auth flows** — register, login, logout, JWT validation
2. **Question bank** — filtering, retrieval, pagination
3. **Interview session** — creation, answer submission, scoring
4. **Subscription gating** — tier enforcement
5. **AI feedback** — response parsing and scoring breakdown

## CI Integration

Tests run on every PR in GitHub Actions:

```yaml
- name: Tests
  run: CI=true npx vitest run
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
