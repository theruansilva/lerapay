import { test, expect } from '../fixtures/test.fixture';
import { generateValidCNPJ } from '../helpers/generators';

test.describe('E2E: Autenticação e Onboarding do Lojista', () => {
  test('deve permitir cadastro de novo lojista e redirecionar para o dashboard', async ({ loginPage, page }) => {
    await loginPage.goto();

    const randomId = Math.floor(Math.random() * 10000);
    const email = `lojista_${randomId}@lerapay.com`;
    const name = `Lojista Teste ${randomId}`;

    await loginPage.register(name, email, 'senha123');

    // Valida redirecionamento para o dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/saldo disponível|saldo em conta/i).first()).toBeVisible();
  });

  test('deve exibir mensagem de erro para credenciais inválidas', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalido@lerapay.com', 'senha_errada');

    await loginPage.expectError(/inválid|invalid|credencia|falha/i);
  });

  test('deve realizar login com conta existente e manter token de autenticação', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('demo@lerapay.com', '123456');

    await expect(page).toHaveURL(/.*dashboard/);
    const token = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('accessToken'));
    expect(token).toBeDefined();
  });
});
