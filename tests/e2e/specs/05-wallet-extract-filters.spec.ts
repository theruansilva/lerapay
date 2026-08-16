import { test, expect } from '../fixtures/test.fixture';

test.describe('E2E: Carteira, Saldo e Extrato com Filtros', () => {
  test.beforeEach(async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('demo@lerapay.com', '123456');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('deve exibir saldo da carteira e permitir atualização', async ({ dashboardPage, page }) => {
    await expect(dashboardPage.balanceHeading.first()).toBeVisible();

    // Clica no botão de atualizar saldo
    if (await dashboardPage.refreshBalanceButton.isVisible()) {
      await dashboardPage.refreshBalanceButton.click();
      await expect(page.locator('text=/R\\$/i').first()).toBeVisible();
    }
  });

  test('deve filtrar transações por status e método de pagamento', async ({ dashboardPage, page }) => {
    // Aplica filtro por APPROVED
    if (await dashboardPage.statusFilterSelect.isVisible()) {
      await dashboardPage.filterByStatus('APPROVED');
      await page.waitForTimeout(500); // Aguarda requisição
    }

    // Aplica filtro por PIX
    if (await dashboardPage.typeFilterSelect.isVisible()) {
      await dashboardPage.filterByType('PIX');
      await page.waitForTimeout(500);
    }

    // Valida que a tabela/lista continua renderizando sem quebras
    await expect(page.locator('text=/transações|nenhuma transação/i').first()).toBeVisible();
  });
});
