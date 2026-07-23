import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { completeJson } from './client';

// AI calls are the most expensive requests the app makes (outbound model
// calls with up to a 30s timeout) — the generic per-IP middleware limit
// isn't tight enough to stop a single authenticated user from hammering
// them, so every AI endpoint gets its own per-user budget on top of it.
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX) || 20;
const AI_RATE_LIMIT_WINDOW_MS = 10 * 60_000; // 10 minutes

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

    const rl = await checkRateLimit(user.id, 'ai', AI_RATE_LIMIT_MAX, AI_RATE_LIMIT_WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many AI requests. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': '600' } }
      );
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
