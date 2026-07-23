/**
 * Sanitize user input by removing HTML tags and dangerous content.
 * Used across all API routes to prevent XSS injection.
 */

// Strip all HTML tags and return plain text
export function sanitizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  return value
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')   // Remove script tags + content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')      // Remove style tags + content
    .replace(/<[^>]*>/g, '')                              // Strip remaining HTML tags
    .replace(/javascript\s*:/gi, '')                     // Remove javascript: URLs
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')         // Remove event handlers
    .trim() || null;
}

/**
 * Sanitize AI-generated content (e.g. cover letters) that's stored and later
 * displayed as plain text. This used to keep HTML tags in place (minus
 * <script> and quoted event-handler attributes), intending to "allow basic
 * formatting" for a future rich-text renderer — but a regex-based partial
 * sanitizer can't reliably neutralize HTML (unquoted event handlers like
 * `<img src=x onerror=...>` slipped through), and nothing in this codebase
 * actually renders this field as HTML today (it's shown via plain JSX text
 * interpolation and fed into docx/pdf export as plain text). Strip all tags
 * like sanitizeText does; if a rich-text renderer is added later, use a real
 * allowlist HTML sanitizer instead of hand-rolled regexes.
 */
export function sanitizeRichText(value: unknown): string | null {
  return sanitizeText(value);
}
