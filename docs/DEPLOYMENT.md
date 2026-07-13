# Deployment Guide

## Environment Overview

| Environment | Purpose | Database |
|-------------|---------|----------|
| Local dev | Development | SQLite |
| Vercel | Production | PostgreSQL |

## Local Development

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env  # If exists, or create manually
# Edit .env with your values

# Push schema to local SQLite
bun run db:push

# Start dev server
bun run dev
```

## Production Deployment (Vercel)

### Prerequisites

1. Vercel account connected to GitHub
2. PostgreSQL database (Neon, Supabase, or similar)
3. Environment variables configured in Vercel dashboard

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | JWT signing secret (min 256 bits) | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Production URL | `https://interview-lab.vercel.app` |

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

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables set in Vercel
- [ ] Build succeeds
- [ ] Health check passes
- [ ] Auth flows work
- [ ] AI features respond correctly
