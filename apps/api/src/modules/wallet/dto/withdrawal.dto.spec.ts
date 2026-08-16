import { validate } from 'class-validator';
import { CreateWithdrawalDto, GetStatementQueryDto, PixKeyType } from './withdrawal.dto';

describe('Withdrawal and Statement DTO Validation', () => {
  it('should validate CreateWithdrawalDto with valid CPF Pix key', async () => {
    const dto = new CreateWithdrawalDto();
    dto.amountCents = 1000;
    dto.pixKeyType = PixKeyType.CPF;
    dto.pixKey = '12345678909'; // 11 digits

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail CreateWithdrawalDto validation with invalid CPF format', async () => {
    const dto = new CreateWithdrawalDto();
    dto.amountCents = 1000;
    dto.pixKeyType = PixKeyType.CPF;
    dto.pixKey = '1234567'; // less than 11 digits

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('pixKey');
  });

  it('should validate CreateWithdrawalDto with valid EMAIL Pix key', async () => {
    const dto = new CreateWithdrawalDto();
    dto.amountCents = 1000;
    dto.pixKeyType = PixKeyType.EMAIL;
    dto.pixKey = 'merchant@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail CreateWithdrawalDto validation with invalid EMAIL format', async () => {
    const dto = new CreateWithdrawalDto();
    dto.amountCents = 1000;
    dto.pixKeyType = PixKeyType.EMAIL;
    dto.pixKey = 'invalid-email';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('pixKey');
  });

  it('should validate GetStatementQueryDto with valid query params', async () => {
    const dto = new GetStatementQueryDto();
    dto.status = 'APPROVED';
    dto.type = 'PIX';
    dto.limit = 50;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail GetStatementQueryDto with invalid limit', async () => {
    const dto = new GetStatementQueryDto();
    dto.limit = 200; // max 100

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });
});
