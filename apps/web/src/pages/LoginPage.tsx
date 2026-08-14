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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-white">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-2xl">
            L
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lera Pay</h1>
            <p className="text-xs text-slate-400">Banking as a Service</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/20 border border-rose-500/50 rounded-lg text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Loja / Lojista</label>
              <div className="relative">
                <Store className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Nome do negócio"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-6"
          >
            {loading ? 'Processando...' : isRegister ? 'Criar Conta Lojista' : 'Entrar no Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            {isRegister ? 'Já possui uma conta? Entrar' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
