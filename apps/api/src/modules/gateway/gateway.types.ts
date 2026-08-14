export interface GatewayLoginResponse {
  token: string;
  CodigoCliente?: string;
  ChaveLoja?: string;
}

export interface GatewayUserMeResponse {
  id: string;
  email: string;
  name: string;
  document?: string;
}

export interface GatewayFeeItem {
  installments: number;
  feePercent: number;
  brand?: string;
}

export interface GatewayPixPaymentRequest {
  amount: number; // in cents
  externalReference: string;
  payerName?: string;
  payerEmail?: string;
  payerDocument?: string;
}

export interface GatewayPixPaymentResponse {
  id: string;
  txid: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
  qrCodeBase64?: string;
  emv?: string;
  amount: number;
  externalReference: string;
}

export interface GatewayCardPaymentRequest {
  amount: number; // in cents
  externalReference: string;
  cardNumber: string;
  cardHolderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  cardCvv: string;
  installments: number;
  feePercent: number;
  brand?: string;
}

export interface GatewayCardPaymentResponse {
  id: string;
  status: 'APPROVED' | 'DENIED' | 'PENDING';
  amount: number;
  installments: number;
  feePercent: number;
  externalReference: string;
  cardBrand?: string;
  cardLast4?: string;
}

export interface GatewayWalletResponse {
  balance: number; // in cents
  currency?: string;
}

export interface GatewayTransactionItem {
  id: string;
  amount: number;
  type: 'PIX' | 'CARD' | 'WITHDRAWAL';
  status: 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  externalReference?: string;
  createdAt: string;
}

export interface GatewayWithdrawalRequest {
  amount: number; // in cents
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
}

export interface GatewayWithdrawalResponse {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'DENIED';
  pixKey: string;
  createdAt: string;
}
