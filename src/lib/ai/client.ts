import { extractJson } from './json';

const DEFAULT_TIMEOUT_MS = 30_000;

export interface AICompletionOptions {
  /** Abort signal forwarded to the provider (enables request cancellation). */
  signal?: AbortSignal;
  /** Max wall-clock time for the completion. Defaults to 30s. */
  timeoutMs?: number;
}

export interface AIProvider {
  complete(system: string, user: string, opts?: AICompletionOptions): Promise<string>;
}

/**
 * Thin adapter over z-ai-web-dev-sdk that adds a hard timeout and abort support.
 * Swap this class to change providers without touching route handlers (DIP).
 */
export class ZAIProvider implements AIProvider {
  async complete(
    system: string,
    user: string,
    opts: AICompletionOptions = {},
  ): Promise<string> {
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Chain an externally-provided signal so either cancellation wins.
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      const completion = await withTimeout(
        zai.chat.completions.create({
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        timeoutMs,
        controller,
      );
      return completion.choices[0]?.message?.content ?? '';
    } finally {
      clearTimeout(timer);
    }
  }
}

export const ai: AIProvider = new ZAIProvider();

/** Enforces a wall-clock deadline; rejects with a TimeoutError on expiry. */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  controller: AbortController,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`AI request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Convenience: complete and parse the JSON payload from the response. */
export async function completeJson<T = unknown>(
  system: string,
  user: string,
  opts?: AICompletionOptions,
): Promise<T | null> {
  const text = await ai.complete(system, user, opts);
  return extractJson<T>(text);
}
