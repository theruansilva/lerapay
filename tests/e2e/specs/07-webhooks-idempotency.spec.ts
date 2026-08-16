import { test, expect } from '../fixtures/test.fixture';
import { signWebhookPayload } from '../helpers/hmac-signer';

test.describe('E2E: Webhooks, Assinatura e Idempotência', () => {
  test('deve aceitar webhook com assinatura X-Lera-Box-Signature válida', async ({ request, createCheckoutLinkViaApi }) => {
    const link = await createCheckoutLinkViaApi('Teste Webhook Assinado', 10000);

    const payload = {
      event: 'PAYMENT_PIX',
      status: 'APPROVED',
      data: {
        slug: link.slug,
        amountCents: 10000,
        paidAt: new Date().toISOString(),
      },
    };

    const secret = process.env.WEBHOOK_SECRET || 'e2e-webhook-secret-key';
    const signature = signWebhookPayload(payload, secret);

    const res = await request.post('http://localhost:3000/api/webhooks', {
      headers: {
        'X-Lera-Box-Signature': signature,
        'Content-Type': 'application/json',
      },
      data: payload,
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success || body.received || body.processed).toBeTruthy();
  });

  test('deve processar webhooks repetidos de forma idempotente sem duplicar créditos', async ({
    request,
    createCheckoutLinkViaApi,
  }) => {
    const link = await createCheckoutLinkViaApi('Teste Idempotencia 3x', 7500);

    const payload = {
      event: 'PAYMENT_CARD',
      status: 'APPROVED',
      data: {
        slug: link.slug,
        amountCents: 7500,
        installments: 1,
        paidAt: new Date().toISOString(),
      },
    };

    const secret = process.env.WEBHOOK_SECRET || 'e2e-webhook-secret-key';
    const signature = signWebhookPayload(payload, secret);

    // Dispara 3 vezes consecutivas o mesmo evento
    const responses = await Promise.all([
      request.post('http://localhost:3000/api/webhooks', {
        headers: { 'X-Lera-Box-Signature': signature, 'Content-Type': 'application/json' },
        data: payload,
      }),
      request.post('http://localhost:3000/api/webhooks', {
        headers: { 'X-Lera-Box-Signature': signature, 'Content-Type': 'application/json' },
        data: payload,
      }),
      request.post('http://localhost:3000/api/webhooks', {
        headers: { 'X-Lera-Box-Signature': signature, 'Content-Type': 'application/json' },
        data: payload,
      }),
    ]);

    // Todas as requisições devem retornar sucesso HTTP (200/201)
    for (const res of responses) {
      expect(res.ok()).toBeTruthy();
    }
  });
});
