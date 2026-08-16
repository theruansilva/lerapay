import { validate } from 'class-validator';
import { CreateCheckoutLinkDto, PixPaymentDto, CardPaymentDto } from './checkout.dto';

describe('Checkout DTO Validation', () => {
  it('should validate CreateCheckoutLinkDto successfully with valid inputs', async () => {
    const dto = new CreateCheckoutLinkDto();
    dto.title = 'Test Product';
    dto.amountCents = 1000;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail CreateCheckoutLinkDto validation with invalid amount', async () => {
    const dto = new CreateCheckoutLinkDto();
    dto.title = 'Test Product';
    dto.amountCents = 50; // below min 100

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('amountCents');
  });

  it('should validate PixPaymentDto with valid inputs', async () => {
    const dto = new PixPaymentDto();
    dto.payerName = 'John Doe';
    dto.payerEmail = 'john@example.com';
    dto.payerDocument = '12345678909'; // 11 digits CPF

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail PixPaymentDto validation with invalid document format', async () => {
    const dto = new PixPaymentDto();
    dto.payerName = 'John Doe';
    dto.payerEmail = 'john@example.com';
    dto.payerDocument = '12345'; // invalid CPF/CNPJ

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('payerDocument');
  });

  it('should validate CardPaymentDto with valid card details', async () => {
    const dto = new CardPaymentDto();
    dto.cardNumber = '4111111111111111';
    dto.cardHolderName = 'JOHN DOE';
    dto.cardExpirationMonth = '12';
    dto.cardExpirationYear = '2030';
    dto.cardCvv = '123';
    dto.installments = 3;
    dto.feePercent = 2.99;
    dto.payerEmail = 'john@example.com';
    dto.payerDocument = '12345678909';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail CardPaymentDto with invalid month and year', async () => {
    const dto = new CardPaymentDto();
    dto.cardNumber = '4111111111111111';
    dto.cardHolderName = 'JOHN DOE';
    dto.cardExpirationMonth = '13'; // invalid month
    dto.cardExpirationYear = '3'; // invalid year
    dto.cardCvv = '12'; // invalid CVV (too short)
    dto.installments = 25; // max 21
    dto.feePercent = 2.99;
    dto.payerEmail = 'john@example.com';
    dto.payerDocument = '12345678909';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
