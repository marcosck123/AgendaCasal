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
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 26px 40px',
      }}
    >
      {/* Logo e título */}
      <div style={{ display: 'flex', gap: 13, marginBottom: 32, alignItems: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: 'linear-gradient(135deg, var(--brand-grad-start), var(--brand-grad-end))',
          color: '#fff7f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, letterSpacing: '0.04em',
          boxShadow: 'var(--shadow-sm)',
        }}>
          M&amp;A
        </div>
        <div>
          <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--text)' }}>
            Nosso
          </div>
          <div style={{ fontSize: 13, color: 'var(--soft)', marginTop: 4 }}>
            o espaço de vocês dois
          </div>
        </div>
      </div>

      {/* Card de login */}
      <div className="card card-strong" style={{ padding: 20, width: '100%', maxWidth: 400 }}>
        {/* Toggle login / cadastro */}
        <div className="seg" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={modo === 'login' ? 'on' : ''}
            onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={modo === 'cadastro' ? 'on' : ''}
            onClick={() => { setModo('cadastro'); setErro(''); setSucesso(''); }}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {modo === 'cadastro' && (
            <div>
              <label className="field-label">Seu nome</label>
              <input
                className="input"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como quer ser chamado(a)?"
                required
              />
            </div>
          )}

          <div>
            <label className="field-label">E-mail</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
            />
          </div>

          <div>
            <label className="field-label">Senha</label>
            <input
              className="input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {erro && (
            <div style={{
              background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
              color: 'var(--danger)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--fs-13)',
            }}>
              {erro}
            </div>
          )}

          {sucesso && (
            <div style={{
              background: 'color-mix(in srgb, var(--status-online) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--status-online) 30%, transparent)',
              color: 'var(--status-online)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--fs-13)',
            }}>
              {sucesso}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="btn btn-primary btn-block"
            style={{ marginTop: 4, opacity: carregando ? 0.6 : 1 }}
          >
            {carregando
              ? 'Aguarde...'
              : modo === 'login'
              ? 'Entrar'
              : 'Criar conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 'var(--fs-11)', color: 'var(--soft)', marginTop: 20 }}>
          Nosso · o espaço de vocês dois
        </p>
      </div>
    </div>
  );
}
