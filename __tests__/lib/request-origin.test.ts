/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest';
import { isTrustedMutationOrigin } from '@/lib/request-origin';

const originalNodeEnv = process.env.NODE_ENV;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

function request(origin?: string, fetchSite?: string): Request {
  const headers = new Headers();
  if (origin !== undefined) headers.set('origin', origin);
  if (fetchSite !== undefined) headers.set('sec-fetch-site', fetchSite);
  return new Request('https://interview-lab.example/api/admin/questions', {
    method: 'POST',
    headers,
  });
}

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
});

describe('isTrustedMutationOrigin', () => {
  it('accepts the configured production origin', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_URL = 'https://interview-lab.example';

    expect(isTrustedMutationOrigin(request(
      'https://interview-lab.example',
      'same-origin',
    ))).toBe(true);
  });

  it.each([
    ['missing Origin', undefined, 'same-origin'],
    ['opaque Origin', 'null', 'same-origin'],
    ['cross-origin host', 'https://attacker.example', 'cross-site'],
    ['same-site subdomain', 'https://evil.interview-lab.example', 'same-site'],
  ])('rejects %s', (_label, origin, fetchSite) => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_URL = 'https://interview-lab.example';

    expect(isTrustedMutationOrigin(request(origin, fetchSite))).toBe(false);
  });

  it('fails closed in production when the configured app URL is invalid', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_URL = 'not a URL';

    expect(isTrustedMutationOrigin(request('https://interview-lab.example'))).toBe(false);
  });

  it('uses the request origin outside production when no app URL is configured', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.NEXT_PUBLIC_APP_URL;

    expect(isTrustedMutationOrigin(request('https://interview-lab.example'))).toBe(true);
  });
});
