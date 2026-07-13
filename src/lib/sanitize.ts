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

// Sanitize but allow basic formatting (for AI-generated content like cover letters)
export function sanitizeRichText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  return value
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '')
    .trim() || null;
}
