export interface GatewayLoginResponse {
  access_token?: string;
  token?: string;
  token_type?: string;
  codigoCliente?: number | string;
  chaveLoja?: string;
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
  id?: string;
  installments: number;
  feePercent: number;
  feePercentFormatted?: string;
  brand?: string;
}

export interface GatewayPixPaymentRequest {
  amount: number; // in cents
  payerDocument: string;
  externalReference?: string;
  description?: string;
  payerName?: string;
  payerEmail?: string;
}

export interface GatewayPixPaymentResponse {
  id: string;
  type?: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
  amount: number;
  description?: string;
  message?: string;
  metadata?: {
    txid?: string;
    emv?: string;
    qrCodeBase64?: string;
    externalReference?: string;
    payerDocument?: string;
    CodigoCliente?: number | string;
    ChaveLoja?: string;
    [key: string]: unknown;
  };
  txid?: string;
  qrCodeBase64?: string;
  emv?: string;
  externalReference?: string;
  walletBalance?: number;
}

export interface GatewayCardPaymentRequest {
  amount: number; // in cents
  cardNumber: string;
  cardHolderName?: string;
  cardHolder?: string;
  cardExpirationMonth?: string;
  expiryMonth?: string;
  cardExpirationYear?: string;
  expiryYear?: string;
  cardCvv?: string;
  cvv?: string;
  installments: number;
  feePercent: number;
  brand?: string;
  description?: string;
  externalReference?: string;
}

export interface GatewayCardPaymentResponse {
  id: string;
  type?: string;
  status: 'APPROVED' | 'DENIED' | 'PENDING';
  amount: number;
  installments?: number;
  feePercent?: number;
  externalReference?: string;
  message?: string;
  denialReason?: string;
  cardBrand?: string;
  cardLast4?: string;
  walletBalance?: number;
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
  document?: string;
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';
}

export interface GatewayWithdrawalResponse {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'DENIED';
  pixKey: string;
  createdAt: string;
}
