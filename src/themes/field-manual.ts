// Custom Astryx theme mapping Interview Lab's existing "Field Manual" design
// tokens (see src/app/globals.css) onto Astryx's component system, so the
// migration to Astryx keeps the current brand look instead of adopting a
// preset theme. Built via `bunx astryx theme build src/themes/field-manual.ts`
// — that generates field-manual.js/.css/.d.ts alongside this file for SSR use
// (see docs/DEPLOYMENT.md-adjacent notes in the migration plan).

import { defineTheme } from '@astryxdesign/core/theme';

export const fieldManualTheme = defineTheme({
  name: 'field-manual',
  color: {
    accent: '#FF6B35',
    neutralStyle: 'warm',
  },
  typography: {
    scale: { base: 16, ratio: 1.2 },
    heading: { family: 'Space Grotesk', fallbacks: 'system-ui, sans-serif' },
    body: { family: 'Plus Jakarta Sans', fallbacks: "'Inter', system-ui, sans-serif" },
    code: { family: 'JetBrains Mono', fallbacks: "'Fira Code', monospace" },
  },
  radius: { base: 4, multiplier: 1 },
  motion: { fast: 150, medium: 200, ratio: 0.75 },
  tokens: {
    // Explicit overrides so the exact Field Manual palette survives the
    // accent-derived HCT palette generation from `color` above. `color.accent`
    // alone shifted #FF6B35 to a darker #B42900 (HCT contrast adjustment) —
    // pin the exact brand hex directly since fidelity to the current look is
    // the point of a custom theme over a preset.
    '--color-accent': ['#FF6B35', '#FF6B35'],
    '--color-accent-muted': ['#FFE5D9', '#FFE5D9'],
    '--color-on-accent': ['#FFFFFF', '#FFFFFF'],
    '--color-text-accent': ['#FF6B35', '#FF6B35'],
    '--color-icon-accent': ['#FF6B35', '#FF6B35'],
    '--color-background-body': ['#FAFAF7', '#FAFAF7'],
    '--color-background-surface': ['#FFFFFF', '#FFFFFF'],
    '--color-background-card': ['#FFFFFF', '#FFFFFF'],
    '--color-background-muted': ['#F4F3EE', '#F4F3EE'],
    '--color-text-primary': ['#171717', '#171717'],
    '--color-text-secondary': ['#737373', '#737373'],
    '--color-border': ['#E5E5E0', '#E5E5E0'],
    '--color-success': ['#0E7C3A', '#0E7C3A'],
    '--color-warning': ['#B45309', '#B45309'],
    '--color-error': ['#B91C1C', '#B91C1C'],
  },
  components: {
    // FieldButton used rounded-md (6px); FieldCard used rounded-lg (10px).
    // The radius scale above only hits inner=4/element=8/container=12, so
    // pin these two explicitly to match the current app pixel-for-pixel.
    button: { base: { borderRadius: '6px' } },
    card: { base: { borderRadius: '10px' } },
  },
});
