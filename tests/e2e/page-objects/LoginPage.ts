import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly nameInput: Locator;
  readonly submitButton: Locator;
  readonly toggleRegisterButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.nameInput = page.locator('input[placeholder*="Nome"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.toggleRegisterButton = page.locator('button:has-text("Cadastre-se"), button:has-text("Faça login")');
    this.errorMessage = page.locator('.bg-rose-500\\/10');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password = 'password123') {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async register(name: string, email: string, password = 'password123') {
    if (await this.page.getByRole('button', { name: /cadastre-se/i }).isVisible()) {
      await this.page.getByRole('button', { name: /cadastre-se/i }).click();
    }
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(messageRegex?: RegExp) {
    await expect(this.errorMessage).toBeVisible();
    if (messageRegex) {
      await expect(this.errorMessage).toContainText(messageRegex);
    }
  }
}
