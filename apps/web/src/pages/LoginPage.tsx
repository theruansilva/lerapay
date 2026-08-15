import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Lock, Mail, Store } from 'lucide-react';

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@lerapay.com');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('Lojista Demo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.post('/api/auth/register', { email, password, name });
        localStorage.setItem('lerapay_token', res.data.token);
        localStorage.setItem('lerapay_user', JSON.stringify(res.data.user));
      } else {
        const res = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('lerapay_token', res.data.token);
        localStorage.setItem('lerapay_user', JSON.stringify(res.data.user));
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden font-sans">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#958BC2]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#141414] border border-[#2A2A2A] rounded-3xl p-8 sm:p-10 shadow-2xl text-white relative z-10">
        <div className="text-center mb-8">
          <a href="/" className="inline-block hover:opacity-90 transition-opacity">
            <img src="/assets/logo.png" alt="Lera Pay" className="h-10 mx-auto object-contain mb-3" />
          </a>
          <h1 className="text-xl font-bold tracking-tight text-white">
            {isRegister ? 'Criar Conta Lojista' : 'Acesse sua Conta'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister ? 'Cadastre seu negócio e comece a vender' : 'Gerencie suas maquininhas, saldo e extratos'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Loja / Lojista</label>
              <div className="relative">
                <Store className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#958BC2] transition-colors"
                  placeholder="Nome do seu negócio"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#958BC2] transition-colors"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#958BC2] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#958BC2] hover:bg-[#7a6fa8] text-white font-bold py-3.5 rounded-xl transition duration-200 shadow-lg shadow-[#958BC2]/30 disabled:opacity-50 mt-6 text-sm"
          >
            {loading ? 'Processando...' : isRegister ? 'Cadastrar e Acessar' : 'Entrar no Painel'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-slate-400 hover:text-[#958BC2] transition"
          >
            {isRegister ? 'Já possui uma conta? Entrar' : 'Não tem conta? Cadastre-se'}
          </button>

          <div>
            <a href="/" className="text-[11px] text-slate-500 hover:text-slate-300 transition">
              ← Voltar para a Página Inicial
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
