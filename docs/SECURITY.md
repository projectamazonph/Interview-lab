# Security Policy

## Overview

Interview Lab handles user credentials, resume content, and interview data. Security is a first-class concern.

## Authentication

- JWT tokens signed with strong secrets (minimum 256 bits)
- Tokens stored in HttpOnly cookies (not localStorage for auth tokens)
- Client-side token caching in localStorage for UI state only
- Token expiration: 7 days, with refresh capability
- Passwords hashed with bcrypt (cost factor 12)

## Authorization

- Server-side auth checks on all protected routes
- Admin routes require `isAdmin: true` in user record
- Subscription tier checks enforced in API, not just UI
- Rate limiting on auth endpoints (10 attempts per minute)

## Data Protection

| Data Type | Protection |
|-----------|------------|
| Passwords | bcrypt hashed, never logged or returned |
| JWT Secrets | Environment variable, never committed |
| User Resumes | Isolated by user ID, no public access |
| AI Feedback | Stored with session, user-owned |
| API Keys | Environment variables, server-side only |

## Environment Variables

Required secrets (never commit to git):

```bash
DATABASE_URL          # PostgreSQL connection string
JWT_SECRET            # min 256-bit random string
NEXT_PUBLIC_APP_URL   # Public app URL
```

## Security Checklist

- [ ] No `.env` files committed
- [ ] No secrets in code or comments
- [ ] No `console.log` of sensitive data
- [ ] Input validation on all API endpoints
- [ ] SQL injection prevented via Prisma
- [ ] XSS prevented via React's default escaping
- [ ] CSRF protected via SameSite cookies
- [ ] Rate limiting on auth endpoints

## AI Content Guardrails

See `docs/07-guardrails.md` for AI safety policies:
- No fabrication of experience
- Truthfulness warnings on resume/coach outputs
- Experience labels: "trained on", "basic familiarity", "hands-on experience"

## Reporting Security Issues

Contact: Report via GitHub Issues with `[Security]` prefix.
