import { test, expect } from '../fixtures/test.fixture';

test.describe('E2E: Gestão de Links de Checkout', () => {
  test.beforeEach(async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('demo@lerapay.com', '123456');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('deve criar um novo link de pagamento com máscara de moeda e exibir na lista', async ({ dashboardPage, page }) => {
    const title = `Curso de NestJS Avançado #${Date.now()}`;
    const amountFormatted = '199,90';

    await dashboardPage.createCheckoutLink(title, amountFormatted);

    // Valida que o link foi renderizado na listagem
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText(/199,90/).first()).toBeVisible();
  });

  test('deve permitir acesso público ao checkout através do slug gerado', async ({ createCheckoutLinkViaApi, checkoutPage, page }) => {
    const link = await createCheckoutLinkViaApi('Consultoria de Arquitetura BaaS', 45000); // R$ 450,00

    await checkoutPage.goto(link.slug);

    // Valida renderização dos dados do produto e valor
    await expect(page.getByText('Consultoria de Arquitetura BaaS')).toBeVisible();
    await expect(page.getByText(/450,00/)).toBeVisible();
    await expect(page.getByRole('button', { name: /pagar com pix/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cartão de crédito/i })).toBeVisible();
  });
});
