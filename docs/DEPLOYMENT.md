# Deployment Guide

## Environment Overview

| Environment | Purpose | Database |
|-------------|---------|----------|
| Local dev | Development | PostgreSQL |
| Vercel | Production | PostgreSQL |

PostgreSQL is used everywhere — `prisma/schema.prisma` sets `provider = "postgresql"` and there is no SQLite fallback. Run a local Postgres instance (Docker is the easiest: `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`) for local development.

## Local Development

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your local Postgres connection string, JWT_SECRET, etc.

# Push schema to your local PostgreSQL database
bun run db:push

# Start dev server
bun run dev
```

## Production Deployment (Vercel)

### Prerequisites

1. Vercel account connected to GitHub
2. A **pooled** PostgreSQL connection (Neon, Supabase, or PgBouncer in front of any Postgres) — see "Connection pooling" below
3. Environment variables configured in Vercel dashboard

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Pooled PostgreSQL connection string, used at request time | `postgresql://user:pass@host-pooler/db?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Unpooled connection, used only for `db:push`/`db:migrate` | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Production URL | `https://interview-lab.vercel.app` |
| `CRON_SECRET` | Authorizes the scheduled `/api/cron/cleanup` route | `openssl rand -base64 32` |

See `.env.example` for the full list, including optional rate-limit overrides.

### Connection pooling

API routes run as short-lived serverless functions. Each concurrent invocation can open its own Postgres connection, and under real concurrent traffic (hundreds of simultaneous users) that will exhaust Postgres's default `max_connections` (~100) if `DATABASE_URL` points at a direct, unpooled connection. Always point `DATABASE_URL` at your provider's pooled endpoint:

- **Neon**: use the `-pooler` host variant.
- **Supabase**: use the port `6543` (Supavisor transaction pooler) connection string.
- **Self-hosted**: put PgBouncer (transaction pooling mode) in front of Postgres.

`DIRECT_URL` should be the same database's unpooled connection — Prisma uses it only for `db:push`/`db:migrate`, which need a session-mode connection a transaction pooler doesn't support.

### Deployment Steps

1. Push to main branch triggers automatic deployment
2. Vercel runs `bun run build` which includes `prisma generate`
3. Standalone output serves from `.next/standalone`
4. Prisma client generated during build via `postinstall`

### Build Command

```bash
bun run build  # Runs: prisma generate && next build
```

### Database Migrations

```bash
# Create migration
bun run db:migrate

# Push schema (dev only)
bun run db:push

# Reset database
bun run db:reset
```

### Scheduled cleanup

`vercel.json` defines a `crons` entry that hits `/api/cron/cleanup` hourly to sweep expired `RateLimitEntry` and `VerificationToken` rows (both tables would otherwise grow unboundedly). Vercel automatically signs cron requests with `Authorization: Bearer $CRON_SECRET` when that env var is set on the project — make sure it's configured, or the cron job will get 401s.

### Rate limiting

`src/middleware.ts` runs on the Node.js runtime (via `export const config = { runtime: 'nodejs' }`) so it can back its per-IP rate limit with Postgres (`src/lib/rate-limit.ts`) instead of an in-memory `Map`. This matters for correctness, not just performance: an in-memory limiter is scoped to a single serverless instance, so under concurrent traffic across multiple instances the real effective limit would be far higher than configured, and resets on every cold start.

## Post-Deployment Checklist

- [ ] `DATABASE_URL` points at a pooled connection, `DIRECT_URL` at the unpooled one
- [ ] `CRON_SECRET` set so the scheduled cleanup job authorizes correctly
- [ ] Database schema pushed/migrated
- [ ] Environment variables set in Vercel
- [ ] Build succeeds
- [ ] Health check passes
- [ ] Auth flows work (including password reset)
- [ ] AI features respond correctly
