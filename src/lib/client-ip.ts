type HeaderReader = Pick<Headers, 'get'>;

const VERCEL_CLIENT_IP_HEADER = 'x-vercel-forwarded-for';
const IP_ADDRESS_PATTERN = /^[0-9a-f:.]+$/i;
const UNSAFE_CUSTOM_HEADERS = new Set(['x-forwarded-for', 'x-real-ip']);

/**
 * Resolve the rate-limit identity only from a header supplied by a trusted
 * deployment proxy. Client-controlled forwarding headers are deliberately
 * ignored when the deployment has not declared a trust boundary.
 */
export function getTrustedClientIp(headers: HeaderReader): string {
  const configuredHeader = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (configuredHeader && UNSAFE_CUSTOM_HEADERS.has(configuredHeader)) return 'unknown';
  const trustedHeader = configuredHeader || (process.env.VERCEL === '1' ? VERCEL_CLIENT_IP_HEADER : null);
  if (!trustedHeader) return 'unknown';

  const value = headers.get(trustedHeader)?.trim();
  if (!value || value.length > 64 || value.includes(',') || !IP_ADDRESS_PATTERN.test(value)) {
    return 'unknown';
  }

  return value;
}
