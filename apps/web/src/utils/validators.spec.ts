import { describe, it, expect } from 'bun:test';
import {
  maskCPF,
  validateCPF,
  maskCNPJ,
  validateCNPJ,
  maskCardNumber,
  detectCardBrand,
  validateCardLuhn,
  validateCardExpiration,
  maskCVV,
} from './validators';

describe('Validators & Masks Utility', () => {
  describe('CPF', () => {
    it('should format CPF correctly', () => {
      expect(maskCPF('12345678901')).toBe('123.456.789-01');
      expect(maskCPF('123')).toBe('123');
      expect(maskCPF('123456')).toBe('123.456');
    });

    it('should validate valid CPF correctly', () => {
      // Known valid CPFs for test
      expect(validateCPF('52998224725')).toBe(true);
      expect(validateCPF('529.982.247-25')).toBe(true);
    });

    it('should reject invalid or repeated CPF', () => {
      expect(validateCPF('11111111111')).toBe(false);
      expect(validateCPF('12345678900')).toBe(false);
      expect(validateCPF('123')).toBe(false);
    });
  });

  describe('CNPJ', () => {
    it('should format CNPJ correctly', () => {
      expect(maskCNPJ('10480314000192')).toBe('10.480.314/0001-92');
    });

    it('should validate valid CNPJ', () => {
      expect(validateCNPJ('10.480.314/0001-92')).toBe(true);
    });

    it('should reject invalid CNPJ', () => {
      expect(validateCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validateCNPJ('10.480.314/0001-99')).toBe(false);
    });
  });

  describe('Credit Card', () => {
    it('should mask card number in 4-digit blocks', () => {
      expect(maskCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
    });

    it('should detect card brand from BIN', () => {
      expect(detectCardBrand('4111111111111111')).toBe('Visa');
      expect(detectCardBrand('5123456789012345')).toBe('Mastercard');
      expect(detectCardBrand('341234567890123')).toBe('Amex');
      expect(detectCardBrand('4011781234567890')).toBe('Elo');
      expect(detectCardBrand('6062821234567890')).toBe('Hipercard');
    });

    it('should validate card number with Luhn algorithm', () => {
      // 4111111111111111 is a known valid Luhn test number
      expect(validateCardLuhn('4111111111111111')).toBe(true);
      expect(validateCardLuhn('4111111111111112')).toBe(false);
    });

    it('should validate card expiration date', () => {
      expect(validateCardExpiration('12', '30')).toBe(true);
      expect(validateCardExpiration('13', '30')).toBe(false);
      expect(validateCardExpiration('01', '20')).toBe(false); // past year
    });

    it('should mask CVV according to brand', () => {
      expect(maskCVV('12345', 'Visa')).toBe('123');
      expect(maskCVV('12345', 'Amex')).toBe('1234');
    });
  });
});
