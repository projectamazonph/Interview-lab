# Architecture Decision Records — Interview Lab

**Format:** Michael Nygard's ADR template

---

## ADR-001: Next.js 15 with App Router (Standalone Output)

**Status:** ✅ ACCEPTED

**Context:** Need a React framework with SSR, API routes, and Vercel deployment support. The app requires rich interactivity for interview sessions alongside static marketing pages.

**Decision:** Use Next.js 15 with App Router in standalone output mode for Vercel deployment.

**Consequences:**
- ✅ Server Components for landing/marketing pages (fast, SEO)
- ✅ API Routes for interview sessions, auth, exports
- ✅ Middleware for auth protection
- ✅ Standalone output optimized for Vercel
- ⚠️ Must stay on v15 until v16 ecosystem stability

---

## ADR-002: SQLite via Prisma (Dev), PostgreSQL (Production Planned)

**Status:** ✅ ACCEPTED

**Context:** Rapid development requires zero-config database. Production needs concurrent access and durability.

**Decision:** SQLite for development (Prisma ORM abstracts DB layer). PostgreSQL (Neon/Supabase) planned for production migration.

**Consequences:**
- ✅ Zero-config local dev
- ✅ Type-safe queries via Prisma
- ⚠️ Migration planning needed before production launch

---

## ADR-003: Custom JWT Auth with Dual Storage

**Status:** ✅ ACCEPTED

**Context:** Need secure auth without external providers. Mobile users may face cookie issues — need fallback.

**Decision:** 
- Primary: HttpOnly cookies (jose library)
- Fallback: localStorage token cache
- Role + tier embedded in JWT payload

**Consequences:**
- ✅ XSS/CSRF protection via cookies
- ✅ Graceful degradation for mobile issues
- ⚠️ Two auth paths to maintain and test

---

## ADR-004: Ethereal Glass Design System

**Status:** ✅ ACCEPTED

**Context:** The app serves a competitive market (interview prep). Premium, distinctive design is a key differentiator. Generic Tailwind/shadcn would blend in.

**Decision:** Custom Ethereal Glass design system:
- OLED black backgrounds with radial gradient orbs
- Glass-morphism cards (backdrop-blur-xl, double-bezel borders)
- Space Grotesk + Plus Jakarta Sans typography
- Phosphor Icons (light weight)
- Framer Motion animations with custom curves

**Consequences:**
- ✅ Distinctive premium brand identity
- ✅ Memorable user experience drives retention
- ⚠️ Custom components require more maintenance
- ⚠️ Glass effects can affect performance on low-end devices

---

## ADR-005: Z AI SDK for Coaching Features

**Status:** ✅ ACCEPTED

**Context:** Need reliable AI integration for interview coaching, resume analysis, and content generation. Must handle streaming, scoring, and structured output.

**Decision:** Use Z AI Web Dev SDK for all AI-powered features:
- Streaming interview conversations
- Real-time scoring and feedback
- Resume extraction and analysis
- Cover letter generation

**Consequences:**
- ✅ Single AI provider for all features
- ✅ Built-in streaming support
- ⚠️ Vendor lock-in — migration path unclear
- ⚠️ Usage costs scale with user base

---

## ADR-006: Framer Motion for Animation

**Status:** ✅ ACCEPTED

**Context:** Need premium, smooth animations for glass UI components — scroll reveals, staggered list entries, hover physics, page transitions.

**Decision:** Framer Motion with custom cubic-bezier curves (`ease-premium`, `ease-spring`, `ease-out-heavy`) for all animations.

**Consequences:**
- ✅ Most mature React animation library
- ✅ Scroll-triggered animations (IntersectionObserver built-in)
- ✅ Layout animations for list/dashboard transitions
- ⚠️ Bundle size impact (~15KB gzip)
