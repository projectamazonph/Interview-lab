import { extractJson } from './json';

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Caps how many AI calls a single server instance runs at once. Without
 * this, a burst of concurrent requests fires an unbounded number of
 * simultaneous outbound calls, each holding its Vercel function (and any
 * Prisma connection acquired earlier in the request) open for up to
 * DEFAULT_TIMEOUT_MS. This only bounds concurrency *within one instance* —
 * it isn't a global limiter across every serverless instance — but combined
 * with the per-user rate limit in src/lib/ai/handlers.ts it keeps a single
 * hot instance from amplifying a burst into a connection-pool exhaustion
 * event.
 */
class Semaphore {
  private available: number;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly max: number) {
    this.available = max;
  }

  async acquire(): Promise<() => void> {
    if (this.available > 0) {
      this.available--;
      return () => this.release();
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.available--;
    return () => this.release();
  }

  private release(): void {
    this.available++;
    const next = this.queue.shift();
    if (next) next();
  }
}

const aiSemaphore = new Semaphore(Number(process.env.AI_MAX_CONCURRENT_CALLS) || 10);

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

    // Chain an externally-provided signal so either cancellation wins.
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const release = await aiSemaphore.acquire();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
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
      release();
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
