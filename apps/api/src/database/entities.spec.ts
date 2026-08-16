import {
  User,
  CheckoutLink,
  CheckoutLinkStatus,
  Order,
  OrderStatus,
  PaymentMethod,
  Withdrawal,
  WithdrawalStatus,
  WebhookEvent,
} from './entities';

describe('Database Entities', () => {
  it('should instantiate User entity correctly', () => {
    const user = new User();
    user.email = 'merchant@lerapay.com';
    user.name = 'Merchant Demo';
    user.passwordHash = 'hash';
    expect(user.email).toBe('merchant@lerapay.com');
  });

  it('should instantiate CheckoutLink with active status', () => {
    const link = new CheckoutLink();
    link.slug = 'chk_123';
    link.title = 'Plano Pro';
    link.amountCents = 4990;
    link.status = CheckoutLinkStatus.ACTIVE;
    expect(link.amountCents).toBe(4990);
    expect(link.status).toBe('ACTIVE');
  });

  it('should instantiate Order with centavos amount and status', () => {
    const order = new Order();
    order.merchantId = 'merchant-uuid-123';
    order.externalReference = 'ext_ref_123';
    order.amountCents = 10000;
    order.paymentMethod = PaymentMethod.PIX;
    order.status = OrderStatus.PENDING;
    expect(order.merchantId).toBe('merchant-uuid-123');
    expect(order.amountCents).toBe(10000);
    expect(order.paymentMethod).toBe('PIX');
  });

  it('should instantiate Withdrawal entity with status', () => {
    const withdrawal = new Withdrawal();
    withdrawal.merchantId = 'merchant-uuid-123';
    withdrawal.amountCents = 50000;
    withdrawal.pixKey = 'merchant@pix.com';
    withdrawal.pixKeyType = 'EMAIL';
    withdrawal.status = WithdrawalStatus.PENDING;
    expect(withdrawal.merchantId).toBe('merchant-uuid-123');
    expect(withdrawal.amountCents).toBe(50000);
    expect(withdrawal.status).toBe('PENDING');
  });

  it('should instantiate WebhookEvent entity', () => {
    const event = new WebhookEvent();
    event.deduplicationKey = 'dedup-123';
    event.eventType = 'PAYMENT_PIX';
    event.externalReference = 'ext_ref_123';
    event.payload = { status: 'APPROVED', amount: 10000 };
    event.processed = false;
    expect(event.deduplicationKey).toBe('dedup-123');
    expect(event.eventType).toBe('PAYMENT_PIX');
    expect(event.processed).toBe(false);
  });
});
