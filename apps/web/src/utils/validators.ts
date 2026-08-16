/**
 * Formatação e Validação de CPF, CNPJ e Cartão de Crédito
 */

// --- CPF ---

export function maskCPF(value: string): string {
 const digits = value.replace(/\D/g, '').slice(0, 11);
 if (digits.length <= 3) return digits;
 if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
 if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
 return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function validateCPF(cpf: string): boolean {
 const clean = cpf.replace(/\D/g, '');
 if (clean.length !== 11) return false;

 // Rejeita sequências iguais conhecidas
 if (/^(\d)\1{10}$/.test(clean)) return false;

 // Primeiro dígito verificador
 let sum = 0;
 for (let i = 0; i < 9; i++) {
  sum += parseInt(clean[i], 10) * (10 - i);
 }
 let rest = (sum * 10) % 11;
 if (rest === 10 || rest === 11) rest = 0;
 if (rest !== parseInt(clean[9], 10)) return false;

 // Segundo dígito verificador
 sum = 0;
 for (let i = 0; i < 10; i++) {
  sum += parseInt(clean[i], 10) * (11 - i);
 }
 rest = (sum * 10) % 11;
 if (rest === 10 || rest === 11) rest = 0;
 if (rest !== parseInt(clean[10], 10)) return false;

 return true;
}

// --- CNPJ ---

export function maskCNPJ(value: string): string {
 const digits = value.replace(/\D/g, '').slice(0, 14);
 if (digits.length <= 2) return digits;
 if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
 if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
 if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
 return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function validateCNPJ(cnpj: string): boolean {
 const clean = cnpj.replace(/\D/g, '');
 if (clean.length !== 14) return false;
 if (/^(\d)\1{13}$/.test(clean)) return false;

 const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
 const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

 let sum = 0;
 for (let i = 0; i < 12; i++) {
  sum += parseInt(clean[i], 10) * weights1[i];
 }
 let rest = sum % 11;
 const digit1 = rest < 2 ? 0 : 11 - rest;
 if (digit1 !== parseInt(clean[12], 10)) return false;

 sum = 0;
 for (let i = 0; i < 13; i++) {
  sum += parseInt(clean[i], 10) * weights2[i];
 }
 rest = sum % 11;
 const digit2 = rest < 2 ? 0 : 11 - rest;
 if (digit2 !== parseInt(clean[13], 10)) return false;

 return true;
}

export function maskCPFOrCNPJ(value: string): string {
 const digits = value.replace(/\D/g, '');
 if (digits.length > 11) {
  return maskCNPJ(digits);
 }
 return maskCPF(digits);
}

// --- CARTÃO DE CRÉDITO ---

export type CardBrandType = 'Visa' | 'Mastercard' | 'Elo' | 'Amex' | 'Hipercard' | 'Outro';

export function detectCardBrand(cardNumber: string): CardBrandType {
 const clean = cardNumber.replace(/\D/g, '');
 if (!clean) return 'Visa';

 if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650|6516|6550)/.test(clean)) return 'Elo';
 if (/^(606282|3841)/.test(clean)) return 'Hipercard';
 if (/^(34|37)/.test(clean)) return 'Amex';
 if (/^4/.test(clean)) return 'Visa';
 if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';

 return 'Outro';
}

export function maskCardNumber(value: string): string {
 const digits = value.replace(/\D/g, '').slice(0, 16);
 // Formata em blocos de 4
 const parts: string[] = [];
 for (let i = 0; i < digits.length; i += 4) {
  parts.push(digits.slice(i, i + 4));
 }
 return parts.join(' ');
}

export function validateCardLuhn(cardNumber: string): boolean {
 const clean = cardNumber.replace(/\D/g, '');
 if (clean.length < 13 || clean.length > 19) return false;

 let sum = 0;
 let shouldDouble = false;

 for (let i = clean.length - 1; i >= 0; i--) {
  let digit = parseInt(clean.charAt(i), 10);

  if (shouldDouble) {
   digit *= 2;
   if (digit > 9) digit -= 9;
  }

  sum += digit;
  shouldDouble = !shouldDouble;
 }

 return sum % 10 === 0;
}

export function maskCVV(value: string, brand?: CardBrandType): string {
 const maxLen = brand === 'Amex' ? 4 : 3;
 return value.replace(/\D/g, '').slice(0, maxLen);
}

export function maskMonth(value: string): string {
 const digits = value.replace(/\D/g, '').slice(0, 2);
 const num = parseInt(digits, 10);
 if (digits.length === 2 && (num < 1 || num > 12)) {
  return '12';
 }
 return digits;
}

export function maskYear(value: string): string {
 return value.replace(/\D/g, '').slice(0, 2);
}

export function validateCardExpiration(month: string, year: string): boolean {
 const m = parseInt(month, 10);
 const y = parseInt(year, 10);

 if (isNaN(m) || isNaN(y) || m < 1 || m > 12) return false;

 const now = new Date();
 const currentYear = now.getFullYear() % 100; // e.g. 26
 const currentMonth = now.getMonth() + 1; // 1-12

 if (y < currentYear) return false;
 if (y === currentYear && m < currentMonth) return false;

 return true;
}

// --- VALORES EM REAIS (BRL) ---

export function maskCurrencyBRL(value: string): string {
 const digits = value.replace(/\D/g, '');
 if (!digits) return '0,00';
 const num = parseInt(digits, 10) / 100;
 return num.toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 });
}

export function parseCurrencyBRLToCents(value: string): number {
 const digits = value.replace(/\D/g, '');
 return parseInt(digits, 10) || 0;
}

export function formatCentsToBRL(cents: number, withPrefix = true): string {
 const num = (cents || 0) / 100;
 const formatted = num.toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 });
 return withPrefix ? `R$ ${formatted}` : formatted;
}
