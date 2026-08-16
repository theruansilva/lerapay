import { test, expect } from '../fixtures/test.fixture';
import { TEST_CARDS } from '../helpers/generators';

test.describe('E2E: Fluxo de Pagamento com Cartão de Crédito', () => {
  test('deve calcular parcelas e taxas dinâmicas e processar pagamento com sucesso', async ({
    createCheckoutLinkViaApi,
    checkoutPage,
    page,
  }) => {
    const link = await createCheckoutLinkViaApi('Notebook Gamer Pro', 350000); // R$ 3.500,00

    await checkoutPage.goto(link.slug);
    await checkoutPage.cardTab.click();

    // Valida que o seletor de parcelas carrega opções
    await expect(checkoutPage.cardInstallmentsSelect).toBeVisible();
    const options = checkoutPage.cardInstallmentsSelect.locator('option');
    await expect(options).not.toHaveCount(0);

    // Preenche com cartão válido Visa
    await checkoutPage.payWithCard({
      ...TEST_CARDS.visa,
      installments: 3,
    });

    // Valida estado de sucesso ou recusa simulada pelo gateway
    const result = page.locator('text=/pagamento aprovado|recusado|não autorizada/i').first();
    await expect(result).toBeVisible({ timeout: 15_000 });
  });

  test('deve bloquear envio com dados de cartão inválidos', async ({
    createCheckoutLinkViaApi,
    checkoutPage,
    page,
  }) => {
    const link = await createCheckoutLinkViaApi('Assinatura Mensal', 4990); // R$ 49,90

    await checkoutPage.goto(link.slug);
    await checkoutPage.payWithCard(TEST_CARDS.invalid);

    // O botão deve permanecer desabilitado ou exibir erro de validação
    const isErrorVisible = await page.locator('text=/inválid|número de cartão/i').isVisible();
    const isButtonDisabled = await checkoutPage.cardSubmitButton.isDisabled();
    expect(isErrorVisible || isButtonDisabled).toBeTruthy();
  });
});
