import { describe, it, expect } from 'vitest';
import { generateDocx } from '@/lib/export/docx';

describe('generateDocx', () => {
  it('returns a non-empty buffer for simple content', async () => {
    const buffer = await generateDocx('# Heading\nSome body text\n- bullet', 'Doc');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('produces a valid DOCX zip (PK magic bytes)', async () => {
    const buffer = await generateDocx('Hello docx', 'Title');
    // DOCX files are ZIP archives starting with "PK".
    expect(buffer[0]).toBe(0x50); // P
    expect(buffer[1]).toBe(0x4b); // K
  });

  it('handles empty content without throwing', async () => {
    const buffer = await generateDocx('', 'Empty');
    expect(buffer.length).toBeGreaterThan(0);
  });
});
