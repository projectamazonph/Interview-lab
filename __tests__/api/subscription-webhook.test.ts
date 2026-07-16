/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/subscription/webhook/route';

function webhookReq(body: unknown) {
  return new Request('http://localhost/api/subscription/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/subscription/webhook', () => {
  const eventTypes = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
  ];

  it.each(eventTypes)('acknowledges a %s event with 200', async (type) => {
    const res = await POST(webhookReq({ type, data: { object: {} } }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
  });

  it('acknowledges an unrecognized event type without erroring', async () => {
    const res = await POST(webhookReq({ type: 'some.unknown.event', data: { object: {} } }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
  });

  it('still returns 200 when the request body is malformed, to avoid retry storms', async () => {
    const req = new Request('http://localhost/api/subscription/webhook', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(body.error).toBe('Processing failed');
  });
});
