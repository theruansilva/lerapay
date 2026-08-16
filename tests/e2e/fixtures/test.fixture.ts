import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { DashboardPage } from '../page-objects/DashboardPage';
import { CheckoutPage } from '../page-objects/CheckoutPage';
import { signWebhookPayload } from '../helpers/hmac-signer';

type BaasFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  checkoutPage: CheckoutPage;
  createCheckoutLinkViaApi: (title: string, amountCents: number) => Promise<{ id: string; slug: string }>;
  dispatchWebhook: (payload: Record<string, unknown>, secret?: string) => Promise<any>;
};

export const test = base.extend<BaasFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  createCheckoutLinkViaApi: async ({ request }, use) => {
    await use(async (title: string, amountCents: number) => {
      // 1. Get or create token for demo merchant
      const loginRes = await request.post('http://localhost:3000/api/auth/login', {
        data: {
          email: 'demo@lerapay.com',
          password: 'password123',
        },
      });

      let token: string;
      if (loginRes.ok()) {
        const body = await loginRes.json();
        token = body.accessToken;
      } else {
        // Try demo credentials with 123456
        const demoLoginRes = await request.post('http://localhost:3000/api/auth/login', {
          data: {
            email: 'demo@lerapay.com',
            password: '123456',
          },
        });
        if (demoLoginRes.ok()) {
          const demoBody = await demoLoginRes.json();
          token = demoBody.accessToken;
        } else {
          const regRes = await request.post('http://localhost:3000/api/auth/register', {
            data: {
              name: 'Demo Merchant',
              email: 'demo@lerapay.com',
              password: 'password123',
            },
          });
          const regBody = await regRes.json();
          token = regBody.accessToken;
        }
      }

      const linkRes = await request.post('http://localhost:3000/api/checkout/links', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          title,
          amountCents,
        },
      });

      return await linkRes.json();
    });
  },

  dispatchWebhook: async ({ request }, use) => {
    await use(async (payload: Record<string, unknown>, secret = process.env.WEBHOOK_SECRET || 'e2e-webhook-secret-key') => {
      const signature = signWebhookPayload(payload, secret);
      return await request.post('http://localhost:3000/api/webhooks', {
        headers: {
          'X-Lera-Box-Signature': signature,
          'Content-Type': 'application/json',
        },
        data: payload,
      });
    });
  },
});

export { expect };
