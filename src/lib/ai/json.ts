/**
 * Extracts the first JSON object or array from a free-text LLM response.
 * Models frequently wrap JSON in prose or code fences; this recovers the payload.
 */
export function extractJson<T = unknown>(text: string): T | null {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();

  // Fast path: the whole response is already JSON.
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // fall through to structural extraction
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]) as T;
    } catch {
      // malformed; fall through
    }
  }

  const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]) as T;
    } catch {
      // malformed
    }
  }

  return null;
}
