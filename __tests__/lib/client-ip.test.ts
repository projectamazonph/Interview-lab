/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest';
import { getTrustedClientIp } from '@/lib/client-ip';

const originalVercel = process.env.VERCEL;
const originalTrustedHeader = process.env.TRUSTED_CLIENT_IP_HEADER;

function headers(values: Record<string, string>): Headers {
  return new Headers(values);
}

afterEach(() => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalTrustedHeader === undefined) delete process.env.TRUSTED_CLIENT_IP_HEADER;
  else process.env.TRUSTED_CLIENT_IP_HEADER = originalTrustedHeader;
});

describe('getTrustedClientIp', () => {
  it('ignores forwarding headers when no trusted proxy is configured', () => {
    delete process.env.VERCEL;
    delete process.env.TRUSTED_CLIENT_IP_HEADER;

    expect(getTrustedClientIp(headers({
      'x-forwarded-for': '198.51.100.10',
      'x-real-ip': '198.51.100.11',
    }))).toBe('unknown');
  });

  it('uses the Vercel-managed client address on Vercel', () => {
    process.env.VERCEL = '1';
    delete process.env.TRUSTED_CLIENT_IP_HEADER;

    expect(getTrustedClientIp(headers({
      'x-vercel-forwarded-for': '2001:db8::1',
      'x-forwarded-for': '198.51.100.10',
    }))).toBe('2001:db8::1');
  });

  it('uses a custom header supplied by a trusted self-hosted proxy', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'X-Interview-Lab-Connecting-IP';

    expect(getTrustedClientIp(headers({
      'x-interview-lab-connecting-ip': '203.0.113.7',
    }))).toBe('203.0.113.7');
  });

  it.each(['x-forwarded-for', 'x-real-ip'])(
    'refuses the commonly client-controlled %s header as custom configuration',
    (unsafeHeader) => {
      process.env.TRUSTED_CLIENT_IP_HEADER = unsafeHeader;

      expect(getTrustedClientIp(headers({ [unsafeHeader]: '198.51.100.10' }))).toBe('unknown');
    },
  );

  it.each([
    '',
    '198.51.100.1, 203.0.113.1',
    'not-an-ip',
    '1'.repeat(65),
  ])('rejects an invalid trusted-header value: %j', (value) => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-interview-lab-connecting-ip';

    expect(getTrustedClientIp(headers({
      'x-interview-lab-connecting-ip': value,
    }))).toBe('unknown');
  });
});
