/**
 * Generates a valid CPF with correct check digits
 */
export function generateValidCPF(): string {
 const rnd = () => Math.floor(Math.random() * 9);
 const n = Array.from({ length: 9 }, rnd);

 let d1 = n.reduce((acc, digit, idx) => acc + digit * (10 - idx), 0);
 d1 = 11 - (d1 % 11);
 if (d1 >= 10) d1 = 0;

 const nWithD1 = [...n, d1];
 let d2 = nWithD1.reduce((acc, digit, idx) => acc + digit * (11 - idx), 0);
 d2 = 11 - (d2 % 11);
 if (d2 >= 10) d2 = 0;

 return `${n.slice(0, 3).join('')}.${n.slice(3, 6).join('')}.${n.slice(6, 9).join('')}-${d1}${d2}`;
}

/**
 * Generates a valid CNPJ with correct check digits
 */
export function generateValidCNPJ(): string {
 const rnd = () => Math.floor(Math.random() * 9);
 const n = [...Array.from({ length: 8 }, rnd), 0, 0, 0, 1]; // 0001 branch

 const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
 let d1 = n.reduce((acc, digit, idx) => acc + digit * w1[idx], 0);
 d1 = 11 - (d1 % 11);
 if (d1 >= 10) d1 = 0;

 const nWithD1 = [...n, d1];
 const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
 let d2 = nWithD1.reduce((acc, digit, idx) => acc + digit * w2[idx], 0);
 d2 = 11 - (d2 % 11);
 if (d2 >= 10) d2 = 0;

 return `${n.slice(0, 2).join('')}.${n.slice(2, 5).join('')}.${n.slice(5, 8).join('')}/${n.slice(8, 12).join('')}-${d1}${d2}`;
}

export const TEST_CARDS = {
 visa: {
  number: '4111111111111111',
  holder: 'Lojista Teste Visa',
  month: '12',
  year: '29',
  cvv: '123',
  brand: 'Visa',
 },
 mastercard: {
  number: '5555555555554444',
  holder: 'Lojista Teste Master',
  month: '10',
  year: '30',
  cvv: '456',
  brand: 'Mastercard',
 },
 elo: {
  number: '4011781111111111',
  holder: 'Lojista Teste Elo',
  month: '08',
  year: '28',
  cvv: '789',
  brand: 'Elo',
 },
 invalid: {
  number: '4111111111111112', // Fails Luhn
  holder: 'Invalido Silva',
  month: '01',
  year: '20', // Expired
  cvv: '99', // Too short
  brand: 'Visa',
 },
};
