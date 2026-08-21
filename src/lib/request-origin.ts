function configuredOrigin(request: Request): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      return null;
    }
  }

  if (process.env.NODE_ENV === 'production') return null;

  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

export function isTrustedMutationOrigin(request: Request): boolean {
  const expectedOrigin = configuredOrigin(request);
  const suppliedOrigin = request.headers.get('origin');
  if (!expectedOrigin || !suppliedOrigin || suppliedOrigin === 'null') return false;

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') return false;

  try {
    return new URL(suppliedOrigin).origin === expectedOrigin;
  } catch {
    return false;
  }
}
