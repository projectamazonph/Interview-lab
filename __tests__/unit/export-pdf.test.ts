import { describe, it, expect } from 'vitest';
import { generatePdfBuffer } from '@/lib/export/pdf';
import { MAX_CONTENT_LENGTH, sanitizeFilename } from '@/lib/export/types';

function countPdfPages(pdf: Buffer): number {
  // Each page object is declared as `/Type /Page /Parent 2 0 R`.
  const text = pdf.toString('latin1');
  return (text.match(/\/Type \/Page \/Parent/g) || []).length;
}

describe('generatePdfBuffer', () => {
  it('produces a valid PDF header and trailer', () => {
    const pdf = generatePdfBuffer('Hello world', 'Test');
    expect(pdf.slice(0, 8).toString()).toContain('%PDF-1.4');
    expect(pdf.toString('latin1')).toContain('%%EOF');
  });

  it('contains the rendered text content', () => {
    const pdf = generatePdfBuffer('UniqueMarkerText line', 'Title');
    expect(pdf.toString('latin1')).toContain('UniqueMarkerText line');
  });

  it('fits short content on a single page', () => {
    const pdf = generatePdfBuffer('one\ntwo\nthree', 'Short');
    expect(countPdfPages(pdf)).toBe(1);
  });

  it('paginates long content instead of truncating', () => {
    // 1000 lines of unique text -> must span multiple pages (no data loss).
    const lines: string[] = [];
    for (let i = 0; i < 1000; i++) lines.push(`Line ${i} unique content`);
    const content = lines.join('\n');
    const pdf = generatePdfBuffer(content, 'Long');

    const pages = countPdfPages(pdf);
    expect(pages).toBeGreaterThan(1);

    // Every unique line must be present in the output (no truncation).
    for (let i = 0; i < 1000; i += 37) {
      expect(pdf.toString('latin1')).toContain(`Line ${i} unique content`);
    }
  });

  it('escapes parentheses in content', () => {
    const pdf = generatePdfBuffer('Text with (parens) and \\ slash', 'Esc');
    expect(pdf.toString('latin1')).toContain('Text with \\(parens\\) and \\\\ slash');
  });
});

describe('sanitizeFilename', () => {
  it('replaces non-alphanumeric chars with underscores', () => {
    expect(sanitizeFilename('My Resume! @2026')).toBe('My_Resume___2026');
  });
  it('falls back when title is empty', () => {
    expect(sanitizeFilename('')).toBe('document');
    expect(sanitizeFilename(undefined)).toBe('document');
  });
});

describe('MAX_CONTENT_LENGTH', () => {
  it('is defined and reasonable', () => {
    expect(MAX_CONTENT_LENGTH).toBe(50_000);
  });
});
