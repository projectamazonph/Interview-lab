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
- Rate-limit identity comes only from Vercel's managed client-IP header or an
  explicitly configured trusted reverse-proxy header. Client-supplied
  `x-forwarded-for` and `x-real-ip` values are ignored.
- Every session carries the user's current `sessionVersion`. Incrementing that
  value revokes every older token even when its signature and expiry remain
  valid. `POST /api/auth/logout-all` performs this revocation and clears the
  current session cookie.
- State-changing admin question requests require an exact `Origin` match with
  `NEXT_PUBLIC_APP_URL` and reject cross-site Fetch Metadata. Production fails
  closed when the application URL is missing or invalid.

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
TRUSTED_CLIENT_IP_HEADER # Self-hosted trusted proxy only; never x-forwarded-for
```

## Security Checklist

- [x] No `.env` files committed
- [x] No secrets in code or comments
- [x] No `console.log` of sensitive data
- [x] Input validation on all API endpoints
- [x] SQL injection prevented via Prisma
- [x] XSS prevented via React's default escaping
- [ ] CSRF: admin question mutations have origin/Fetch Metadata enforcement;
  extend the shared policy to every remaining cookie-authenticated mutation
- [x] Rate limiting on auth endpoints
- [x] Rate limiting on AI endpoints (15 req/min per user)
- [x] Account deletion endpoint (DELETE /api/user/me) — requires password confirmation
- [x] All-session revocation endpoint (`POST /api/auth/logout-all`)
- [x] Data export endpoint (GET /api/user/me/export) — GDPR data portability

## GDPR / Data Privacy

Users can request a full data export via `GET /api/user/me/export` and permanent
account deletion via `DELETE /api/user/me` (requires password confirmation in request body).

## AI Content Guardrails

See `docs/07-guardrails.md` for AI safety policies:
- No fabrication of experience
- Truthfulness warnings on resume/coach outputs
- Experience labels: "trained on", "basic familiarity", "hands-on experience"

## Reporting Security Issues

Contact: Report via GitHub Issues with `[Security]` prefix.
