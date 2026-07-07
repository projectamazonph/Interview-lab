# Brand Guidelines — Interview-lab

## Parent Brand

**ProjectAmazonPH** — "Learn • Earn • Empower"

## App Identity

Interview-lab is the AI-powered interview prep platform under ProjectAmazonPH.
Helps Filipino VAs prepare for Amazon VA roles (PPC, Account, Listing, Reporting, Agency).

## Logo

Primary mark: **Concept 3** — "PA" monogram with pixel dissolve effect + smile arrow.
Tech-forward, progressive, intimate feel.
Source: `/public/icons/icon-og.png`

## Colors

| Token | Hex | Usage |
|---|---|---|
| Primary | `#007EFF` | Sky Blue — Umbrella brand — CTAs, accents |
| Background | `#050505` | OLED black — always dark |
| Accent | `#007EFF` | Sky Blue — interactive states |
| Secondary | `#0070E0` | Deep Sky Blue — cards, surfaces |
| Success | `#34D399` | Emerald — positive feedback |
| Warning | `#FBBF24` | Amber — mid-score feedback |
| Error | `#FB7185` | Rose — low-score feedback |

See `src/app/globals.css` for full design token system.

## Typography

- **Body / Headings:** Plus Jakarta Sans — `--font-plus-jakarta`
- **Display / Contrast:** Space Grotesk — `--font-clash`
- **Code:** JetBrains Mono — `--font-jetbrains-mono`

## Icon System

Phosphor Icons (named imports from `@phosphor-icons/react`).
Namespace fallback: `import * as Phosphor from '@phosphor-icons/react'`

## Motion

Sophisticated. Fade-blur reveals on scroll, glass glow on card hover,
shimmer skeletons for loading states. Grain overlay animation.
Easing: `cubic-bezier(0.32, 0.72, 0, 1)` throughout.

## Favicon & App Icons

| File | Use |
|---|---|
| `/public/icons/icon-32.png` | Browser tab favicon |
| `/public/icons/icon-180.png` | Apple Touch / iOS home screen |
| `/public/icons/icon-192.png` | PWA manifest |
| `/public/icons/icon-512.png` | PWA manifest high-res |
| `/public/icons/icon-og.png` | OG social share image (1200×630) |

## Metadata

- **Site name:** Interview-lab
- **Author:** Ryan Dabao — ProjectAmazonPH
- **OG image:** `/public/og/il-og.png` (1200×630 composed — black + PA monogram + tagline)
