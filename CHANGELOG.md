# Changelog

Record user-visible and operationally meaningful changes. Use semantic versioning when the project begins releasing versions.

## [Unreleased]

### Added

- Project foundation and engineering documentation bootstrap on 2026-07-13.
- Standard documentation profile created: BUILD_LOG, BUILD_SPEC, PRD, ROADMAP, TESTING, SECURITY, DEPLOYMENT, ENGINEERING_DIARY, ERROR_LOG, LOOP_ENGINEERING.
- CONTRIBUTING.md and CHANGELOG.md added.
- PR template added to `.github/pull_request_template.md`.
- Revocation-aware session versions and `POST /api/auth/logout-all`.
- Prisma migration baseline and incremental session-version migration.

### Changed

- CI now applies committed Prisma migrations instead of inferring schema changes with `db push`.
- Session restoration resolves the current database user and rejects revoked token versions.

### Fixed

- Admin question mutations now reject missing, opaque, or cross-origin browser
  requests before database writes.
- Persistent login and registration rate limits no longer trust spoofable forwarding headers.
- Middleware rate limits use only the verified hosting proxy identity contract.
