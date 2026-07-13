# Ponytail Audit — Interview Lab

Repo-wide scan for over-engineering. Ranked biggest cut first.

## Changes Applied

### delete: 31 unused shadcn/ui components (~8,500 lines)
Removed: alert-dialog, aspect-ratio, avatar, breadcrumb, calendar, carousel,
chart, collapsible, command, context-menu, drawer, dropdown-menu, hover-card,
input-otp, menubar, navigation-menu, pagination, radio-group, resizable,
scroll-area, skeleton, slider, sonner, sidebar, toggle, toggle-group, tooltip,
form, popover, table, sheet.
None were imported by any app component.
[paths: src/components/ui/]

### delete: 46 unused npm dependencies
@dnd-kit/* (3), @hookform/resolvers, @mdxeditor/editor, 16 @radix-ui/* packages,
@reactuses/core, @tanstack/react-query, @tanstack/react-table, cmdk, date-fns,
embla-carousel-react, framer-motion, input-otp, next-auth, next-intl, next-themes,
react-day-picker, react-hook-form, react-markdown, react-resizable-panels,
react-syntax-highlighter, recharts, sharp, socket.io, socket.io-client, sonner,
uuid, vaul, zod, zustand.
Zero imports in src/. 74 deps reduced to 28.
[paths: package.json]

### delete: examples/websocket/ directory
Two dead example files (frontend.tsx, server.ts), not imported anywhere.
[paths: examples/websocket/]

### delete: mini-services/ directory
Empty placeholder (only .gitkeep).
[paths: mini-services/]

### shrink: src/hooks/use-mobile.ts (19 lines)
Not imported by any component. Removed.
[paths: src/hooks/use-mobile.ts]

### fix: db.ts — query logging gated to dev only
Was logging all queries in production. Now conditional.
[paths: src/lib/db.ts]

### fix: .env — hardcoded prod JWT secret replaced with placeholder
JWT_SECRET was set to a committed production-sounding value. Now placeholder.
[paths: .env]

## What Was NOT Removed (originally suspected, but actively used)

- auth-helpers.ts — imported by all 26 API routes
- session.ts — imported by auth-helpers + login/register/logout/webhook routes
- password.ts — imported by login/register routes
- rate-limit.ts — imported by login/register routes
- sanitize.ts — imported by 7 API routes
- email-verification.ts — imported by register + verify-email routes
- subscription-guard.ts — imported by 4 client components
- use-subscription.ts — imported by 4 client components
- auth-context.tsx — imported by 16+ components
- pricing.ts — imported by 9 files

## Summary

| Category | Before | After |
|---|---|---|
| UI components | 48 | 17 |
| npm dependencies | 74 | 28 |
| Source lines (src/) | 21,552 | ~12,985 |
| Dead dirs | 3 | 0 |

net: ~8,500 lines removed, 46 packages removed, 3 dirs cleaned.
