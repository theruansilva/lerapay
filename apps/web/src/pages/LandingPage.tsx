import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Smartphone,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Percent,
  Calculator,
  HelpCircle,
  Users,
  Lock,
  Globe,
  Phone,
  Clock,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Headphones,
  FileText
} from 'lucide-react';

export function LandingPage() {
  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Simulator state
  const [plano, setPlano] = useState<'com_antecipacao' | 'sem_antecipacao'>('com_antecipacao');
  const [tipoVenda, setTipoVenda] = useState('1x');
  const [valorVendaStr, setValorVendaStr] = useState('1.000,00');
  const [quemPagaTaxa, setQuemPagaTaxa] = useState<'eu' | 'cliente'>('eu');
  const [simulou, setSimulou] = useState(true);

  // Fee tables
  const taxasComAntecipacao: Record<string, number> = {
    '1x': 3.28,
    '2x': 4.03,
    '3x': 4.77,
    '4x': 5.52,
    '5x': 6.26,
    '6x': 7.01,
    '7x': 7.75,
    '8x': 8.50,
    '9x': 9.24,
    '10x': 9.99,
    '11x': 10.73,
    '12x': 11.48,
    '13x': 12.22,
    '14x': 12.97,
    '15x': 13.71,
    '16x': 14.46,
    '17x': 15.20,
    '18x': 15.95,
    '19x': 16.69,
    '20x': 17.44,
    '21x': 18.18,
  };

  const taxasSemAntecipacao: Record<string, number> = {
    '1x': 3.10,
    '2x': 3.80,
    '3x': 3.80,
    '4x': 3.80,
    '5x': 3.80,
    '6x': 3.80,
    '7x': 3.95,
    '8x': 3.95,
    '9x': 3.95,
    '10x': 3.95,
    '11x': 3.95,
    '12x': 3.95,
  };

  // Helper format BRL
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Handle currency input formatting
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setValorVendaStr('0,00');
      return;
    }
    const num = parseFloat(raw) / 100;
    setValorVendaStr(formatBRL(num));
  };

  // Switch plan options
  const availableInstallments = useMemo(() => {
    const table = plano === 'com_antecipacao' ? taxasComAntecipacao : taxasSemAntecipacao;
    return Object.keys(table);
  }, [plano]);

  // Adjust tipoVenda when plan changes if out of range
  const handlePlanoChange = (newPlano: 'com_antecipacao' | 'sem_antecipacao') => {
    setPlano(newPlano);
    if (newPlano === 'sem_antecipacao') {
      const num = parseInt(tipoVenda.replace('x', ''), 10);
      if (num > 12) setTipoVenda('12x');
    }
  };

  // Compute simulation results
  const simulationResult = useMemo(() => {
    const cleanStr = valorVendaStr.replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(cleanStr) || 0;
    const table = plano === 'com_antecipacao' ? taxasComAntecipacao : taxasSemAntecipacao;
    const taxa = table[tipoVenda] || 3.28;

    let valorRecebido = 0;
    let valorCobrarCliente = 0;
    let valorLiquido = 0;

    if (quemPagaTaxa === 'eu') {
      valorRecebido = valor - (valor * taxa) / 100;
      valorCobrarCliente = valor;
      valorLiquido = valorRecebido;
    } else {
      valorCobrarCliente = valor + (valor * taxa) / 100;
      valorRecebido = valor;
      valorLiquido = valor;
    }

    const numParcelas = parseInt(tipoVenda.replace('x', ''), 10) || 1;
    const valorParcela = valorCobrarCliente / numParcelas;
    const prazoRecebimento = plano === 'com_antecipacao' ? '1 dia útil' : '30 dias';

    return {
      valorRecebido,
      taxa,
      valorCobrarCliente,
      valorParcela,
      numParcelas,
      valorLiquido,
      prazoRecebimento,
      nomePlano: plano === 'com_antecipacao' ? 'Com Antecipação' : 'Sem Antecipação',
    };
  }, [valorVendaStr, plano, tipoVenda, quemPagaTaxa]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#958BC2] selection:text-white flex flex-col">

      {/* 1. TOP TICKER / ANNOUNCEMENT BAR */}
      <div className="bg-[#0E0E0E] border-b border-[#222222] py-2 overflow-hidden select-none text-xs md:text-sm font-medium text-slate-300">
        <div className="flex whitespace-nowrap animate-marquee">
          <div className="flex items-center gap-8 px-4">
            <span>Aqui você encontra um parceiro para Lucrar mais 💰</span>
            <span className="text-[#958BC2]">Receba as suas vendas em 1 dia útil com a maquininha Lera Pay 🤑</span>
            <span>Crédito em 12X apenas 9,28% 💸</span>
            <span className="text-[#958BC2]">Concorra a uma maquininha SMART 🤑</span>
            <span>Participe do sorteio no nosso perfil do Instagram @lerapay</span>
            <span>•</span>
            <span>Aqui você encontra um parceiro para Lucrar mais 💰</span>
            <span className="text-[#958BC2]">Receba as suas vendas em 1 dia útil com a maquininha Lera Pay 🤑</span>
            <span>Crédito em 12X apenas 9,28% 💸</span>
            <span className="text-[#958BC2]">Concorra a uma maquininha SMART 🤑</span>
          </div>
          <div className="flex items-center gap-8 px-4" aria-hidden="true">
            <span>Aqui você encontra um parceiro para Lucrar mais 💰</span>
            <span className="text-[#958BC2]">Receba as suas vendas em 1 dia útil com a maquininha Lera Pay 🤑</span>
            <span>Crédito em 12X apenas 9,28% 💸</span>
            <span className="text-[#958BC2]">Concorra a uma maquininha SMART 🤑</span>
            <span>Participe do sorteio no nosso perfil do Instagram @lerapay</span>
            <span>•</span>
            <span>Aqui você encontra um parceiro para Lucrar mais 💰</span>
            <span className="text-[#958BC2]">Receba as suas vendas em 1 dia útil com a maquininha Lera Pay 🤑</span>
            <span>Crédito em 12X apenas 9,28% 💸</span>
            <span className="text-[#958BC2]">Concorra a uma maquininha SMART 🤑</span>
          </div>
        </div>
      </div>

      {/* 2. HEADER & NAVIGATION */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/assets/logo.png"
              alt="Lera Pay"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">

            {/* Dropdown 1: Maquininhas */}
            <div
              className="relative group"
              onMouseEnter={() => setOpenDropdown('maquininhas')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1.5 text-slate-200 hover:text-[#958BC2] py-2 transition-colors">
                Maquininhas
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>

              {openDropdown === 'maquininhas' && (
                <div className="absolute top-full left-0 w-80 bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <a href="#maquininhas" className="block p-2.5 rounded-lg hover:bg-[#222222] transition-colors">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#958BC2]" />
                        Maquininhas de cartão
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Lucre mais a cada venda com as menores taxas</p>
                    </a>
                    <a href="#solucoes" className="block p-2.5 rounded-lg hover:bg-[#222222] transition-colors">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#958BC2]" />
                        Gestão de Vendas
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Acompanhe o progresso do seu negócio em tempo real</p>
                    </a>
                    <a href="#solucoes" className="block p-2.5 rounded-lg hover:bg-[#222222] transition-colors">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#958BC2]" />
                        Lera Pay Tap
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Transforme seu celular em maquininha!</p>
                    </a>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
                    <a
                      href="#calculadora"
                      className="block text-center text-xs font-semibold py-2 bg-[#958BC2] text-white rounded-lg hover:bg-[#7a6fa8] transition-colors"
                    >
                      Peça a sua maquininha
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Dropdown 2: Taxas */}
            <div
              className="relative group"
              onMouseEnter={() => setOpenDropdown('taxas')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1.5 text-slate-200 hover:text-[#958BC2] py-2 transition-colors">
                Taxas
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>

              {openDropdown === 'taxas' && (
                <div className="absolute top-full left-0 w-72 bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <a href="#taxas" className="block p-2.5 rounded-lg hover:bg-[#222222] transition-colors">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <Percent className="w-4 h-4 text-[#958BC2]" />
                        Nossas Taxas
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Consulte as nossas taxas imbatíveis</p>
                    </a>
                    <a href="#calculadora" className="block p-2.5 rounded-lg hover:bg-[#222222] transition-colors">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-[#958BC2]" />
                        Calculadora de Taxas
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Faça comparação de taxas online</p>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Dropdown 3: Sobre Nós */}
            <div
              className="relative group"
              onMouseEnter={() => setOpenDropdown('sobre')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1.5 text-slate-200 hover:text-[#958BC2] py-2 transition-colors">
                Sobre Nós
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>

              {openDropdown === 'sobre' && (
                <div className="absolute top-full left-0 w-64 bg-[#141414] border border-[#2A2A2A] rounded-xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <a href="#sobre" className="block p-2 rounded-lg hover:bg-[#222222] text-sm text-slate-200 hover:text-white transition-colors">
                      Nossa História
                    </a>
                    <a href="#blog" className="block p-2 rounded-lg hover:bg-[#222222] text-sm text-slate-200 hover:text-white transition-colors">
                      Blog Lera Pay
                    </a>
                    <a href="#contato" className="block p-2 rounded-lg hover:bg-[#222222] text-sm text-slate-200 hover:text-white transition-colors">
                      Central de Ajuda & Dúvidas
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a href="#solucoes" className="text-slate-200 hover:text-[#958BC2] transition-colors">
              Soluções
            </a>

            <a href="#contato" className="text-slate-200 hover:text-[#958BC2] transition-colors">
              Contato
            </a>
          </nav>

          {/* Right CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold rounded-full border border-[#958BC2] text-[#958BC2] hover:bg-[#958BC2] hover:text-white transition-all duration-200 shadow-sm"
            >
              Login
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold rounded-full bg-[#958BC2] text-white hover:bg-[#7a6fa8] transition-all duration-200 shadow-lg shadow-[#958BC2]/25"
            >
              Cadastre-se
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[#1E1E1E] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#111111] border-b border-[#2A2A2A] px-6 py-6 space-y-4">
            <div className="space-y-3">
              <a
                href="#maquininhas"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-200 hover:text-[#958BC2]"
              >
                Maquininhas
              </a>
              <a
                href="#taxas"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-200 hover:text-[#958BC2]"
              >
                Nossas Taxas
              </a>
              <a
                href="#calculadora"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-200 hover:text-[#958BC2]"
              >
                Simulador de Taxas
              </a>
              <a
                href="#sobre"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-200 hover:text-[#958BC2]"
              >
                Sobre Nós
              </a>
              <a
                href="#solucoes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-200 hover:text-[#958BC2]"
              >
                Soluções
              </a>
              <a
                href="#blog"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-200 hover:text-[#958BC2]"
              >
                Blog
              </a>
              <a
                href="#contato"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-200 hover:text-[#958BC2]"
              >
                Contato
              </a>
            </div>

            <div className="pt-4 border-t border-[#262626] flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full text-center py-2.5 font-semibold text-sm rounded-xl border border-[#958BC2] text-[#958BC2]"
              >
                Login
              </Link>
              <Link
                to="/login"
                className="w-full text-center py-2.5 font-semibold text-sm rounded-xl bg-[#958BC2] text-white"
              >
                Cadastre-se
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#958BC2]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B1B1B] border border-[#2E2E2E] text-xs font-semibold text-[#958BC2]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Taxas Justas e Acessíveis para Todo Tipo de Negócio</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Maquininha com melhor taxa para seu negócio{' '}
                <span className="text-[#958BC2]">Lucrar mais</span>
              </h1>

              {/* Rate Highlight Card */}
              <div className="inline-block bg-[#161616] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left max-w-md w-full">
                <div className="text-xs font-bold uppercase tracking-widest text-[#958BC2]">
                  CRÉDITO EM 10X
                </div>
                <div className="text-5xl sm:text-6xl font-black text-white mt-1 tracking-tight">
                  9,99%
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Receba suas vendas em 1 dia útil diretamente na sua conta
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="#calculadora"
                  className="w-full sm:w-auto px-8 py-4 bg-[#958BC2] text-white font-bold rounded-full hover:bg-[#7a6fa8] transition-all transform hover:scale-105 shadow-xl shadow-[#958BC2]/30 flex items-center justify-center gap-2 text-base"
                >
                  <span>PEDIR MAQUININHA</span>
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#taxas"
                  className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/40 text-white font-bold rounded-full hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 text-base"
                >
                  VER TAXAS
                </a>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="relative w-full max-w-lg">
                <img
                  src="/assets/maquinasComMulher.png"
                  alt="Maquininhas Lera Pay"
                  className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(149,139,194,0.25)]"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. TRUST & BENEFIT PILLARS STRIP */}
      <section className="bg-[#121212] border-y border-[#222222] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A]/60 border border-[#282828]">
              <div className="w-12 h-12 rounded-xl bg-[#958BC2]/10 border border-[#958BC2]/30 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-[#958BC2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Desempenho superior</h4>
                <p className="text-xs text-slate-400">em vendas parceladas</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A]/60 border border-[#282828]">
              <div className="w-12 h-12 rounded-xl bg-[#958BC2]/10 border border-[#958BC2]/30 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-[#958BC2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">PRESENÇA EM TODO</h4>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold text-[#958BC2]">BRASIL</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A]/60 border border-[#282828]">
              <div className="flex items-center gap-2 shrink-0">
                <img src="/assets/otimo.svg" alt="Ótimo" className="h-8 w-auto" />
                <img src="/assets/reclame-aqui-logo.svg" alt="Reclame Aqui" className="h-7 w-auto" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Excelente Atendimento</h4>
                <p className="text-xs text-emerald-400 font-semibold">Selo Ótimo Reclame Aqui</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A]/60 border border-[#282828]">
              <div className="w-12 h-12 rounded-xl bg-[#958BC2]/10 border border-[#958BC2]/30 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-[#958BC2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Frete Grátis</h4>
                <p className="text-xs text-slate-400">para todo o BRASIL</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. NOSSAS TAXAS HIGHLIGHT */}
      <section id="taxas" className="py-20 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#958BC2] bg-[#958BC2]/10 px-4 py-1 rounded-full border border-[#958BC2]/30">
              NOSSAS TAXAS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
              Receba suas vendas em <span className="text-[#958BC2]">1 dia útil</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Sem pegadinhas, sem letras miúdas. As melhores taxas para alavancar os lucros do seu comércio ou serviço.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

            {/* Card 1: Débito */}
            <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 text-center hover:border-[#958BC2] transition-all hover:scale-105 shadow-xl">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                VENDAS NO DÉBITO
              </span>
              <div className="my-6">
                <span className="text-5xl lg:text-6xl font-black text-white">0,89%</span>
              </div>
              <p className="text-xs text-slate-400">Receba no próximo dia útil diretamente na sua conta</p>
            </div>

            {/* Card 2: Crédito à vista */}
            <div className="bg-[#181818] border-2 border-[#958BC2] rounded-3xl p-8 text-center relative hover:scale-105 transition-all shadow-2xl shadow-[#958BC2]/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#958BC2] text-white text-[11px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full">
                MAIS POPULAR
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                CRÉDITO À VISTA
              </span>
              <div className="my-6">
                <span className="text-5xl lg:text-6xl font-black text-[#958BC2]">3,28%</span>
              </div>
              <p className="text-xs text-slate-400">Dinheiro na mão em 1 dia útil para girar seu estoque</p>
            </div>

            {/* Card 3: Crédito 10x */}
            <div className="bg-[#141414] border border-[#262626] rounded-3xl p-8 text-center hover:border-[#958BC2] transition-all hover:scale-105 shadow-xl">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                CRÉDITO EM 10X
              </span>
              <div className="my-6">
                <span className="text-5xl lg:text-6xl font-black text-white">9,99%</span>
              </div>
              <p className="text-xs text-slate-400">Parcelamento acessível que aumenta a conversão</p>
            </div>

          </div>

          <div className="mt-12 text-center">
            <a
              href="#calculadora"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#958BC2] hover:text-white transition-colors"
            >
              <span>VER TODAS AS TAXAS NA CALCULADORA</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE RATE SIMULATOR / CALCULADORA DE TAXAS */}
      <section id="calculadora" className="py-20 bg-[#0A0A0A] border-t border-[#1C1C1C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#958BC2]">
              Simulador de Taxas
            </h2>
            <p className="text-xl text-white font-medium">
              No Lera Pay você recebe mais
            </p>
          </div>

          <div className="bg-[#141414] border border-[#282828] rounded-3xl p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Form Input Column */}
              <div className="lg:col-span-7 space-y-6">

                {/* Plan Toggle */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Selecione o plano:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handlePlanoChange('com_antecipacao')}
                      className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${plano === 'com_antecipacao'
                          ? 'bg-[#958BC2] text-white shadow-lg shadow-[#958BC2]/30'
                          : 'bg-[#202020] text-slate-300 border border-[#333333] hover:border-[#958BC2]'
                        }`}
                    >
                      Com Antecipação
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlanoChange('sem_antecipacao')}
                      className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${plano === 'sem_antecipacao'
                          ? 'bg-[#958BC2] text-white shadow-lg shadow-[#958BC2]/30'
                          : 'bg-[#202020] text-slate-300 border border-[#333333] hover:border-[#958BC2]'
                        }`}
                    >
                      Sem Antecipação
                    </button>
                  </div>
                </div>

                {/* Tipo de Venda & Valor da Venda */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Tipo da venda
                    </label>
                    <select
                      value={tipoVenda}
                      onChange={(e) => setTipoVenda(e.target.value)}
                      className="w-full bg-[#1F1F1F] border border-[#3A3A3A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#958BC2]"
                    >
                      {availableInstallments.map((key) => (
                        <option key={key} value={key}>
                          {key === '1x' ? 'À vista' : `Parcelado em ${key}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Valor da venda (R$)
                    </label>
                    <input
                      type="text"
                      value={valorVendaStr}
                      onChange={handleCurrencyChange}
                      className="w-full bg-[#1F1F1F] border border-[#3A3A3A] rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-[#958BC2]"
                      placeholder="1.000,00"
                    />
                  </div>
                </div>

                {/* Quem paga a taxa */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Quem paga a taxa?
                  </label>
                  <select
                    value={quemPagaTaxa}
                    onChange={(e) => setQuemPagaTaxa(e.target.value as 'eu' | 'cliente')}
                    className="w-full bg-[#1F1F1F] border border-[#3A3A3A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#958BC2]"
                  >
                    <option value="eu">Eu (Vendedor absorve)</option>
                    <option value="cliente">Cliente (Repassar taxa)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setSimulou(true)}
                  className="w-full py-3.5 bg-[#958BC2] text-white font-bold rounded-xl hover:bg-[#7a6fa8] transition-all shadow-lg shadow-[#958BC2]/30 flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Simular Agora</span>
                </button>
              </div>

              {/* Result Output Column */}
              <div className="lg:col-span-5 bg-[#1B1B1B] border border-[#2E2E2E] rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="border-b border-[#2E2E2E] pb-4">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Você recebe
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#958BC2] mt-1">
                    R$ {formatBRL(simulationResult.valorRecebido)}
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Taxa {simulationResult.nomePlano} ({tipoVenda}):</span>
                    <strong className="text-white">{simulationResult.taxa.toFixed(2)}%</strong>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>Valor a cobrar do cliente:</span>
                    <strong className="text-white">R$ {formatBRL(simulationResult.valorCobrarCliente)}</strong>
                  </div>

                  {simulationResult.numParcelas > 1 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Valor de cada parcela ({simulationResult.numParcelas}x):</span>
                      <strong className="text-white">R$ {formatBRL(simulationResult.valorParcela)}</strong>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-300 pt-2 border-t border-[#2A2A2A]">
                    <span>Valor líquido a receber:</span>
                    <strong className="text-emerald-400">R$ {formatBRL(simulationResult.valorLiquido)}</strong>
                  </div>

                  <div className="flex justify-between text-slate-300">
                    <span>Prazo de recebimento:</span>
                    <strong className="text-[#958BC2]">{simulationResult.prazoRecebimento}</strong>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2E2E2E]">
                  <p className="text-[11px] text-slate-400 text-center">
                    Simulação com base nas tabelas vigentes. O valor final pode variar conforme o perfil e bandeira.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 7. CARD BRANDS & DIGITAL WALLETS */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 flex justify-center">
              <img
                src="/assets/maquininhasComPorcentagem.png"
                alt="Maquininhas Lera Pay taxas"
                className="max-w-md w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>

            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Aceite as principais <span className="text-[#958BC2]">bandeiras e carteiras digitais</span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Não perca nenhuma venda por falta de opção. Nossas maquininhas e checkout aceitam cartões de crédito e débito das maiores bandeiras mundiais, pagamentos por aproximação (NFC), Pix e carteiras digitais como Apple Pay e Google Pay.
              </p>

              <div className="pt-2">
                <img
                  src="/assets/logos-bandeiras-cartao-1.webp"
                  alt="Bandeiras aceitas: Visa, Mastercard, Elo, Hipercard, Amex, Pix, Apple Pay, Google Pay"
                  className="w-full max-w-lg h-auto rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-[#958BC2]" />
                  <span>Pix instantâneo QR Code</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-[#958BC2]" />
                  <span>Aproximação NFC</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-[#958BC2]" />
                  <span>Vouchers & Benefícios</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-[#958BC2]" />
                  <span>Apple Pay & Google Pay</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. SECURITY & PCI DSS SECTION */}
      <section className="py-16 bg-[#0E0E0E] border-y border-[#202020]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#161616] border border-[#2B2B2B] rounded-3xl p-8 sm:p-12">

            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#958BC2] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>SEGURANÇA DE NÍVEL BANCÁRIO</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Suas transações seguras
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Suas transações estão cobertas pelo padrão <strong className="text-white">PCI DSS 4.0.1 de nível 1</strong> – o mais alto nível de certificação de segurança da indústria de pagamentos. Essa rigorosa padronização protege os dados dos clientes e das transações, garantindo total conformidade e tranquilidade para o seu negócio.
              </p>
            </div>

            <div className="shrink-0 flex items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10">
              <img
                src="/assets/pci.png"
                alt="PCI DSS Level 1 Certified"
                className="h-16 w-auto object-contain"
              />
            </div>

          </div>
        </div>
      </section>

      {/* 9. ABOUT US SECTION */}
      <section id="sobre" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-6 space-y-6">
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#958BC2] bg-[#958BC2]/10 px-4 py-1 rounded-full border border-[#958BC2]/30">
                SOBRE NÓS
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Nascemos para democratizar os Serviços Bancários
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Desde o seu início, a Lera Pay está comprometida em eliminar as complexidades e burocracias associadas aos bancos convencionais, oferecendo uma gama completa de serviços bancários de forma simplificada e direta.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Desenvolvemos tecnologia proprietária em Banking as a Service (BaaS) para conectar comerciantes, lojistas e empreendedores com as soluções de pagamento mais modernas e lucrativas do mercado.
              </p>

              <div className="pt-2">
                <a
                  href="#calculadora"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#958BC2] text-white font-bold rounded-full hover:bg-[#7a6fa8] transition-colors text-sm"
                >
                  <span>Conhecer a Lera Pay</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <img
                src="/assets/3imagens.png"
                alt="Equipe e Soluções Lera Pay"
                className="w-full max-w-lg h-auto rounded-2xl shadow-2xl"
              />
            </div>

          </div>
        </div>
      </section>

      {/* 10. MAQUININHAS SHOWCASE GRID */}
      <section id="maquininhas" className="py-20 bg-[#0A0A0A] border-t border-[#1C1C1C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center space-y-4 mb-16">
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#958BC2] bg-[#958BC2]/10 px-4 py-1 rounded-full border border-[#958BC2]/30">
              EQUIPAMENTOS DE PONTA
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Maquininhas modernas para cada necessidade
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Alta velocidade no processamento de vendas, conexão 4G e Wi-Fi sem custo adicional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Machine 1: Lera Smart */}
            <div className="bg-[#141414] border border-[#282828] rounded-3xl p-8 flex flex-col items-center text-center hover:border-[#958BC2] transition-all hover:scale-105 group shadow-xl">
              <div className="h-56 w-full flex items-center justify-center p-4">
                <img
                  src="/assets/leraSmart.png"
                  alt="Maquininha Lera Smart"
                  className="max-h-full max-w-full object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <h3 className="text-xl font-bold text-white mt-4">Lera Smart</h3>
              <p className="text-xs text-slate-400 mt-2 mb-6">
                Sistema operacional Android, tela touchscreen de alta definição, impressora térmica ultrarrápida e bateria duradoura.
              </p>
              <a
                href="#calculadora"
                className="mt-auto w-full py-2.5 bg-[#1F1F1F] text-white font-semibold rounded-xl hover:bg-[#958BC2] transition-colors text-sm"
              >
                Pedir Lera Smart
              </a>
            </div>

            {/* Machine 2: Lera Pro */}
            <div className="bg-[#141414] border border-[#282828] rounded-3xl p-8 flex flex-col items-center text-center hover:border-[#958BC2] transition-all hover:scale-105 group shadow-xl">
              <div className="h-56 w-full flex items-center justify-center p-4">
                <img
                  src="/assets/leraPro.png"
                  alt="Maquininha Lera Pro"
                  className="max-h-full max-w-full object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <h3 className="text-xl font-bold text-white mt-4">Lera Pro</h3>
              <p className="text-xs text-slate-400 mt-2 mb-6">
                Design compacto e robusto, teclado físico ergonômico, comprovante impresso na hora e conexão 4G garantida.
              </p>
              <a
                href="#calculadora"
                className="mt-auto w-full py-2.5 bg-[#1F1F1F] text-white font-semibold rounded-xl hover:bg-[#958BC2] transition-colors text-sm"
              >
                Pedir Lera Pro
              </a>
            </div>

            {/* Machine 3: Lera P2 */}
            <div className="bg-[#141414] border border-[#282828] rounded-3xl p-8 flex flex-col items-center text-center hover:border-[#958BC2] transition-all hover:scale-105 group shadow-xl">
              <div className="h-56 w-full flex items-center justify-center p-4">
                <img
                  src="/assets/p2.png"
                  alt="Maquininha Lera P2"
                  className="max-h-full max-w-full object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <h3 className="text-xl font-bold text-white mt-4">Lera P2</h3>
              <p className="text-xs text-slate-400 mt-2 mb-6">
                Mobilidade máxima para entregas e atendimento de balcão. Leve, moderna e aceita aproximação NFC.
              </p>
              <a
                href="#calculadora"
                className="mt-auto w-full py-2.5 bg-[#1F1F1F] text-white font-semibold rounded-xl hover:bg-[#958BC2] transition-colors text-sm"
              >
                Pedir Lera P2
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* 11. SOLUTIONS GRID */}
      <section id="solucoes" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center space-y-4 mb-16">
            <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#958BC2] bg-[#958BC2]/10 px-4 py-1 rounded-full border border-[#958BC2]/30">
              ECOSSISTEMA COMPLETO
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Encontre a solução que o seu negócio precisa
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-[#141414] border border-[#282828] rounded-2xl p-6 hover:border-[#958BC2] transition-all hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#958BC2]/10 border border-[#958BC2]/30 flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-[#958BC2]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Maquininhas com as melhores taxas
                </h3>
                <p className="text-xs text-slate-400">
                  Lucre mais a cada transação com equipamentos rápidos e confiáveis.
                </p>
              </div>
              <a
                href="#maquininhas"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#958BC2] hover:text-white mt-6 pt-4 border-t border-[#262626]"
              >
                <span>VER MAIS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="bg-[#141414] border border-[#282828] rounded-2xl p-6 hover:border-[#958BC2] transition-all hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#958BC2]/10 border border-[#958BC2]/30 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-[#958BC2]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Conta Digital Completa
                </h3>
                <p className="text-xs text-slate-400">
                  Finanças centralizadas para CPF e CNPJ: Pix, transferências e extratos transparentes.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#958BC2] hover:text-white mt-6 pt-4 border-t border-[#262626]"
              >
                <span>ACESSAR CONTA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-[#141414] border border-[#282828] rounded-2xl p-6 hover:border-[#958BC2] transition-all hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#958BC2]/10 border border-[#958BC2]/30 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-[#958BC2]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Link de Pagamento
                </h3>
                <p className="text-xs text-slate-400">
                  Venda pelas redes sociais e WhatsApp com total segurança e antifraude integrado.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#958BC2] hover:text-white mt-6 pt-4 border-t border-[#262626]"
              >
                <span>CRIAR LINK</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-[#141414] border border-[#282828] rounded-2xl p-6 hover:border-[#958BC2] transition-all hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#958BC2]/10 border border-[#958BC2]/30 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-[#958BC2]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Lera Pay Tap
                </h3>
                <p className="text-xs text-slate-400">
                  Transforme seu smartphone Android em uma maquininha de cartão por aproximação.
                </p>
              </div>
              <a
                href="#calculadora"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#958BC2] hover:text-white mt-6 pt-4 border-t border-[#262626]"
              >
                <span>CONHECER TAP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* 12. BLOG & ARTICLES */}
      <section id="blog" className="py-20 bg-[#0E0E0E] border-t border-[#1F1F1F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#958BC2]">
                BLOG & NOVIDADES
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                Fique por dentro das novidades
              </h2>
            </div>
            <a
              href="#calculadora"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#958BC2] hover:text-white"
            >
              <span>Ver todos os artigos</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden group hover:border-[#958BC2] transition-all">
              <div className="h-60 overflow-hidden relative">
                <img
                  src="/assets/maquininhas.jpg"
                  alt="Melhor maquininha de cartão em 2025"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-[#958BC2] text-xs font-bold px-3 py-1 rounded-full">
                  Guia do Comerciante
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-[#958BC2] transition-colors">
                  Melhor maquininha de cartão em 2025: Descubra a Opção Ideal para o Seu Negócio
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Confira o comparativo de taxas, bateria, conectividade e prazo de recebimento para escolher a parceira ideal.
                </p>
                <div className="pt-2">
                  <span className="text-xs font-bold text-[#958BC2] flex items-center gap-1">
                    LER ARTIGO COMPLETO <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden group hover:border-[#958BC2] transition-all">
              <div className="h-60 overflow-hidden relative">
                <img
                  src="/assets/mulherComMaquininha.png"
                  alt="Maquininha Smart Lera Pay"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-[#958BC2] text-xs font-bold px-3 py-1 rounded-full">
                  Tecnologia & Pagamentos
                </span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-[#958BC2] transition-colors">
                  Maquininha Smart Lera Pay: A Solução Completa para o Seu Negócio
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Descubra como o sistema Android integrado e a impressão de comprovante aumentam a agilidade no balcão.
                </p>
                <div className="pt-2">
                  <span className="text-xs font-bold text-[#958BC2] flex items-center gap-1">
                    LER ARTIGO COMPLETO <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 13. LICENCIADO CTA BANNER */}
      <section className="bg-gradient-to-r from-[#958BC2] to-[#675c91] py-12 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold">Seja um Licenciado Lera Pay</h3>
            <p className="text-sm text-purple-100 mt-1">
              Construa sua própria carteira de pagamentos e tenha renda recorrente mensal.
            </p>
          </div>
          <a
            href="https://api.whatsapp.com/send?phone=5511963130590&text=Ol%C3%A1,%20gostaria%20de%20saber%20mais%20sobre%20como%20ser%20um%20Licenciado%20Lera%20Pay"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-3.5 bg-black text-white font-bold rounded-full hover:bg-slate-900 transition-all shadow-xl text-sm shrink-0"
          >
            Falar com Especialista
          </a>
        </div>
      </section>

      {/* 14. FOOTER */}
      <footer id="contato" className="bg-[#080808] border-t border-[#1F1F1F] pt-16 pb-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">

            {/* Col 1 */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Institucional
              </h4>
              <ul className="space-y-2">
                <li><a href="#sobre" className="hover:text-white transition-colors">Sobre nós</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#sobre" className="hover:text-white transition-colors">Nossa História</a></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Soluções Negócio
              </h4>
              <ul className="space-y-2">
                <li><a href="#maquininhas" className="hover:text-white transition-colors">Maquininhas de cartão</a></li>
                <li><a href="#taxas" className="hover:text-white transition-colors">Nossas Taxas</a></li>
                <li><a href="#calculadora" className="hover:text-white transition-colors">Simular Taxas</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Conta Digital</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Soluções Vender
              </h4>
              <ul className="space-y-2">
                <li><a href="#solucoes" className="hover:text-white transition-colors">Gestão de Vendas</a></li>
                <li><a href="#solucoes" className="hover:text-white transition-colors">Lera Pay Tap</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Link de Pagamento</Link></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Atendimento
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-[#958BC2]" />
                  <span>Seg a Sex: 8h às 18h</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-[#958BC2]" />
                  <a href="tel:11963130590" className="hover:text-white">(11) 96313-0590</a>
                </li>
                <li>
                  <a
                    href="https://api.whatsapp.com/send?phone=5511963130590"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#958BC2] hover:underline font-semibold flex items-center gap-1 mt-1"
                  >
                    Suporte WhatsApp
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 5 */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Termos & Legal
              </h4>
              <ul className="space-y-1.5">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Compra</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gerenciamento de Risco</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Cookies</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ética & Socioambiental</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Antifraude & PLD</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
              </ul>
            </div>

            {/* Col 6 */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Área do Cliente
              </h4>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block text-center py-2 px-3 bg-[#958BC2] text-white font-bold rounded-lg hover:bg-[#7a6fa8] transition-colors text-xs"
                >
                  Acessar Conta
                </Link>
                <Link
                  to="/login"
                  className="block text-center py-2 px-3 bg-[#1A1A1A] border border-[#333] text-slate-200 font-semibold rounded-lg hover:bg-[#222] transition-colors text-xs"
                >
                  Criar Conta
                </Link>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-[#1C1C1C] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.png" alt="Lera Pay" className="h-6 w-auto opacity-75" />
              <span className="text-[11px] text-slate-500">
                Lera Pay. CNPJ N.º 10.480.314/0001-92
              </span>
            </div>

            <div className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} Lera Pay. Todos os direitos reservados.
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
