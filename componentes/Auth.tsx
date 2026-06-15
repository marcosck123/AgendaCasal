'use client';

import { useState } from 'react';
import { useAuth } from '@/ganchos/useAuth';

export default function Auth() {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    if (modo === 'login') {
      const { error } = await login(email, senha);
      if (error) setErro(error);
    } else {
      if (!nome.trim()) {
        setErro('Por favor, insira seu nome.');
        setCarregando(false);
        return;
      }
      const { error } = await register(email, senha, nome);
      if (error) {
        setErro(error);
      } else {
        setSucesso('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
      }
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-stone-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💑</div>
          <h1 className="text-3xl font-bold text-stone-800">AgendaCasal</h1>
          <p className="text-stone-500 mt-1">O espaço do nosso amor ❤️</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-amber-50 rounded-xl p-1 mb-6 border border-amber-100">
          <button
            onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              modo === 'login'
                ? 'bg-stone-700 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setModo('cadastro'); setErro(''); setSucesso(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              modo === 'cadastro'
                ? 'bg-stone-700 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Criar conta
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === 'cadastro' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Seu nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como quer ser chamado(a)?"
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-stone-800 placeholder-stone-300"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-stone-800 placeholder-stone-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 text-stone-800 placeholder-stone-300"
              required
              minLength={6}
            />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              ⚠️ {erro}
            </div>
          )}

          {sucesso && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
              ✅ {sucesso}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-3 bg-stone-700 hover:bg-stone-800 disabled:bg-stone-300 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            {carregando
              ? 'Aguarde...'
              : modo === 'login'
              ? 'Entrar no nosso espaço 💕'
              : 'Criar nossa conta 🌿'}
          </button>
        </form>

        <p className="text-center text-stone-400 text-xs mt-6">
          Feito com amor para vocês dois ❤️
        </p>
      </div>
    </div>
  );
}
