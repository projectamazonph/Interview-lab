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
  it('returns null for null, undefined, and non-strings', () => {
    expect(sanitizeRichText(null)).toBeNull();
    expect(sanitizeRichText(undefined)).toBeNull();
    expect(sanitizeRichText(99)).toBeNull();
  });

  it('strips script tags but preserves other markup', () => {
    expect(sanitizeRichText('<p>Hi</p><script>alert(1)</script>')).toBe('<p>Hi</p>');
  });

  it('removes inline event handlers while preserving the tag', () => {
    expect(sanitizeRichText('<div onclick="alert(1)">click me</div>')).toBe('<div >click me</div>');
  });

  it('removes javascript: URLs', () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">link</a>')).toBe('<a href="alert(1)">link</a>');
  });

  it('trims whitespace and collapses to null when empty', () => {
    expect(sanitizeRichText('   ')).toBeNull();
  });

  it('preserves basic formatting for AI-generated content', () => {
    const input = '<p>Dear Hiring Manager,</p><p>I am excited to apply.</p>';
    expect(sanitizeRichText(input)).toBe(input);
  });
});
