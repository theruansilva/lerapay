import { test, expect } from '../fixtures/test.fixture';
import { generateValidCPF } from '../helpers/generators';

test.describe('E2E: Fluxo de Pagamento Pix', () => {
  test('deve preencher dados do pagador, gerar QR Code Pix, simular liquidação e ver comprovante', async ({
    createCheckoutLinkViaApi,
    checkoutPage,
    dispatchWebhook,
    page,
  }) => {
    const link = await createCheckoutLinkViaApi('Licença de Software Anual', 12000); // R$ 120,00

    await checkoutPage.goto(link.slug);

    const payerName = 'Carlos Eduardo Silva';
    const payerEmail = 'carlos.silva@exemplo.com';
    const payerCpf = generateValidCPF();

    await checkoutPage.payWithPix(payerName, payerEmail, payerCpf);

    // Valida exibição do QR Code e campo EMV
    await expect(page.getByText(/escaneie o qr code/i)).toBeVisible();
    await expect(checkoutPage.qrCodeSvg).toBeVisible();
    await expect(checkoutPage.emvCodeInput).toBeVisible();

    // Testa ação de copiar código EMV
    await checkoutPage.copyEmvButton.click();
    await expect(page.getByText(/copiado/i)).toBeVisible();

    // Simula o webhook de pagamento aprovado enviado pelo Gateway
    await dispatchWebhook({
      event: 'PAYMENT_PIX',
      status: 'APPROVED',
      data: {
        slug: link.slug,
        amountCents: 12000,
        paidAt: new Date().toISOString(),
      },
    });

    // O checkout deve atualizar reativamente via polling para APPROVED
    await checkoutPage.expectApproved(15_000);
    await expect(checkoutPage.printReceiptButton).toBeVisible();
  });
});
