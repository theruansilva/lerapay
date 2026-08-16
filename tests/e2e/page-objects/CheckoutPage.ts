import { type Page, type Locator, expect } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;

  // Tabs
  readonly pixTab: Locator;
  readonly cardTab: Locator;

  // Pix Form
  readonly pixNameInput: Locator;
  readonly pixEmailInput: Locator;
  readonly pixDocInput: Locator;
  readonly pixSubmitButton: Locator;

  // Pix Result
  readonly qrCodeSvg: Locator;
  readonly emvCodeInput: Locator;
  readonly copyEmvButton: Locator;

  // Card Form
  readonly cardNumberInput: Locator;
  readonly cardHolderInput: Locator;
  readonly cardMonthInput: Locator;
  readonly cardYearInput: Locator;
  readonly cardCvvInput: Locator;
  readonly cardInstallmentsSelect: Locator;
  readonly cardSubmitButton: Locator;

  // Status & Actions
  readonly approvedBadge: Locator;
  readonly deniedBadge: Locator;
  readonly printReceiptButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pixTab = page.getByRole('button', { name: /pix/i });
    this.cardTab = page.getByRole('button', { name: /cartão/i });

    // Pix
    this.pixNameInput = page.locator('input[placeholder*="Nome completo"], input[placeholder*="Nome"]');
    this.pixEmailInput = page.locator('input[placeholder*="e-mail"], input[placeholder*="Email"]');
    this.pixDocInput = page.locator('input[placeholder*="000.000.000-00"], input[placeholder*="CPF"]');
    this.pixSubmitButton = page.getByRole('button', { name: /gerar qr code pix|gerar pix/i });

    this.qrCodeSvg = page.locator('svg').filter({ hasNot: page.locator('button svg') });
    this.emvCodeInput = page.locator('input[readonly]');
    this.copyEmvButton = page.getByRole('button', { name: /copiar/i });

    // Card
    this.cardNumberInput = page.locator('input[placeholder*="0000 0000 0000 0000"], input[placeholder*="Número do cartão"]');
    this.cardHolderInput = page.locator('input[placeholder*="NOME COMO NO CARTÃO"], input[placeholder*="Nome impresso"]');
    this.cardMonthInput = page.locator('input[placeholder*="MM"]');
    this.cardYearInput = page.locator('input[placeholder*="AA"]');
    this.cardCvvInput = page.locator('input[placeholder*="123"], input[placeholder*="CVV"]');
    this.cardInstallmentsSelect = page.locator('select');
    this.cardSubmitButton = page.getByRole('button', { name: /pagar com cartão|confirmar pagamento/i });

    // Results
    this.approvedBadge = page.locator('text=/pagamento aprovado|aprovado com sucesso/i');
    this.deniedBadge = page.locator('text=/pagamento recusado|transação negada|não autorizada/i');
    this.printReceiptButton = page.getByRole('button', { name: /imprimir comprovante|comprovante/i });
  }

  async goto(slug: string) {
    await this.page.goto(`/checkout/${slug}`);
  }

  async payWithPix(name: string, email: string, cpf: string) {
    await this.pixTab.click();
    await this.pixNameInput.fill(name);
    await this.pixEmailInput.fill(email);
    await this.pixDocInput.fill(cpf);
    await this.pixSubmitButton.click();
  }

  async payWithCard(card: {
    number: string;
    holder: string;
    month: string;
    year: string;
    cvv: string;
    installments?: number;
  }) {
    await this.cardTab.click();
    await this.cardNumberInput.fill(card.number);
    await this.cardHolderInput.fill(card.holder);
    await this.cardMonthInput.fill(card.month);
    await this.cardYearInput.fill(card.year);
    await this.cardCvvInput.fill(card.cvv);

    if (card.installments && (await this.cardInstallmentsSelect.isVisible())) {
      await this.cardInstallmentsSelect.selectOption(String(card.installments));
    }

    await this.cardSubmitButton.click();
  }

  async expectApproved(timeout = 15_000) {
    await expect(this.approvedBadge).toBeVisible({ timeout });
  }

  async expectDenied(timeout = 10_000) {
    await expect(this.deniedBadge).toBeVisible({ timeout });
  }
}
