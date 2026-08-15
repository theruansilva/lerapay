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
} from 'lucide-react';

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
      const amountCents = Math.round(parseFloat(newLinkAmount.replace(',', '.')) * 100);
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

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    try {
      const amountCents = Math.round(parseFloat(withdrawAmount.replace(',', '.')) * 100);
      await api.post('/api/wallet/withdrawals', {
        amountCents,
        pixKey: withdrawPixKey,
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
      <header className="border-b border-[#222222] bg-[#0E0E0E]/80 backdrop-blur sticky top-0 z-10 px-6 py-4">
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
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <Wallet className="w-5 h-5" /> Saldo Disponível
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Lera Box Gateway
              </span>
            </div>

            <div>
              <div className="text-4xl font-extrabold tracking-tight text-white font-mono">
                {wallet ? wallet.formattedBrl : 'Carregando...'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Saldo sincronizado com o gateway em centavos
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition"
              >
                <ArrowUpRight className="w-4 h-4" /> Solicitar Saque Pix
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-white text-base mb-1">Links de Pagamento</h2>
              <p className="text-xs text-slate-400">
                Gere checkouts Pix e Cartão com parcelamento dinâmico.
              </p>
            </div>

            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs rounded-xl transition"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" /> Criar Novo Link
            </button>
          </div>
        </div>

        {/* Links Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Meus Links de Checkout</h2>
          {links.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
              Nenhum link de pagamento gerado ainda. Clique em "Criar Novo Link" para começar.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between space-y-4 transition"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-mono">{link.slug}</span>
                      <span className="text-emerald-400 font-semibold">{link.status}</span>
                    </div>
                    <h3 className="font-bold text-white text-base line-clamp-1">{link.title}</h3>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
                      {(link.amountCents / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => copyToClipboard(link.slug)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedSlug === link.slug ? 'Copiado!' : 'Copiar Link'}
                    </button>
                    <a
                      href={`/checkout/${link.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg transition"
                      title="Abrir Checkout"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
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
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
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
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Todos os Métodos</option>
                <option value="PIX">Pix</option>
                <option value="CARD">Cartão</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Data / Ref</th>
                    <th className="px-6 py-3.5">Título / Pagador</th>
                    <th className="px-6 py-3.5">Método</th>
                    <th className="px-6 py-3.5">Valor Bruto</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Nenhuma transação encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
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
                                <QrCode className="w-4 h-4 text-emerald-400" /> Pix
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 text-sky-400" /> {tx.installments}x Cartão
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
      </main>

      {/* Modal: Create Link */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Criar Link de Checkout</h3>
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título do Produto / Serviço</label>
                <input
                  type="text"
                  required
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Ex: Consultoria / Curso Online"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
                <input
                  type="text"
                  required
                  value={newLinkAmount}
                  onChange={(e) => setNewLinkAmount(e.target.value)}
                  placeholder="Ex: 99,90"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Solicitar Saque Pix</h3>

            {withdrawError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                {withdrawError}
              </div>
            )}

            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valor do Saque (R$)</label>
                <input
                  type="text"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Ex: 150,00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo da Chave</label>
                <select
                  value={withdrawKeyType}
                  onChange={(e) => setWithdrawKeyType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
                >
                  <option value="EMAIL">E-mail</option>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="PHONE">Telefone</option>
                  <option value="RANDOM">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chave Pix de Destino</label>
                <input
                  type="text"
                  required
                  value={withdrawPixKey}
                  onChange={(e) => setWithdrawPixKey(e.target.value)}
                  placeholder="sua-chave@pix.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm font-mono"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20"
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
