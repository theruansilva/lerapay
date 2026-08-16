import { type Page, type Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly balanceHeading: Locator;
  readonly refreshBalanceButton: Locator;
  readonly newLinkButton: Locator;
  readonly withdrawButton: Locator;
  readonly gatewayLinkButton: Locator;
  readonly logoutButton: Locator;

  // New Link Modal
  readonly linkModalTitleInput: Locator;
  readonly linkModalAmountInput: Locator;
  readonly linkModalSubmitButton: Locator;

  // Withdraw Modal
  readonly withdrawAmountInput: Locator;
  readonly withdrawKeyTypeSelect: Locator;
  readonly withdrawKeyInput: Locator;
  readonly withdrawSubmitButton: Locator;

  // Gateway Modal
  readonly gatewayDocInput: Locator;
  readonly gatewayPassInput: Locator;
  readonly gatewaySubmitButton: Locator;

  // Filters
  readonly statusFilterSelect: Locator;
  readonly typeFilterSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.balanceHeading = page.locator('div:has-text("Saldo Disponível") + div, h2:has-text("R$"), div:has-text("Saldo em Conta")');
    this.refreshBalanceButton = page.locator('button[title*="Atualizar"], button:has-text("Atualizar")');
    this.newLinkButton = page.getByRole('button', { name: /novo link/i });
    this.withdrawButton = page.getByRole('button', { name: /sacar/i });
    this.gatewayLinkButton = page.getByRole('button', { name: /vincular gateway/i });
    this.logoutButton = page.getByRole('button', { name: /sair/i });

    // Modals
    this.linkModalTitleInput = page.locator('input[placeholder*="Ex: Consultoria"], input[placeholder*="Título"]');
    this.linkModalAmountInput = page.locator('div[role="dialog"] input[placeholder*="0,00"], .fixed input[placeholder*="0,00"]');
    this.linkModalSubmitButton = page.getByRole('button', { name: /criar link/i });

    this.withdrawAmountInput = page.locator('div:has-text("Solicitar Saque") input[placeholder*="0,00"]');
    this.withdrawKeyTypeSelect = page.locator('div:has-text("Solicitar Saque") select');
    this.withdrawKeyInput = page.locator('div:has-text("Solicitar Saque") input[placeholder*="Chave"], div:has-text("Solicitar Saque") input[placeholder*="chave"]');
    this.withdrawSubmitButton = page.getByRole('button', { name: /confirmar saque/i });

    this.gatewayDocInput = page.locator('input[placeholder*="CPF ou CNPJ"], input[placeholder*="000.000.000-00"]');
    this.gatewayPassInput = page.locator('div:has-text("Credenciais Gateway") input[type="password"]');
    this.gatewaySubmitButton = page.getByRole('button', { name: /salvar credenciais/i, exact: false });

    this.statusFilterSelect = page.locator('select').filter({ hasText: /todos os status|approved|denied/i });
    this.typeFilterSelect = page.locator('select').filter({ hasText: /todos os tipos|pix|cartão/i });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async createCheckoutLink(title: string, amountBrl: string): Promise<string> {
    await this.newLinkButton.click();
    await this.linkModalTitleInput.fill(title);
    await this.linkModalAmountInput.fill(amountBrl);
    await this.linkModalSubmitButton.click();
    await expect(this.page.getByText(title)).toBeVisible();
    return title;
  }

  async requestWithdrawal(amountBrl: string, pixKey: string, keyType = 'EMAIL') {
    await this.withdrawButton.click();
    await this.withdrawAmountInput.fill(amountBrl);
    if (await this.withdrawKeyTypeSelect.isVisible()) {
      await this.withdrawKeyTypeSelect.selectOption(keyType);
    }
    await this.withdrawKeyInput.fill(pixKey);
    await this.withdrawSubmitButton.click();
  }

  async filterByStatus(status: 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED' | '') {
    await this.statusFilterSelect.selectOption(status);
  }

  async filterByType(type: 'PIX' | 'CARD' | '') {
    await this.typeFilterSelect.selectOption(type);
  }
}
