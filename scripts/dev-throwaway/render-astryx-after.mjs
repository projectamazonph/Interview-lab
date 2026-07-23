// Throwaway spike tooling — not part of the app or its build. Run with
// `bun run scripts/dev-throwaway/render-astryx-after.mjs` from the repo root.
//
// Renders the Astryx side of the before/after demo to a fully standalone
// static HTML file (own inlined CSS, no Next.js involved at all) and writes
// it to /tmp/astryx-after-standalone.html. This has to run as a plain
// Node/Bun script outside Next.js: Astryx's components are React Client
// Components ('use client'), and Next's RSC bundler blocks invoking them
// from server-context code (Route Handlers included) — the 'use client'
// directive only has meaning inside Next's own build, so a plain script
// renders them with ordinary react-dom/server SSR with no such restriction.
//
// Pairs with the "before" half: src/app/dev/astryx-demo/before/page.tsx
// (a normal Next.js page using the existing FieldButton/FieldCard/FieldBadge
// components, screenshotted separately so neither side's CSS reset can leak
// into the other — see PR discussion / session notes for why they can't
// share a page).
//
// Safe to delete this whole scripts/dev-throwaway/ directory along with
// src/app/dev/astryx-demo/ once the Astryx spike concludes.

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Theme } from '@astryxdesign/core';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { Button as XButton } from '@astryxdesign/core/Button';
import { Card as XCard } from '@astryxdesign/core/Card';
import { Badge as XBadge } from '@astryxdesign/core/Badge';

const root = process.cwd();
const readCss = (p) => readFileSync(join(root, 'node_modules', p), 'utf-8');
const css = [
  readCss('@astryxdesign/core/src/reset.css'),
  readCss('@astryxdesign/core/dist/astryx.css'),
  readCss('@astryxdesign/theme-neutral/dist/theme.css'),
].join('\n');

const h = React.createElement;
const body = renderToStaticMarkup(
  h(Theme, { theme: neutralTheme },
    h('div', { style: { minHeight: '100vh', padding: 40, fontFamily: 'sans-serif' } },
      h('h1', { style: { fontFamily: 'monospace', fontSize: 13, opacity: 0.6, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1 } },
        'After — Astryx (Button / Card / Badge, neutral theme) — plain SSR, zero app CSS'),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 } },
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h(XButton, { label: 'Primary', variant: 'primary' }),
          h(XButton, { label: 'Secondary', variant: 'secondary' }),
          h(XButton, { label: 'Ghost', variant: 'ghost' }),
          h(XButton, { label: 'Destructive', variant: 'destructive' }),
        ),
        h(XCard, null,
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
            h('strong', null, 'Mock Interview'),
            h('span', { style: { fontSize: 14, opacity: 0.7 } }, 'Practice for your next Amazon VA interview.'),
            h('div', { style: { display: 'flex', gap: 8 } },
              h(XBadge, { label: 'PPC VA', variant: 'blue' }),
              h(XBadge, { label: 'Published', variant: 'green' }),
              h(XBadge, { label: 'Beginner', variant: 'gray' }),
            ),
          ),
        ),
      ),
    ),
  ),
);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><style>${css}</style></head><body>${body}</body></html>`;
const outPath = '/tmp/astryx-after-standalone.html';
writeFileSync(outPath, html);
console.log(`wrote ${outPath}`);
