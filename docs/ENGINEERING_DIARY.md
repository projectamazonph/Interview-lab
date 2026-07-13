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
- AGENTS.md needs update (references Next.js 16 vs actual 16.1.1)
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

## Older Entries

See `WORKLOG.md` for previous engineering decisions and development sessions.
