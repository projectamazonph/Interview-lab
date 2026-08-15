import { NextResponse } from 'next/server';
import { checkRateLimit } from './rate-limit';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { completeJson } from './client';

/**
 * Lightweight schema check (avoids adding zod as a dependency).
 * Verifies that an object has the listed required keys with non-undefined values.
 */
export function validateShape(
  value: unknown,
  requiredKeys: string[],
): { ok: true; data: Record<string, unknown> } | { ok: false; missing: string[] } {
  if (typeof value !== 'object' || value === null) {
    return { ok: false, missing: requiredKeys };
  }
  const record = value as Record<string, unknown>;
  const missing = requiredKeys.filter((key) => record[key] === undefined);
  return missing.length === 0
    ? { ok: true, data: record }
    : { ok: false, missing };
}

export interface AIHandlerConfig<TBody, TResult> {
  /** Optional rate limit config. If omitted, no rate limiting is applied. */
  rateLimit?: {
    /** Max requests per window per user. Default 10. */
    max?: number;
    /** Window in ms. Default 60s. */
    windowMs?: number;
    /** Error message on limit exceeded. */
    message?: string;
  };
  /** System prompt for the model. */
  systemPrompt: string;
  /** Build the user message from the parsed request body. */
  buildUserPrompt: (body: TBody) => string;
  /** Validate/normalize the incoming body. Return an error to short-circuit. */
  validate: (body: unknown) => { ok: true; value: TBody } | { ok: false; status: number; error: string };
  /**
   * What to return when the model's JSON cannot be parsed.
   * - return a value → responded as 200 with that payload
   * - throw/return an error → responded as `status` with `{ error }`
   */
  onParseFailure: (body: TBody) => { ok: true; value: TResult } | { ok: false; status: number; error: string };
  /** Optional post-parse normalization/validation of the model output. */
  normalize?: (result: TResult, body: TBody) => TResult;
  /**
   * What to return when the provider call throws (e.g. missing API key,
   * network/outage, or timeout). Returning a value degrades gracefully to 200
   * instead of surfacing a 500; returning an error responds with `status`.
   */
  onProviderError?: (
    body: TBody,
  ) => { ok: true; value: TResult } | { ok: false; status: number; error: string };
  /** Optional timeout (ms) for the model call. */
  timeoutMs?: number;
}

/**
 * Factory that produces a POST handler for an AI endpoint.
 * Encapsulates auth, input validation, model call, JSON parsing, and error handling
 * so individual routes stay ~15 lines (Open/Closed: add a feature by adding a config).
 */
export function createAIHandler<TBody = Record<string, unknown>, TResult = unknown>(
  config: AIHandlerConfig<TBody, TResult>,
) {
  return async function handler(request: Request) {
    let user;
    try {
      user = await getUserFromRequest(request);
    } catch {
      user = null;
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit AI endpoints to prevent quota exhaustion
    if (config.rateLimit !== undefined) {
      const max = config.rateLimit.max ?? 10;
      const windowMs = config.rateLimit.windowMs ?? 60_000;
      const rl = await checkRateLimit(
        user.id,
        'ai',
        max,
        windowMs,
      );
      if (!rl.allowed) {
        return NextResponse.json(
          {
            error: config.rateLimit.message ?? 'Too many AI requests. Please slow down.',
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil(windowMs / 1000)),
              'X-RateLimit-Limit': String(max),
              'X-RateLimit-Remaining': '0',
            },
          },
        );
      }
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = config.validate(rawBody);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const body = validation.value;

    try {
      const parsed = await completeJson<TResult>(
        config.systemPrompt,
        config.buildUserPrompt(body),
        { timeoutMs: config.timeoutMs },
      );

      if (!parsed) {
        const failure = config.onParseFailure(body);
        if (!failure.ok) {
          return NextResponse.json({ error: failure.error }, { status: failure.status });
        }
        return NextResponse.json(failure.value);
      }

      const result = config.normalize ? config.normalize(parsed, body) : parsed;
      return NextResponse.json(result);
    } catch (error) {
      console.error('AI handler error:', error);
      if (config.onProviderError) {
        const fallback = config.onProviderError(body);
        if (fallback.ok) {
          return NextResponse.json(fallback.value);
        }
        return NextResponse.json({ error: fallback.error }, { status: fallback.status });
      }
      return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
    }
  };
}
