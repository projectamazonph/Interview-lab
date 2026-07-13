# Error Log

## Purpose

Track recurring errors, their root causes, and resolutions.

## Known Issues

| Issue | Root Cause | Status | Resolution |
|-------|------------|--------|------------|
| Multiple lockfiles (bun.lock + package-lock.json) | Mixed package managers | Known | Use Bun exclusively for consistency |
| No .env.example | Environment template missing | Known | Create from required vars |
| Prisma schema uses PostgreSQL but dev uses SQLite | Dev/prod mismatch | Known | SQLite for dev, PostgreSQL for prod |

## AI-Specific Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| AI scoring timeout | Z AI SDK response time | Implement timeout handling |
| Invalid JSON from AI | Malformed response | Add response validation |

## Common Development Issues

### Bun commands not found
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### Prisma client not generated
```bash
bun run db:generate
```

### Build fails with missing env vars
Ensure `.env` exists with required variables:
- DATABASE_URL
- JWT_SECRET
- NEXT_PUBLIC_APP_URL

---

*Add new errors here as they are discovered and resolved.*
