import crypto from 'node:crypto';

export function signWebhookPayload(payload: Record<string, unknown>, secret = 'e2e-webhook-secret-key'): string {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(serialized).digest('hex');
}
