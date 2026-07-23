import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeRichText } from '@/lib/sanitize';

describe('sanitizeText', () => {
  it('returns null for null and undefined', () => {
    expect(sanitizeText(null)).toBeNull();
    expect(sanitizeText(undefined)).toBeNull();
  });

  it('returns null for non-string values', () => {
    expect(sanitizeText(42)).toBeNull();
    expect(sanitizeText({})).toBeNull();
    expect(sanitizeText(['a'])).toBeNull();
  });

  it('strips script tags and their content', () => {
    expect(sanitizeText('hello<script>alert(1)</script>world')).toBe('helloworld');
  });

  it('strips style tags and their content', () => {
    expect(sanitizeText('hello<style>body{color:red}</style>world')).toBe('helloworld');
  });

  it('strips arbitrary HTML tags but keeps text content', () => {
    expect(sanitizeText('<b>bold</b> and <i>italic</i>')).toBe('bold and italic');
  });

  it('removes javascript: URLs', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
  });

  it('removes inline event handlers along with the enclosing tag', () => {
    expect(sanitizeText('before<img src=x onerror="alert(1)">after')).toBe('beforeafter');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world');
  });

  it('returns null for strings that are empty after sanitizing', () => {
    expect(sanitizeText('   ')).toBeNull();
    expect(sanitizeText('<script>alert(1)</script>')).toBeNull();
  });

  it('leaves plain text untouched', () => {
    expect(sanitizeText('Amazon PPC Virtual Assistant')).toBe('Amazon PPC Virtual Assistant');
  });
});

describe('sanitizeRichText', () => {
  // sanitizeRichText used to preserve HTML tags (minus <script> and quoted
  // event handlers) for a "rich formatting" use case, but a regex-based
  // partial sanitizer can't reliably neutralize HTML — unquoted event
  // handlers like `<img src=x onerror=...>` slipped through — and nothing
  // in the app renders this field as HTML anyway. It now strips all tags
  // just like sanitizeText.
  it('returns null for null, undefined, and non-strings', () => {
    expect(sanitizeRichText(null)).toBeNull();
    expect(sanitizeRichText(undefined)).toBeNull();
    expect(sanitizeRichText(99)).toBeNull();
  });

  it('strips all HTML tags, including script tags and their content', () => {
    expect(sanitizeRichText('<p>Hi</p><script>alert(1)</script>')).toBe('Hi');
  });

  it('strips tags with unquoted event handlers (the old bypass)', () => {
    expect(sanitizeRichText('<img src=x onerror=alert(1)>click me')).toBe('click me');
  });

  it('removes inline event handlers and the enclosing tag', () => {
    expect(sanitizeRichText('<div onclick="alert(1)">click me</div>')).toBe('click me');
  });

  it('removes javascript: URLs', () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">link</a>')).toBe('link');
  });

  it('trims whitespace and collapses to null when empty', () => {
    expect(sanitizeRichText('   ')).toBeNull();
  });

  it('keeps the text content of formatted AI-generated content, dropping the tags', () => {
    const input = '<p>Dear Hiring Manager,</p><p>I am excited to apply.</p>';
    expect(sanitizeRichText(input)).toBe('Dear Hiring Manager,I am excited to apply.');
  });
});
