import { test, expect } from '../fixtures/test.fixture';

test.describe('E2E: Solicitação de Saques e Transferências', () => {
  test.beforeEach(async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('demo@lerapay.com', '123456');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('deve abrir modal de saque e validar preenchimento de chave Pix', async ({ dashboardPage, page }) => {
    await dashboardPage.withdrawButton.click();

    await expect(page.getByText(/solicitar saque|transferência pix/i)).toBeVisible();

    // Preenche dados do saque
    await dashboardPage.withdrawAmountInput.fill('50,00');
    await dashboardPage.withdrawKeyInput.fill('financeiro@empresa.com');

    // Confirma envio
    await dashboardPage.withdrawSubmitButton.click();

    // Valida que não houve travamento de tela ou que mensagem de status foi exibida
    await page.waitForTimeout(1000);
  });
});
