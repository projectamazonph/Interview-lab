# Engineering Diary

## Purpose

Record significant engineering decisions, experiments, and lessons learned during development.

## 2026-07-13: Project Bootstrap

### Action
Added standard documentation profile to existing Interview Lab project.

### Decision
- Profile: standard (production app with monetization potential)
- Layout: web-app
- Documents created: 10 new files
- Documents preserved: 3 (README, ARCHITECTURE, DECISIONS)
- Documents marked stale: 1 (AGENTS.md)

### Evidence
- Ran audit: `python3 scripts/audit_repository.py --target . --profile standard`
- Detected stack: Next.js + TypeScript + Bun
- Multiple lockfiles warning: bun.lock + package-lock.json

### Notes
- Existing docs in `docs/` are comprehensive (13 detailed documents)
- AGENTS.md updated to reflect Next.js 16.1.1 (2026-07-16)
- No environment examples detected
- Prisma schema uses PostgreSQL but dev uses SQLite

---

## 2026-07-10: PONYTAIL Audit Applied

### Action
Reduced dependencies from 74 to 28 packages.

### Decision
Pruned unused packages to reduce maintenance burden and build times.

### Evidence
See `PONYTAIL-AUDIT.md` for full details.

---

## 2026-07-16: Doc Freshness Audit

### Action
Audited all 26 docs for stale/outdated content against current project state.

### Changes
- `docs/architecture.md` — Next.js 15 → 16.1.1, route structure updated to match actual routes, DB schema expanded to include all 17 models, API routes list expanded to 35 endpoints
- `docs/decisions.md` — ADR-001 Next.js 15 → 16.1.1 + React 19 consequences
- `docs/BUILD_SPEC.md` — API routes list expanded from 10 to 35
- `docs/BUILD_LOG.md` — Pending actions resolved as completed
- `docs/ENGINEERING_DIARY.md` — Notes updated to reflect AGENTS.md is current

### Evidence
Cross-referenced against: `package.json` (dependencies), `prisma/schema.prisma` (17 models), `src/app/api/**/route.ts` (35 route files), `AGENTS.md` (current).

---

## Older Entries

See `WORKLOG.md` for previous engineering decisions and development sessions.
