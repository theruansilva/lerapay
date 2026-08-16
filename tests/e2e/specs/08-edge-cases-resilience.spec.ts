import { test, expect } from '../fixtures/test.fixture';

test.describe('E2E: Casos de Borda e Resiliência', () => {
  test('deve exibir mensagem amigável ao acessar link de checkout inexistente ou expirado', async ({ checkoutPage, page }) => {
    await checkoutPage.goto('slug-totalmente-inexistente-12345');

    // Valida mensagem de erro sem quebrar aplicação
    await expect(page.getByText(/inválido|expirado|não encontrado/i)).toBeVisible();
  });

  test('deve redirecionar para /login ao tentar acessar dashboard sem autenticação', async ({ page }) => {
    // Garante que o storage está limpo
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});
