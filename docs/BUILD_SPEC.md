# Build Specification

> **Known drift:** the subscription endpoints below (`/api/subscription/status`,
> `/api/subscription/usage`) do not exist — the product has no paid tiers.
> `POST /api/export` only produces DOCX/PDF; Excel export lives in a separate,
> unrelated route (`/api/downloads/[id]`). See `CLAUDE.md` at the repo root
> for the current architecture.

## Objective

Translate the product requirements for **Interview Lab** into small, testable implementation units.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, standalone output) |
| Runtime | Bun |
| Database | Prisma + SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (jose) + HttpOnly cookies |
| UI | Tailwind CSS v4 + custom glass design system |
| Icons | Phosphor Icons (weight="light") |
| Fonts | Space Grotesk + Plus Jakarta Sans |
| AI | Z AI Web Dev SDK |
| Export | docx, PDF (pdfkit), Excel (exceljs) |
| Testing | Vitest |

## First vertical slice

**User registration → Onboarding → Mock interview → Results dashboard**

This slice proves:
1. User or caller initiates the primary action
2. Input is validated
3. Identity and permissions are checked
4. Business rules execute
5. Data is read or written
6. Result is returned and displayed
7. Meaningful failures are logged and recoverable
8. Automated tests verify happy path and failure paths

## Acceptance criteria

- User can register and log in with JWT session
- User completes onboarding with role selection
- User can browse question bank filtered by role/difficulty
- User can start mock interview and answer questions
- User receives AI scoring and feedback after each answer
- User sees session summary with overall score
- Invalid input produces specific, actionable feedback
- Unauthorized actions are rejected server-side
- Success and failure states are observable

## Implementation units

### Interface

| Screen | Routes |
|--------|--------|
| Landing | `/` |
| Login | `/login` |
| Register | `/register` |
| Dashboard | `/dashboard` |
| Onboarding | `/onboarding` |
| Question Bank | `/questions` |
| Mock Interview | `/interview` |
| Resume Lab | `/resume` |
| Cover Letter | `/cover-letter` |
| Downloads | `/downloads` |
| Admin | `/admin` |

### API Routes

| Endpoint | Purpose |
|----------|---------|
| POST /api/auth/register | User registration |
| POST /api/auth/login | User login |
| POST /api/auth/logout | User logout |
| POST /api/auth/verify-email | Email verification |
| GET /api/questions | List questions (role, difficulty filters) |
| GET /api/questions/count | Question count |
| POST /api/interview | Create interview session |
| GET /api/interview/[id] | Get interview session |
| POST /api/interview/[id]/complete | Complete interview |
| GET /api/dashboard | Dashboard aggregation |
| GET /api/profile | Get user profile |
| PUT /api/profile | Update user profile |
| POST /api/resume | Upload resume |
| GET /api/resume/[id] | Get resume |
| POST /api/cover-letter | Generate cover letter |
| GET /api/cover-letter/[id] | Get cover letter |
| GET /api/assessments | List assessments |
| GET /api/assessments/[id] | Get assessment |
| GET /api/guides | List guides |
| GET /api/guides/[id] | Get guide |
| POST /api/guides/progress | Update guide progress |
| GET /api/downloads | List downloads |
| GET /api/downloads/[id] | Get download |
| POST /api/export | Export DOCX/PDF/Excel |
| POST /api/ai/coach | AI interview coach |
| POST /api/ai/resume-review | AI resume review |
| POST /api/ai/cover-letter | AI cover letter generation |
| POST /api/ai/assessment-score | AI assessment scoring |
| GET /api/subscription/status | Get subscription status |
| GET /api/subscription/usage | Get usage limits |
| POST /api/subscription/checkout | Create checkout session |
| POST /api/subscription/webhook | Stripe webhook |
| POST /api/subscription/manage | Manage subscription |
| GET /api/admin/questions | Admin: manage questions |
| GET /api/admin/analytics | Admin: analytics |

### Data Models

See `prisma/schema.prisma` for complete schema.

Key entities:
- User (id, email, passwordHash, subscriptionTier, isAdmin)
- UserProfile (targetRole, experienceLevel, toolsKnown, weakAreas)
- Question (role, difficulty, type, skillArea, question, rubric)
- InterviewSession (userId, mode, targetRole, overallScore, transcript)
- QuestionAttempt (sessionId, questionId, userAnswer, aiFeedback, score)
- Resume (userId, originalText, improvedVersion, truthFlags)
- CoverLetter (userId, jobDescription, tone, generatedLetter)

## Test-first sequence

1. Write acceptance criteria
2. Add smallest failing test
3. Implement minimum passing change
4. Run targeted tests, then broader checks
5. Refactor while green
6. Record loop in BUILD_LOG.md

## Commands

```bash
bun install           # Install dependencies
bun run dev           # Start dev server
bun run build         # Production build
bun run test          # Vitest suite
bun run test:api      # API tests only
bun run lint          # ESLint
bun run db:push       # Schema push (dev)
bun run db:generate  # Generate Prisma client
```
