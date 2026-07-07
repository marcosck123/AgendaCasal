'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/ganchos/useAuth';

export default function Auth() {
  const [modo, setModo] = useState<'login' | 'cadastro' | 'codigo'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  const { login, register, verifyCode, resendCode } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    if (modo === 'login') {
      const { error } = await login(email, senha);
      if (error) setErro(error);
    } else if (modo === 'cadastro') {
      if (!nome.trim()) {
        setErro('Por favor, insira seu nome.');
        setCarregando(false);
        return;
      }
      const { error, precisaConfirmar } = await register(email, senha, nome);
      if (error) {
        setErro(error);
      } else if (precisaConfirmar) {
        setModo('codigo');
        setSucesso('Enviamos um código de confirmação para ' + email);
        setTimeout(() => codeInputRef.current?.focus(), 100);
      }
      // Se não precisa confirmar, o onAuthStateChange já loga e redireciona.
    }

    setCarregando(false);
  };

  const validar = async (code: string) => {
    const limpo = code.replace(/\D/g, '');
    if (limpo.length < 6) return;
    setErro('');
    setCarregando(true);
    const { error } = await verifyCode(email, limpo);
    if (error) {
      setErro(error);
      setCodigo('');
      codeInputRef.current?.focus();
    }
    // se validou, onAuthStateChange loga sozinho e redireciona
    setCarregando(false);
  };

  const reenviar = async () => {
    setErro('');
    setCarregando(true);
    const { error } = await resendCode(email);
    setSucesso(error ? '' : 'Código reenviado! Confira seu e-mail.');
    if (error) setErro(error);
    setCarregando(false);
  };

  const eyeIcon = (aberto: boolean) => aberto ? (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  ) : (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.7 3.6M6.6 6.6C3.8 8.6 2 12 2 12s3.5 6.5 10 6.5c1.4 0 2.7-.3 3.8-.8" />
      <path d="M9.9 9.9a2.8 2.8 0 0 0 4 4" />
    </svg>
  );

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
          ♥
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

      <div className="card card-strong" style={{ padding: 20, width: '100%', maxWidth: 400 }}>
        {modo === 'codigo' ? (
          /* ---- Etapa: validar código ---- */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>Confirme seu e-mail</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                Digite o código enviado para<br /><b style={{ color: 'var(--text)' }}>{email}</b>
              </div>
            </div>

            <input
              ref={codeInputRef}
              className="input"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Cole o código aqui"
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={e => { if (e.key === 'Enter') validar(codigo); }}
              style={{
                textAlign: 'center', height: 56,
                fontSize: 26, fontWeight: 700,
                letterSpacing: '0.3em', fontVariantNumeric: 'tabular-nums',
              }}
            />

            {erro && (
              <div style={{
                background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                color: 'var(--danger)', padding: '12px 14px',
                borderRadius: 'var(--radius-lg)', fontSize: 'var(--fs-13)',
              }}>{erro}</div>
            )}
            {sucesso && !erro && (
              <div style={{
                background: 'color-mix(in srgb, var(--status-online) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--status-online) 30%, transparent)',
                color: 'var(--status-online)', padding: '12px 14px',
                borderRadius: 'var(--radius-lg)', fontSize: 'var(--fs-13)',
              }}>{sucesso}</div>
            )}

            <button
              className="btn btn-primary btn-block"
              disabled={carregando || codigo.length < 6}
              style={{ opacity: carregando || codigo.length < 6 ? 0.6 : 1 }}
              onClick={() => validar(codigo)}
            >
              {carregando ? 'Validando...' : 'Confirmar'}
            </button>

            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button type="button" onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}
                style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Voltar
              </button>
              <button type="button" onClick={reenviar} disabled={carregando}
                style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                Reenviar código
              </button>
            </div>
          </div>
        ) : (
          /* ---- Login / Cadastro ---- */
          <>
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
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={verSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerSenha(v => !v)}
                    aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    style={{
                      position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                      width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none', color: 'var(--soft)', cursor: 'pointer',
                    }}
                  >
                    {eyeIcon(verSenha)}
                  </button>
                </div>
              </div>

              {erro && (
                <div style={{
                  background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                  color: 'var(--danger)', padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)', fontSize: 'var(--fs-13)',
                }}>{erro}</div>
              )}

              {sucesso && (
                <div style={{
                  background: 'color-mix(in srgb, var(--status-online) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--status-online) 30%, transparent)',
                  color: 'var(--status-online)', padding: '12px 14px',
                  borderRadius: 'var(--radius-lg)', fontSize: 'var(--fs-13)',
                }}>{sucesso}</div>
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
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: 'var(--fs-11)', color: 'var(--soft)', marginTop: 20 }}>
          Nosso · o espaço de vocês dois
        </p>
      </div>
    </div>
  );
}
