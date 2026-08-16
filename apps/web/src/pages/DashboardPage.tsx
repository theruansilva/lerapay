import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  Wallet,
  ArrowUpRight,
  PlusCircle,
  RefreshCw,
  LogOut,
  CreditCard,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Mail,
  MessageCircle,
} from 'lucide-react';
import {
  maskCPF,
  validateCPF,
  maskCNPJ,
  validateCNPJ,
  maskCurrencyBRL,
  parseCurrencyBRLToCents,
} from '../utils/validators';

interface WalletData {
  balanceCents: number;
  formattedBrl: string;
  currency: string;
}

interface Transaction {
  id: string;
  externalReference: string;
  paymentMethod: 'PIX' | 'CARD';
  amountCents: number;
  formattedAmount: string;
  feePercent: number;
  installments: number;
  status: 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  title: string;
  payerName?: string;
  createdAt: string;
}

interface CheckoutLinkItem {
  id: string;
  slug: string;
  title: string;
  amountCents: number;
  status: string;
  createdAt: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [links, setLinks] = useState<CheckoutLinkItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkAmount, setNewLinkAmount] = useState('');

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPixKey, setWithdrawPixKey] = useState('');
  const [withdrawKeyType, setWithdrawKeyType] = useState('EMAIL');
  const [withdrawError, setWithdrawError] = useState('');

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Webhook setup state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Gateway link credentials state
  const [isGatewayLinkOpen, setIsGatewayLinkOpen] = useState(false);
  const [gwDocument, setGwDocument] = useState('');
  const [gwPassword, setGwPassword] = useState('');
  const [gwLinkLoading, setGwLinkLoading] = useState(false);
  const [gwLinkMessage, setGwLinkMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes, linksRes] = await Promise.all([
        api.get('/api/wallet'),
        api.get('/api/wallet/transactions', {
          params: {
            status: statusFilter || undefined,
            type: typeFilter || undefined,
          },
        }),
        api.get('/api/checkout/links'),
      ]);

      setWallet(walletRes.data);
      setTransactions(txRes.data);
      setLinks(linksRes.data);
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number } };
      if (errorObj.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, typeFilter]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amountCents = parseCurrencyBRLToCents(newLinkAmount);
      if (amountCents <= 0) {
        alert('Informe um valor válido maior que zero.');
        return;
      }
      await api.post('/api/checkout/links', {
        title: newLinkTitle,
        amountCents,
      });
      setIsLinkModalOpen(false);
      setNewLinkTitle('');
      setNewLinkAmount('');
      fetchDashboardData();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || 'Erro ao criar link');
    }
  };

  const handlePixKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (withdrawKeyType === 'CPF') {
      setWithdrawPixKey(maskCPF(val));
    } else if (withdrawKeyType === 'CNPJ') {
      setWithdrawPixKey(maskCNPJ(val));
    } else {
      setWithdrawPixKey(val);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');

    // Validate CPF / CNPJ Pix Key
    if (withdrawKeyType === 'CPF' && !validateCPF(withdrawPixKey)) {
      setWithdrawError('A Chave Pix (CPF) informada é inválida.');
      return;
    }
    if (withdrawKeyType === 'CNPJ' && !validateCNPJ(withdrawPixKey)) {
      setWithdrawError('A Chave Pix (CNPJ) informada é inválida.');
      return;
    }

    try {
      const amountCents = parseCurrencyBRLToCents(withdrawAmount);
      if (amountCents <= 0) {
        setWithdrawError('Informe um valor de saque válido maior que zero.');
        return;
      }
      await api.post('/api/wallet/withdrawals', {
        amountCents,
        pixKey: withdrawPixKey.replace(/\D/g, '') || withdrawPixKey,
        pixKeyType: withdrawKeyType,
      });
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setWithdrawPixKey('');
      fetchDashboardData();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setWithdrawError(errorObj.response?.data?.message || 'Erro ao solicitar saque');
    }
  };

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/checkout/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('lerapay_token');
    localStorage.removeItem('lerapay_user');
    navigate('/login');
  };

  const handleWebhookSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.startsWith('http')) {
      setWebhookMessage({ type: 'err', text: 'URL inválida. Use https://...' });
      return;
    }
    setWebhookLoading(true);
    setWebhookMessage(null);
    try {
      await api.post('/api/webhooks/setup', { url: webhookUrl });
      setWebhookMessage({ type: 'ok', text: 'Callbacks PAYMENT_PIX, PAYMENT_CARD e WITHDRAWAL cadastrados com sucesso!' });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setWebhookMessage({ type: 'err', text: errorObj.response?.data?.message || 'Erro ao cadastrar webhooks' });
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleGatewayLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setGwLinkLoading(true);
    setGwLinkMessage(null);
    try {
      await api.post('/api/auth/gateway/link', { document: gwDocument.replace(/\D/g, ''), gatewayPassword: gwPassword });
      setGwLinkMessage({ type: 'ok', text: 'Credenciais vinculadas! Token do gateway salvo com sucesso.' });
      setGwDocument('');
      setGwPassword('');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setGwLinkMessage({ type: 'err', text: errorObj.response?.data?.message || 'Falha ao vincular credenciais' });
    } finally {
      setGwLinkLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Negado
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Expirado
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <XCircle className="w-3.5 h-3.5" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-3.5 h-3.5" /> Pendente
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-16 font-sans">
      {/* Header */}
      <header className="border-b border-brand-border-muted bg-brand-surface-dark/80 backdrop-blur sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <img src="/assets/logo.png" alt="Lera Pay" className="h-8 w-auto object-contain" />
            </a>
            <div className="border-l border-slate-700 pl-3">
              <h1 className="font-bold text-sm leading-none text-white">Portal do Lojista</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Banking as a Service</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              title="Atualizar Dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Top Cards: Balance and Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gradient-to-br from-brand-surface-elevated to-brand-surface-dark border border-brand-border rounded-3xl p-7 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-brand-primary text-sm font-semibold">
                <Wallet className="w-5 h-5" /> Saldo Disponível
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/30 font-mono font-bold">
                Lera Box BaaS
              </span>
            </div>

            <div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                {wallet ? wallet.formattedBrl : 'Carregando...'}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Saldo disponível para saque imediato via Pix
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-primary/25 transition"
              >
                <ArrowUpRight className="w-4 h-4" /> Solicitar Saque Pix
              </button>
            </div>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-3xl p-7 flex flex-col justify-between shadow-xl">
            <div>
              <h2 className="font-bold text-white text-base mb-1.5">Links de Pagamento</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gere checkouts Pix e Cartão com parcelamento em até 21x.
              </p>
            </div>

            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-surface-input hover:bg-brand-border border border-brand-border-input hover:border-brand-primary text-white font-bold text-xs rounded-xl transition"
            >
              <PlusCircle className="w-4 h-4 text-brand-primary" /> Criar Novo Link
            </button>
          </div>
        </div>

        {/* Links Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Meus Links de Checkout</h2>
          {links.length === 0 ? (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 text-center text-slate-400 text-sm">
              Nenhum link de pagamento gerado ainda. Clique em "Criar Novo Link" para começar.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="bg-brand-surface border border-brand-border hover:border-brand-primary/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-mono">{link.slug}</span>
                      <span className="text-brand-primary font-semibold">{link.status}</span>
                    </div>
                    <h3 className="font-bold text-white text-base line-clamp-1">{link.title}</h3>
                    <div className="text-xl font-bold font-mono text-brand-primary mt-2">
                      {(link.amountCents / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-brand-border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(link.slug)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-surface-input hover:bg-brand-border text-xs font-medium text-slate-200 rounded-xl transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedSlug === link.slug ? 'Copiado!' : 'Copiar Link'}
                      </button>
                      <a
                        href={`/checkout/${link.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-brand-surface-input hover:bg-brand-border text-slate-300 hover:text-brand-primary rounded-xl transition"
                        title="Abrir Checkout"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`mailto:?subject=${encodeURIComponent(`Link de Pagamento - ${link.title}`)}&body=${encodeURIComponent(
                          `Olá! Segue seu link de pagamento para ${link.title} no valor de ${(link.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}:\n\n${window.location.origin}/checkout/${link.slug}`
                        )}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-brand-surface-secondary hover:bg-brand-surface-card text-[11px] font-medium text-slate-300 hover:text-white rounded-lg border border-brand-border-card transition"
                        title="Enviar por E-mail"
                      >
                        <Mail className="w-3.5 h-3.5 text-brand-primary" />
                        E-mail
                      </a>
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Olá! Segue seu link de pagamento para ${link.title} no valor de ${(link.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}: ${window.location.origin}/checkout/${link.slug}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-brand-surface-secondary hover:bg-brand-surface-card text-[11px] font-medium text-emerald-400 hover:text-emerald-300 rounded-lg border border-brand-border-card transition"
                        title="Enviar por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Statement Section */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">Extrato de Movimentações</h2>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-brand-surface border border-brand-surface-card text-xs text-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-primary"
              >
                <option value="">Todos os Status</option>
                <option value="APPROVED">Sucesso (APPROVED)</option>
                <option value="DENIED">Falha (DENIED)</option>
                <option value="EXPIRED">Expirado (EXPIRED)</option>
                <option value="CANCELLED">Cancelado (CANCELLED)</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-brand-surface border border-brand-surface-card text-xs text-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-primary"
              >
                <option value="">Todos os Métodos</option>
                <option value="PIX">Pix</option>
                <option value="CARD">Cartão</option>
              </select>
            </div>
          </div>
          {/* Transactions Table */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-border-subtle text-slate-400 uppercase font-semibold border-b border-brand-border">
                  <tr>
                    <th className="px-6 py-4">Data / Ref</th>
                    <th className="px-6 py-4">Título / Pagador</th>
                    <th className="px-6 py-4">Método</th>
                    <th className="px-6 py-4">Valor Bruto</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-muted text-slate-300">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        Nenhuma transação encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-brand-surface-secondary transition">
                        <td className="px-6 py-4">
                          <div className="font-mono text-slate-200">{tx.externalReference}</div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(tx.createdAt).toLocaleString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{tx.title}</div>
                          <div className="text-slate-400">{tx.payerName || 'Não identificado'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-medium">
                            {tx.paymentMethod === 'PIX' ? (
                              <>
                                <QrCode className="w-4 h-4 text-brand-primary" /> Pix
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 text-brand-primary" /> {tx.installments}x Cartão
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-white text-sm">
                          {tx.formattedAmount}
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(tx.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Gateway Credentials & Webhooks Settings */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Configurações da Conta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Gateway Credentials Link */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="font-bold text-white text-sm">Vincular Credenciais Lera Box</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Após criar sua conta no gateway e receber as credenciais por e-mail, vincule-as aqui para habilitar cobranças.
                </p>
              </div>
              {gwLinkMessage && (
                <div className={`p-3 rounded-xl text-xs ${gwLinkMessage.type === 'ok' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'}`}>
                  {gwLinkMessage.text}
                </div>
              )}
              <form onSubmit={handleGatewayLink} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">CPF / CNPJ da conta gateway</label>
                  <input
                    type="text"
                    required
                    value={gwDocument}
                    onChange={(e) => setGwDocument(e.target.value)}
                    placeholder="Apenas dígitos"
                    className="w-full bg-brand-surface-input border border-brand-border-input rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-primary transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha da conta gateway</label>
                  <input
                    type="password"
                    required
                    value={gwPassword}
                    onChange={(e) => setGwPassword(e.target.value)}
                    placeholder="Senha recebida por e-mail"
                    className="w-full bg-brand-surface-input border border-brand-border-input rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-primary transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={gwLinkLoading}
                  className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-brand-primary/25"
                >
                  {gwLinkLoading ? 'Vinculando...' : 'Vincular Credenciais'}
                </button>
              </form>
            </div>

            {/* Webhook Setup */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="font-bold text-white text-sm">Configurar Callbacks de Webhook</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Registra no gateway os callbacks <span className="font-mono text-slate-300">PAYMENT_PIX</span>, <span className="font-mono text-slate-300">PAYMENT_CARD</span> e <span className="font-mono text-slate-300">WITHDRAWAL</span> para esta URL.
                </p>
              </div>
              {webhookMessage && (
                <div className={`p-3 rounded-xl text-xs ${webhookMessage.type === 'ok' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'}`}>
                  {webhookMessage.text}
                </div>
              )}
              <form onSubmit={handleWebhookSetup} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">URL pública da sua API BaaS</label>
                  <input
                    type="url"
                    required
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://sua-api.dominio.com/api/webhooks"
                    className="w-full bg-brand-surface-input border border-brand-border-input rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-primary transition font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={webhookLoading}
                  className="w-full py-2.5 bg-brand-surface-input hover:bg-brand-border disabled:opacity-50 border border-brand-border-input hover:border-brand-primary text-white font-bold text-xs rounded-xl transition"
                >
                  {webhookLoading ? 'Cadastrando...' : 'Cadastrar Callbacks'}
                </button>
              </form>
            </div>

          </div>
        </section>
      </main>

      {/* Modal: Create Link */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-brand-surface border border-brand-border-card rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Criar Link de Checkout</h3>
              <p className="text-xs text-slate-400 mt-1">Configure o título e valor para cobrança online</p>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título do Produto / Serviço</label>
                <input
                  type="text"
                  required
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Ex: Consultoria / Curso Online"
                  className="w-full bg-brand-surface-input border border-brand-border-input rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Valor (R$)</label>
                <input
                  type="text"
                  required
                  value={newLinkAmount}
                  onChange={(e) => setNewLinkAmount(maskCurrencyBRL(e.target.value))}
                  placeholder="0,00"
                  className="w-full bg-brand-surface-input border border-brand-border-input rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary font-mono text-sm transition"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="flex-1 py-3 bg-brand-surface-input hover:bg-brand-border text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-primary/25"
                >
                  Gerar Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Withdraw */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-brand-surface border border-brand-border-card rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Solicitar Saque Pix</h3>
              <p className="text-xs text-slate-400 mt-1">Transfira o saldo disponível direto para sua conta bancária</p>
            </div>

            {withdrawError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {withdrawError}
              </div>
            )}

            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Valor do Saque (R$)</label>
                <input
                  type="text"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(maskCurrencyBRL(e.target.value))}
                  placeholder="0,00"
                  className="w-full bg-brand-surface-input border border-brand-border-input rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary font-mono text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo da Chave</label>
                <select
                  value={withdrawKeyType}
                  onChange={(e) => {
                    setWithdrawKeyType(e.target.value);
                    setWithdrawPixKey('');
                  }}
                  className="w-full bg-brand-surface-input border border-brand-border-input rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary text-sm transition"
                >
                  <option value="EMAIL">E-mail</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="PHONE">Telefone</option>
                  <option value="RANDOM">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Chave Pix de Destino</label>
                <input
                  type="text"
                  required
                  value={withdrawPixKey}
                  onChange={handlePixKeyChange}
                  placeholder={
                    withdrawKeyType === 'CPF'
                      ? '000.000.000-00'
                      : withdrawKeyType === 'CNPJ'
                        ? '00.000.000/0000-00'
                        : withdrawKeyType === 'PHONE'
                          ? '(11) 90000-0000'
                          : 'sua-chave@pix.com'
                  }
                  maxLength={withdrawKeyType === 'CPF' ? 14 : withdrawKeyType === 'CNPJ' ? 18 : 60}
                  className="w-full bg-brand-surface-input border border-brand-border-input rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary text-sm font-mono transition"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 py-3 bg-brand-surface-input hover:bg-brand-border text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-primary/25"
                >
                  Confirmar Saque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
