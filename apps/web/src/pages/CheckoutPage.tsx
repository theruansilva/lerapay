import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  CreditCard,
  QrCode,
  Copy,
  ShieldCheck,
  Clock,
  Lock,
  Printer,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import {
  maskCPF,
  validateCPF,
  maskCardNumber,
  detectCardBrand,
  validateCardLuhn,
  maskMonth,
  maskYear,
  maskCVV,
  validateCardExpiration,
  type CardBrandType,
} from '../utils/validators';

interface CheckoutLink {
  id: string;
  title: string;
  slug: string;
  description?: string;
  amountCents: number;
  status: string;
  expiresAt?: string;
  merchant?: {
    name: string;
    email: string;
  };
}
interface InstallmentPlan {
  installments: number;
  feePercent: number;
  installmentAmountCents: number;
  totalAmountCents: number;
  feeAmountCents: number;
}

interface OrderData {
  id: string;
  externalReference: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
  paymentMethod: 'PIX' | 'CARD';
  amountCents: number;
  pixQrCodeBase64?: string;
  pixEmv?: string;
  payerName?: string;
  installments: number;
  createdAt: string;
}

export function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [link, setLink] = useState<CheckoutLink | null>(null);
  const [method, setMethod] = useState<'PIX' | 'CARD'>('PIX');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pix state
  const [pixPayerName, setPixPayerName] = useState('');
  const [pixPayerEmail, setPixPayerEmail] = useState('');
  const [pixPayerDoc, setPixPayerDoc] = useState('');
  const [pixLoading, setPixLoading] = useState(false);

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardMonth, setCardMonth] = useState('12');
  const [cardYear, setCardYear] = useState('28');
  const [cardCvv, setCardCvv] = useState('');
  const [cardInstallments, setCardInstallments] = useState(1);
  const [cardBrand, setCardBrand] = useState('Visa');
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [cardLoading, setCardLoading] = useState(false);

  // Order state
  const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
  const [copiedEmv, setCopiedEmv] = useState(false);

  useEffect(() => {
    async function loadCheckoutData() {
      try {
        const linkRes = await api.get(`/api/checkout/links/${slug}`);
        setLink(linkRes.data);

        // Fetch installment plans
        const feesRes = await api.get('/api/fees/calculate', {
          params: {
            amountCents: linkRes.data.amountCents,
            brand: cardBrand,
          },
        });
        setInstallmentPlans(feesRes.data);
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        setError(errorObj.response?.data?.message || 'Link de pagamento inválido ou expirado');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCheckoutData();
    }
  }, [slug, cardBrand]);

  // Polling order status if pending
  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'APPROVED' || activeOrder.status === 'DENIED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/checkout/orders/${activeOrder.externalReference}`);
        if (res.data.status !== activeOrder.status) {
          setActiveOrder(res.data);
        }
      } catch (e) {
        // Ignore polling error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeOrder]);

  // Mask & input handlers
  const handlePixDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPixPayerDoc(maskCPF(e.target.value));
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCardNumber(e.target.value);
    setCardNumber(masked);
    const detected = detectCardBrand(masked);
    if (detected !== 'Outro') {
      setCardBrand(detected);
    }
  };

  const handleCardMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardMonth(maskMonth(e.target.value));
  };

  const handleCardYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardYear(maskYear(e.target.value));
  };

  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(maskCVV(e.target.value, cardBrand as CardBrandType));
  };

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // CPF validation if provided
    if (pixPayerDoc && !validateCPF(pixPayerDoc)) {
      setError('O CPF informado é inválido. Por favor, verifique os 11 dígitos.');
      return;
    }

    setPixLoading(true);

    try {
      const res = await api.post(`/api/checkout/pay/${slug}/pix`, {
        payerName: pixPayerName,
        payerEmail: pixPayerEmail,
        payerDocument: pixPayerDoc.replace(/\D/g, '') || undefined,
      });
      setActiveOrder(res.data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Falha ao gerar Pix');
    } finally {
      setPixLoading(false);
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Card Number Luhn validation
    const cleanCard = cardNumber.replace(/\D/g, '');
    if (!validateCardLuhn(cleanCard)) {
      setError('Número de cartão de crédito inválido. Por favor, verifique a numeração digitada.');
      return;
    }

    // Card Expiration validation
    if (!validateCardExpiration(cardMonth, cardYear)) {
      setError('Data de validade do cartão inválida ou vencida.');
      return;
    }

    // CVV validation
    const minCvvLen = cardBrand === 'Amex' ? 4 : 3;
    if (cardCvv.length < minCvvLen) {
      setError(`Código de segurança (CVV) inválido. São necessários ${minCvvLen} dígitos.`);
      return;
    }

    // Cardholder validation
    if (cardHolder.trim().length < 3) {
      setError('Informe o nome impresso no cartão.');
      return;
    }

    setCardLoading(true);

    const selectedPlan = installmentPlans.find((p) => p.installments === cardInstallments);
    const feePercent = selectedPlan ? selectedPlan.feePercent : 2.99;

    try {
      const res = await api.post(`/api/checkout/pay/${slug}/card`, {
        cardNumber: cleanCard,
        cardHolderName: cardHolder.trim(),
        cardExpirationMonth: cardMonth.padStart(2, '0'),
        cardExpirationYear: cardYear.length === 2 ? `20${cardYear}` : cardYear,
        cardCvv,
        installments: Number(cardInstallments),
        feePercent,
        brand: cardBrand,
      });
      setActiveOrder(res.data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Falha ao processar pagamento com cartão');
    } finally {
      setCardLoading(false);
    }
  };
  const copyEmvToClipboard = () => {
    if (activeOrder?.pixEmv) {
      navigator.clipboard.writeText(activeOrder.pixEmv);
      setCopiedEmv(true);
      setTimeout(() => setCopiedEmv(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Carregando informações do pagamento...
      </div>
    );
  }

  if (error && !link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Link Indisponível</h2>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  // Printable Receipt View when approved
  if (activeOrder && activeOrder.status === 'APPROVED') {
    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4 flex items-center justify-center">
        <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 print:m-0 print:p-0 print:shadow-none">
          <div className="text-center space-y-2 border-b border-slate-100 pb-6">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Comprovante de Pagamento</h2>
            <p className="text-xs text-slate-500 font-medium">Lera Pay Banking as a Service</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-emerald-600">PAGAMENTO APROVADO</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Valor Pago</span>
              <span className="font-bold text-slate-900 font-mono text-lg">
                {((activeOrder.amountCents || link?.amountCents || 0) / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Método</span>
              <span className="font-semibold">{activeOrder.paymentMethod === 'PIX' ? 'Pix Instantâneo' : `${activeOrder.installments}x no Cartão`}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Produto / Serviço</span>
              <span className="font-semibold text-right">{link?.title}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
              <span className="text-slate-500">Identificador (Ref)</span>
              <span className="font-mono text-slate-700">{activeOrder.externalReference}</span>
            </div>
            <div className="flex justify-between py-2 text-xs">
              <span className="text-slate-500">Data e Hora</span>
              <span className="text-slate-700">{new Date(activeOrder.createdAt).toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div className="pt-4 flex gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition"
            >
              <Printer className="w-4 h-4" /> Imprimir Comprovante
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-black text-slate-100 py-12 px-4 flex items-center justify-center font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#958BC2]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Column: Order Summary */}
        <div className="md:col-span-5 bg-[#141414] border border-[#282828] rounded-3xl p-7 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <img src="/assets/logo.png" alt="Lera Pay" className="h-8 w-auto object-contain" />
            </a>
            <div className="border-l border-slate-700 pl-3">
              <h1 className="font-bold text-sm text-white">Checkout Seguro</h1>
              <p className="text-[11px] text-slate-400">Gateway Lera Pay</p>
            </div>
          </div>

          <div className="border-t border-b border-[#282828] py-5 space-y-2">
            <h2 className="text-xl font-bold text-white leading-tight">{link?.title}</h2>
            {link?.description && <p className="text-xs text-slate-400 leading-relaxed">{link.description}</p>}

            <div className="pt-3">
              <span className="text-xs text-slate-400 block mb-1 font-semibold uppercase tracking-wider">Total a pagar:</span>
              <div className="text-3xl font-black text-[#958BC2] font-mono">
                {((link?.amountCents || 0) / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#958BC2]" />
            <span>Processamento criptografado pelo Lera Box Gateway</span>
          </div>
        </div>

        {/* Right Column: Payment Form */}
        <div className="md:col-span-7 bg-[#141414] border border-[#282828] rounded-3xl p-7 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#0E0E0E] rounded-2xl border border-[#282828]">
            <button
              type="button"
              onClick={() => {
                setMethod('PIX');
                setActiveOrder(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition ${method === 'PIX'
                ? 'bg-[#958BC2] text-white shadow-lg shadow-[#958BC2]/30'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <QrCode className="w-4 h-4" /> Pagar com Pix
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('CARD');
                setActiveOrder(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition ${method === 'CARD'
                ? 'bg-[#958BC2] text-white shadow-lg shadow-[#958BC2]/30'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <CreditCard className="w-4 h-4" /> Cartão de Crédito
            </button>
          </div>

          {/* Method: PIX */}
          {method === 'PIX' && (
            <div className="space-y-4">
              {!activeOrder ? (
                <form onSubmit={handleGeneratePix} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Seu Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={pixPayerName}
                      onChange={(e) => setPixPayerName(e.target.value)}
                      placeholder="Nome do pagador"
                      className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#958BC2] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail para Recibo</label>
                    <input
                      type="email"
                      required
                      value={pixPayerEmail}
                      onChange={(e) => setPixPayerEmail(e.target.value)}
                      placeholder="email@pagador.com"
                      className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#958BC2] transition"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">CPF do Pagador (opcional)</label>
                      {pixPayerDoc && validateCPF(pixPayerDoc) && (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Válido
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={pixPayerDoc}
                      onChange={handlePixDocChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#958BC2] transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pixLoading}
                    className="w-full py-3.5 bg-[#958BC2] hover:bg-[#7a6fa8] text-white font-bold rounded-xl text-sm transition shadow-lg shadow-[#958BC2]/25 disabled:opacity-50 mt-4"
                  >
                    {pixLoading ? 'Gerando QR Code...' : 'Gerar QR Code Pix'}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-5 bg-[#0E0E0E] p-6 rounded-2xl border border-[#282828]">
                  <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
                    <QRCodeSVG
                      value={activeOrder.pixEmv || `https://lerapay.com/pay/${activeOrder.externalReference}`}
                      size={200}
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Escaneie o QR Code no app do seu banco</p>
                    <p className="text-xs text-slate-400">Ou utilize a opção Pix Copia e Cola abaixo</p>
                  </div>

                  {activeOrder.pixEmv && (
                    <div className="space-y-2">
                      <button
                        onClick={copyEmvToClipboard}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#1F1F1F] hover:bg-[#282828] text-[#958BC2] font-bold text-xs rounded-xl border border-[#333333] transition"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedEmv ? 'Código Copiado com Sucesso!' : 'Copiar Código Pix Copia e Cola'}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-xs text-[#958BC2] font-medium animate-pulse">
                    <Clock className="w-4 h-4" /> Aguardando confirmação do pagamento...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Method: CARD */}
          {method === 'CARD' && (
            <form onSubmit={handleCardPayment} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Número do Cartão</label>
                  {cardBrand && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#958BC2]/20 text-[#958BC2] font-bold border border-[#958BC2]/30">
                      {cardBrand}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#958BC2] transition"
                  />
                  <CreditCard className="absolute right-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome Impresso no Cartão</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  placeholder="NOME COMO NO CARTÃO"
                  className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#958BC2] transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mês</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={cardMonth}
                    onChange={handleCardMonthChange}
                    placeholder="MM"
                    className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm text-center font-mono focus:outline-none focus:border-[#958BC2] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ano</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={cardYear}
                    onChange={handleCardYearChange}
                    placeholder="AA"
                    className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm text-center font-mono focus:outline-none focus:border-[#958BC2] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">CVV</label>
                  <input
                    type="text"
                    required
                    maxLength={cardBrand === 'Amex' ? 4 : 3}
                    value={cardCvv}
                    onChange={handleCardCvvChange}
                    placeholder={cardBrand === 'Amex' ? '1234' : '123'}
                    className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm text-center font-mono focus:outline-none focus:border-[#958BC2] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Parcelamento (Taxas do Gateway)</label>
                <select
                  value={cardInstallments}
                  onChange={(e) => setCardInstallments(Number(e.target.value))}
                  className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#958BC2] transition"
                >
                  {installmentPlans.map((plan) => (
                    <option key={plan.installments} value={plan.installments}>
                      {plan.installments}x de{' '}
                      {(plan.installmentAmountCents / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}{' '}
                      (Taxa: {plan.feePercent}%) - Total:{' '}
                      {(plan.totalAmountCents / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={cardLoading}
                className="w-full py-3.5 bg-[#958BC2] hover:bg-[#7a6fa8] text-white font-bold rounded-xl text-sm transition shadow-lg shadow-[#958BC2]/25 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {cardLoading ? 'Processando Pagamento...' : 'Confirmar Pagamento'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div >
  );
}
