# Redesign Plan — Interview Lab

> **Status:** All phases implemented. See git history for details.

## Design System — Ethereal Glass

- **Palette:** OLED black (`#050505`), radial gradient orbs, glass-morphism cards with `backdrop-blur-xl`
- **Colors:** Indigo/violet accents (`#6366F1`/`#818CF8`), emerald success, amber warnings, rose danger
- **Typography:** Space Grotesk (headings), Plus Jakarta Sans (body), JetBrains Mono (code)
- **Icons:** Phosphor Icons — `weight="light"` only
- **Motion:** Custom cubic-bezier (`ease-premium: 0.32,0.72,0,1`), Framer Motion scroll reveals, stagger containers

## Implemented

### Phase 1: Foundation
- `globals.css` — full design tokens, animation keyframes, glass utilities, grain overlay
- `tailwind.config.ts` — premium color/shadow/animation tokens
- `layout.tsx` — font setup, dark mode default, grain overlay

### Phase 2: Glass Components
- `glass-card.tsx` — double-bezel nested architecture
- `glass-button.tsx` — pill CTA with button-in-button trailing icon
- `glass-input.tsx` — glass input + textarea with icon prefix
- `glass-badge.tsx` — pill badges with 6 variants
- `animations.ts` — Framer Motion variants (fadeUp, stagger, slideUp, scaleIn, cardHover)

### Phase 3: Page Redesigns
- **Landing Page** — floating pill nav, gradient orbs, staggered scroll reveals, bento stats, role cards, pricing tiers, FAQ accordion
- **Auth Screen** — glass card, pill tab switcher, glass inputs, show/hide password
- **AppLayout** — glass sidebar with Phosphor icons, spring-animated mobile drawer
- **Dashboard** — shimmer skeletons, glass stat cards, quick action bento, learning progress
- **All 10 remaining pages** — migrated from white/gray to dark glass palette

### Phase 4: Icon Migration
- Replaced all Lucide icons with Phosphor Icons (light weight)
- Removed `lucide-react` dependency entirely

### Phase 5: Cleanup
- Removed 46 unused npm packages (74 → 28)
- Removed 31 unused shadcn/ui components
- Fixed db.ts production logging, .env JWT secret placeholder
- Deleted dead directories (examples/websocket, mini-services)
