// Throwaway spike tooling — visual sanity check for the custom field-manual
// theme. Run with `bun run scripts/dev-throwaway/render-astryx-theme-check.mjs`.
// Same plain-Node SSR approach as render-astryx-after.mjs (Astryx components
// are 'use client', can't be invoked from Next's RSC pipeline).

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Theme } from '@astryxdesign/core';
import { fieldManualTheme } from '../../src/themes/field-manual.js';
import { Button as XButton } from '@astryxdesign/core/Button';
import { Card as XCard } from '@astryxdesign/core/Card';
import { Badge as XBadge } from '@astryxdesign/core/Badge';

const root = process.cwd();
const readCss = (p) => readFileSync(join(root, p), 'utf-8');
const css = [
  readFileSync(join(root, 'node_modules/@astryxdesign/core/src/reset.css'), 'utf-8'),
  readFileSync(join(root, 'node_modules/@astryxdesign/core/dist/astryx.css'), 'utf-8'),
  readCss('src/themes/field-manual.css'),
].join('\n');

const h = React.createElement;
const body = renderToStaticMarkup(
  h(Theme, { theme: fieldManualTheme },
    h('div', { style: { minHeight: '100vh', padding: 40, fontFamily: 'sans-serif' } },
      h('h1', { style: { fontFamily: 'monospace', fontSize: 13, opacity: 0.6, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1 } },
        'Custom field-manual theme — Astryx components, brand tokens'),
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
              h(XBadge, { label: 'Published', variant: 'success' }),
              h(XBadge, { label: 'Beginner', variant: 'neutral' }),
            ),
          ),
        ),
      ),
    ),
  ),
);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" /><style>${css}</style></head><body>${body}</body></html>`;
writeFileSync('/tmp/astryx-theme-check.html', html);
console.log('wrote /tmp/astryx-theme-check.html');
