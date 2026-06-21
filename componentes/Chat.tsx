'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, Mensagem, Reacao } from '@/lib/supabase';
import Icon from './Icon';

interface ChatProps {
  userId: string;
  nomeUsuario: string;
}

const EMOJIS_REACAO = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

export default function Chat({ userId, nomeUsuario }: ChatProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [reacoes, setReacoes] = useState<Record<string, Reacao[]>>({});
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [uploadando, setUploadando] = useState(false);
  const [parceiroDigitando, setParceiroDigitando] = useState(false);
  const [digitando, setDigitando] = useState(false);
  const [respondendo, setRespondendo] = useState<Mensagem | null>(null);
  const [emojiMenuId, setEmojiMenuId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const digitandoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMensagens = useCallback(async () => {
    const { data } = await supabase
      .from('mensagens')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMensagens(data as Mensagem[]);

    const { data: reacs } = await supabase.from('reacoes').select('*');
    if (reacs) {
      const map: Record<string, Reacao[]> = {};
      (reacs as Reacao[]).forEach(r => {
        if (!map[r.mensagem_id]) map[r.mensagem_id] = [];
        map[r.mensagem_id].push(r);
      });
      setReacoes(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMensagens();
    const ch = supabase
      .channel('chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        setMensagens(prev => [...prev, payload.new as Mensagem]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reacoes' }, (payload) => {
        const r = payload.new as Reacao;
        setReacoes(prev => ({ ...prev, [r.mensagem_id]: [...(prev[r.mensagem_id] ?? []), r] }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reacoes' }, (payload) => {
        const r = payload.old as Reacao;
        setReacoes(prev => ({
          ...prev,
          [r.mensagem_id]: (prev[r.mensagem_id] ?? []).filter(x => x.id !== r.id),
        }));
      })
      .on('broadcast', { event: 'digitando' }, (payload) => {
        if (payload.payload.userId !== userId) {
          setParceiroDigitando(true);
          setTimeout(() => setParceiroDigitando(false), 3000);
        }
      })
      .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [fetchMensagens, userId]);

  useEffect(() => { scrollToBottom(); }, [mensagens, parceiroDigitando, scrollToBottom]);

  const emitirDigitando = () => {
    if (!digitando) {
      setDigitando(true);
      channelRef.current?.send({ type: 'broadcast', event: 'digitando', payload: { userId } });
    }
    if (digitandoTimerRef.current) clearTimeout(digitandoTimerRef.current);
    digitandoTimerRef.current = setTimeout(() => setDigitando(false), 2000);
  };

  const enviarTexto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || enviando) return;
    setEnviando(true);
    await supabase.from('mensagens').insert({
      conteudo: novaMensagem.trim(),
      enviado_por: userId,
      nome_remetente: nomeUsuario,
      casal_id: userId,
      tipo: 'texto',
      respondendo_id: respondendo?.id ?? null,
      respondendo_preview: respondendo ? respondendo.conteudo.slice(0, 60) : null,
    });
    setNovaMensagem('');
    setRespondendo(null);
    setEnviando(false);
  };

  const enviarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadando(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const nome = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('fotos').upload(nome, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(nome);
      await supabase.from('mensagens').insert({
        conteudo: urlData.publicUrl,
        enviado_por: userId,
        nome_remetente: nomeUsuario,
        casal_id: userId,
        tipo: 'foto',
      });
    } catch {
      alert('Erro ao enviar foto. Crie o bucket "fotos" no Supabase Storage (público).');
    }
    setUploadando(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.start(100);
      setGravando(true);
      setTempoGravacao(0);
      timerRef.current = setInterval(() => setTempoGravacao(t => t + 1), 1000);
    } catch {
      alert('Não foi possível acessar o microfone.');
    }
  };

  const pararEEnviarAudio = async () => {
    if (!mediaRecorderRef.current) return;
    setUploadando(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const duracao = tempoGravacao;
    const blob = await new Promise<Blob>((resolve) => {
      mediaRecorderRef.current!.onstop = () => resolve(new Blob(chunksRef.current, { type: 'audio/webm' }));
      mediaRecorderRef.current!.stop();
      mediaRecorderRef.current!.stream.getTracks().forEach(t => t.stop());
    });
    setGravando(false);
    try {
      const nome = `${userId}/${Date.now()}.webm`;
      const { error } = await supabase.storage.from('audios').upload(nome, blob, { contentType: 'audio/webm' });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('audios').getPublicUrl(nome);
      await supabase.from('mensagens').insert({
        conteudo: urlData.publicUrl,
        enviado_por: userId,
        nome_remetente: nomeUsuario,
        casal_id: userId,
        tipo: 'audio',
        duracao,
      });
    } catch {
      alert('Erro ao enviar áudio.');
    }
    setUploadando(false);
    setTempoGravacao(0);
  };

  const cancelarGravacao = () => {
    if (!mediaRecorderRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    setGravando(false);
    setTempoGravacao(0);
  };

  const reagir = async (mensagemId: string, emoji: string) => {
    setEmojiMenuId(null);
    const existente = (reacoes[mensagemId] ?? []).find(r => r.usuario_id === userId && r.emoji === emoji);
    if (existente) {
      await supabase.from('reacoes').delete().eq('id', existente.id);
    } else {
      await supabase.from('reacoes').insert({ mensagem_id: mensagemId, usuario_id: userId, emoji });
    }
  };

  const formatarTempo = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const formatarHora = (d: string) =>
    new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const reacoesPorEmoji = (msgId: string) => {
    const rs = reacoes[msgId] ?? [];
    const map: Record<string, number> = {};
    rs.forEach(r => { map[r.emoji] = (map[r.emoji] ?? 0) + 1; });
    return Object.entries(map);
  };

  const msgRespondida = (id?: string) => id ? mensagens.find(m => m.id === id) : undefined;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}
      onClick={() => setEmojiMenuId(null)}
    >
      {/* Header */}
      <div className="appbar">
        <div>
          <div className="appbar-title">Conversa</div>
          <div className="appbar-sub">chat do casal</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', paddingTop: 40 }}>Carregando...</div>
        ) : mensagens.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', paddingTop: 64 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <p style={{ fontWeight: 600 }}>Comecem a conversar!</p>
            <p style={{ fontSize: 13, marginTop: 4, color: 'var(--soft)' }}>Mande mensagem, foto ou áudio</p>
          </div>
        ) : (
          mensagens.map(msg => {
            const minha = msg.enviado_por === userId;
            const respondidaMsg = msgRespondida(msg.respondendo_id);
            const rsEmoji = reacoesPorEmoji(msg.id);

            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: minha ? 'flex-end' : 'flex-start', animation: 'msg-in var(--dur-slow) var(--ease-ui)' }}>
                <div
                  style={{
                    maxWidth: '78%', borderRadius: 18, padding: '10px 14px',
                    boxShadow: 'var(--shadow-sm)', position: 'relative',
                    background: minha ? 'var(--accent)' : 'var(--panel-strong)',
                    color: minha ? '#fff' : 'var(--text)',
                    borderBottomRightRadius: minha ? 4 : 18,
                    borderBottomLeftRadius: minha ? 18 : 4,
                  }}
                  onDoubleClick={e => { e.stopPropagation(); setEmojiMenuId(msg.id); }}
                >
                  {!minha && (
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--romance)', marginBottom: 4 }}>
                      {msg.nome_remetente}
                    </p>
                  )}

                  {respondidaMsg && (
                    <div style={{
                      marginBottom: 8, padding: '6px 10px', borderRadius: 10, fontSize: 12,
                      borderLeft: `2px solid ${minha ? 'rgba(255,255,255,0.5)' : 'var(--border-strong)'}`,
                      background: minha ? 'rgba(255,255,255,0.15)' : 'var(--bg)',
                      color: minha ? 'rgba(255,255,255,0.8)' : 'var(--muted)',
                    }}>
                      {respondidaMsg.conteudo.slice(0, 60)}{respondidaMsg.conteudo.length > 60 ? '…' : ''}
                    </div>
                  )}

                  {msg.tipo === 'foto' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.conteudo} alt="foto" style={{ borderRadius: 12, maxWidth: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                  ) : msg.tipo === 'audio' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
                      <Icon name="mic" size={18} />
                      <audio src={msg.conteudo} controls style={{ height: 32, width: 128 }} />
                      {msg.duracao != null && msg.duracao > 0 && (
                        <span style={{ fontSize: 12, color: minha ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}>
                          {formatarTempo(msg.duracao)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.conteudo}</p>
                  )}

                  <p style={{ fontSize: 11, marginTop: 4, textAlign: 'right', opacity: 0.6 }}>
                    {formatarHora(msg.created_at)}
                  </p>

                  {/* Emoji picker */}
                  {emojiMenuId === msg.id && (
                    <div
                      style={{
                        position: 'absolute',
                        [minha ? 'right' : 'left']: 0,
                        top: -44,
                        background: 'var(--panel-strong)',
                        border: '1px solid var(--border)',
                        borderRadius: 999,
                        boxShadow: 'var(--shadow)',
                        padding: '6px 10px',
                        display: 'flex', gap: 4, zIndex: 10,
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      {EMOJIS_REACAO.map(e => (
                        <button
                          key={e}
                          onClick={() => reagir(msg.id, e)}
                          style={{ fontSize: 18, cursor: 'pointer', border: 'none', background: 'none', transition: 'transform 0.1s', padding: 2 }}
                          onMouseOver={el => (el.currentTarget.style.transform = 'scale(1.25)')}
                          onMouseOut={el => (el.currentTarget.style.transform = 'scale(1)')}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reactions */}
                {rsEmoji.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {rsEmoji.map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => reagir(msg.id, emoji)}
                        style={{
                          background: 'var(--panel-strong)',
                          border: '1px solid var(--border)',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: 12,
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {emoji}{count > 1 ? ` ${count}` : ''}
                      </button>
                    ))}
                  </div>
                )}

                {/* Reply button */}
                <button
                  onClick={e => { e.stopPropagation(); setRespondendo(msg); }}
                  style={{
                    fontSize: 12, color: 'var(--muted)', marginTop: 2, padding: '2px 4px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <Icon name="reply" size={12} /> responder
                </button>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {parceiroDigitando && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: 'var(--panel-strong)',
              border: '1px solid var(--border)',
              borderRadius: 18, borderBottomLeftRadius: 4,
              padding: '12px 16px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 16 }}>
                {[0, 150, 300].map(d => (
                  <div
                    key={d}
                    style={{
                      width: 6, height: 6,
                      background: 'var(--muted)',
                      borderRadius: '50%',
                      animation: `typing 1.2s ${d}ms ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '10px 16px 20px',
        background: 'var(--panel)',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {/* Reply preview */}
        {respondendo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--panel-strong)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '8px 12px',
            marginBottom: 8,
          }}>
            <Icon name="reply" size={14} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>Respondendo</p>
              <p style={{ fontSize: 12, color: 'var(--soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {respondendo.conteudo.slice(0, 50)}
              </p>
            </div>
            <button
              onClick={() => setRespondendo(null)}
              style={{ color: 'var(--muted)', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        {gravando ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--panel-strong)',
            border: '2px solid var(--danger)',
            borderRadius: 'var(--radius-pill)',
            padding: '10px 16px',
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--danger)',
              animation: 'heart-beat 1.2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <span style={{ color: 'var(--text)', fontFamily: 'monospace', fontSize: 14, flex: 1 }}>
              {formatarTempo(tempoGravacao)}
            </span>
            <button
              onClick={cancelarGravacao}
              style={{ fontSize: 13, color: 'var(--muted)', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={pararEEnviarAudio}
              disabled={uploadando}
              style={{
                width: 36, height: 36,
                background: 'var(--accent)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0,
                opacity: uploadando ? 0.5 : 1,
              }}
            >
              <Icon name="check" size={18} />
            </button>
          </div>
        ) : (
          <form onSubmit={enviarTexto} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={enviarFoto} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadando}
              className="icon-btn"
              style={{ flexShrink: 0 }}
            >
              {uploadando ? '…' : <Icon name="camera" size={18} />}
            </button>

            <input
              type="text"
              value={novaMensagem}
              onChange={e => { setNovaMensagem(e.target.value); emitirDigitando(); }}
              placeholder="Mensagem..."
              disabled={enviando}
              style={{
                flex: 1, padding: '12px 16px',
                background: 'var(--panel-strong)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                fontSize: 14, color: 'var(--text)',
                outline: 'none', fontFamily: 'inherit',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />

            {novaMensagem.trim() ? (
              <button
                type="submit"
                disabled={enviando}
                style={{
                  width: 44, height: 44,
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0,
                  opacity: enviando ? 0.5 : 1,
                }}
              >
                <Icon name="send" size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={iniciarGravacao}
                style={{
                  width: 44, height: 44,
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <Icon name="mic" size={18} />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
