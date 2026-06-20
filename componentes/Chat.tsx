'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, Mensagem, Reacao } from '@/lib/supabase';

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
      await limparAudiosSeLimiteExcedido();
    } catch {
      alert('Erro ao enviar áudio. Verifique se o bucket "audios" existe no Supabase Storage.');
    }
    setUploadando(false);
    setTempoGravacao(0);
  };

  const limparAudiosSeLimiteExcedido = async () => {
    const LIMITE = 50 * 1024 * 1024;
    const { data: arquivos } = await supabase.storage.from('audios').list('', { limit: 1000, sortBy: { column: 'created_at', order: 'asc' } });
    if (!arquivos?.length) return;
    const total = arquivos.reduce((acc, f) => acc + (f.metadata?.size ?? 0), 0);
    if (total <= LIMITE) return;
    let restante = total;
    const excluir: string[] = [];
    for (const f of arquivos) {
      if (restante <= LIMITE) break;
      excluir.push(f.name);
      restante -= f.metadata?.size ?? 0;
    }
    if (excluir.length) {
      await supabase.storage.from('audios').remove(excluir);
      for (const nome of excluir) await supabase.from('mensagens').delete().like('conteudo', `%${nome}%`);
    }
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
    <div className="flex flex-col h-full" onClick={() => setEmojiMenuId(null)}>
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {loading ? (
          <div className="text-center text-stone-400 pt-10">Carregando... 💭</div>
        ) : mensagens.length === 0 ? (
          <div className="text-center text-stone-400 pt-16">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-medium">Comecem a conversar!</p>
            <p className="text-sm mt-1">Mande mensagem, foto ou áudio 💕</p>
          </div>
        ) : (
          mensagens.map(msg => {
            const minha = msg.enviado_por === userId;
            const respondidaMsg = msgRespondida(msg.respondendo_id);
            const rsEmoji = reacoesPorEmoji(msg.id);

            return (
              <div key={msg.id} className={`flex flex-col ${minha ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm relative ${
                    minha ? 'bg-stone-700 text-white rounded-br-sm' : 'bg-white text-stone-800 border border-stone-100 rounded-bl-sm'
                  }`}
                  onDoubleClick={e => { e.stopPropagation(); setEmojiMenuId(msg.id); }}
                >
                  {!minha && <p className="text-xs font-semibold text-amber-600 mb-1">{msg.nome_remetente}</p>}

                  {respondidaMsg && (
                    <div className={`mb-1.5 px-2 py-1 rounded-lg text-xs border-l-2 ${minha ? 'border-white/40 bg-white/10 text-white/70' : 'border-stone-300 bg-stone-50 text-stone-500'}`}>
                      {respondidaMsg.conteudo.slice(0, 60)}{respondidaMsg.conteudo.length > 60 ? '…' : ''}
                    </div>
                  )}

                  {msg.tipo === 'foto' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.conteudo} alt="foto" className="rounded-xl max-w-full max-h-56 object-cover" />
                  ) : msg.tipo === 'audio' ? (
                    <div className="flex items-center gap-2 py-0.5">
                      <span>🎙️</span>
                      <audio src={msg.conteudo} controls className="h-8 w-32" />
                      {msg.duracao != null && msg.duracao > 0 && (
                        <span className={`text-xs shrink-0 ${minha ? 'text-stone-300' : 'text-stone-400'}`}>
                          {formatarTempo(msg.duracao)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.conteudo}</p>
                  )}

                  <p className={`text-xs mt-1 text-right ${minha ? 'text-stone-300' : 'text-stone-400'}`}>
                    {formatarHora(msg.created_at)}
                  </p>

                  {emojiMenuId === msg.id && (
                    <div
                      className={`absolute ${minha ? 'right-0' : 'left-0'} -top-10 bg-white border border-stone-200 rounded-full shadow-lg px-2 py-1 flex gap-1 z-10`}
                      onClick={e => e.stopPropagation()}
                    >
                      {EMOJIS_REACAO.map(e => (
                        <button key={e} onClick={() => reagir(msg.id, e)} className="text-lg hover:scale-125 transition-transform">
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {rsEmoji.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {rsEmoji.map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => reagir(msg.id, emoji)}
                        className="bg-white border border-stone-200 rounded-full px-1.5 py-0.5 text-xs shadow-sm"
                      >
                        {emoji}{count > 1 ? ` ${count}` : ''}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={e => { e.stopPropagation(); setRespondendo(msg); }}
                  className="text-xs text-stone-400 hover:text-stone-600 mt-0.5 px-1"
                >
                  ↩ responder
                </button>
              </div>
            );
          })
        )}

        {parceiroDigitando && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 shrink-0">
        {respondendo && (
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-1.5 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-500">Respondendo</p>
              <p className="text-xs text-stone-400 truncate">{respondendo.conteudo.slice(0, 50)}</p>
            </div>
            <button onClick={() => setRespondendo(null)} className="text-stone-400 hover:text-stone-600">✕</button>
          </div>
        )}

        {gravando ? (
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 border-2 border-red-300">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-stone-600 font-mono text-sm flex-1">{formatarTempo(tempoGravacao)}</span>
            <button type="button" onClick={cancelarGravacao} className="text-stone-400 hover:text-stone-600 text-sm px-2">Cancelar</button>
            <button type="button" onClick={pararEEnviarAudio} disabled={uploadando}
              className="w-9 h-9 bg-stone-700 rounded-full flex items-center justify-center text-white disabled:opacity-50 shrink-0">
              {uploadando ? '…' : '✓'}
            </button>
          </div>
        ) : (
          <form onSubmit={enviarTexto} className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={enviarFoto} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadando}
              className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center text-lg shadow-sm shrink-0 disabled:opacity-50">
              {uploadando ? '…' : '📷'}
            </button>

            <input
              type="text"
              value={novaMensagem}
              onChange={e => { setNovaMensagem(e.target.value); emitirDigitando(); }}
              placeholder="Mensagem..."
              className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:border-stone-400 text-stone-800 text-sm placeholder-stone-300"
              disabled={enviando}
            />

            {novaMensagem.trim() ? (
              <button type="submit" disabled={enviando}
                className="w-11 h-11 bg-stone-700 hover:bg-stone-800 rounded-full flex items-center justify-center text-white shadow-sm disabled:opacity-50 shrink-0 text-base">
                ➤
              </button>
            ) : (
              <button type="button" onClick={iniciarGravacao}
                className="w-11 h-11 bg-stone-700 hover:bg-stone-800 rounded-full flex items-center justify-center text-lg shadow-sm shrink-0">
                🎙️
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
