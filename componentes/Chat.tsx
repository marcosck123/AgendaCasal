'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { supabase, Mensagem } from '@/lib/supabase';

interface ChatProps {
  userId: string;
  nomeUsuario: string;
}

export default function Chat({ userId, nomeUsuario }: ChatProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [uploadando, setUploadando] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMensagens = useCallback(async () => {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);
    if (!error && data) setMensagens(data as Mensagem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMensagens();
    const channel = supabase
      .channel('chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        setMensagens((prev) => [...prev, payload.new as Mensagem]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMensagens]);

  useEffect(() => { scrollToBottom(); }, [mensagens, scrollToBottom]);

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
    });
    setNovaMensagem('');
    setEnviando(false);
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
      timerRef.current = setInterval(() => setTempoGravacao((t) => t + 1), 1000);
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
      mediaRecorderRef.current!.stream.getTracks().forEach((t) => t.stop());
    });

    setGravando(false);

    try {
      const storageRef = ref(storage, `audios/${userId}/${Date.now()}.webm`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      await supabase.from('mensagens').insert({
        conteudo: url,
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
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    setGravando(false);
    setTempoGravacao(0);
  };

  const formatarTempo = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const formatarHora = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-full">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {loading ? (
          <div className="text-center text-stone-400 pt-10">Carregando... 💭</div>
        ) : mensagens.length === 0 ? (
          <div className="text-center text-stone-400 pt-16">
            <div className="text-5xl mb-3">💬</div>
            <p className="font-medium">Comecem a conversar!</p>
            <p className="text-sm mt-1">Mande uma mensagem ou áudio 💕</p>
          </div>
        ) : (
          mensagens.map((msg) => {
            const minha = msg.enviado_por === userId;
            return (
              <div key={msg.id} className={`flex ${minha ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
                  minha
                    ? 'bg-stone-700 text-white rounded-br-sm'
                    : 'bg-white text-stone-800 border border-stone-100 rounded-bl-sm'
                }`}>
                  {!minha && (
                    <p className="text-xs font-semibold text-amber-600 mb-1">{msg.nome_remetente}</p>
                  )}
                  {msg.tipo === 'audio' ? (
                    <div className="flex items-center gap-2 py-0.5">
                      <span className="text-base">🎙️</span>
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
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 shrink-0">
        {gravando ? (
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2.5 border-2 border-red-300">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-stone-600 font-mono text-sm flex-1">{formatarTempo(tempoGravacao)}</span>
            <button
              type="button"
              onClick={cancelarGravacao}
              className="text-stone-400 hover:text-stone-600 text-sm px-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={pararEEnviarAudio}
              disabled={uploadando}
              className="w-9 h-9 bg-stone-700 rounded-full flex items-center justify-center text-white disabled:opacity-50 shrink-0"
            >
              {uploadando ? '…' : '✓'}
            </button>
          </div>
        ) : (
          <form onSubmit={enviarTexto} className="flex items-center gap-2">
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Mensagem..."
              className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-2xl focus:outline-none focus:border-stone-400 text-stone-800 text-sm placeholder-stone-300"
              disabled={enviando}
            />
            {novaMensagem.trim() ? (
              <button
                type="submit"
                disabled={enviando}
                className="w-11 h-11 bg-stone-700 hover:bg-stone-800 rounded-full flex items-center justify-center text-white shadow-sm disabled:opacity-50 shrink-0 text-base"
              >
                ➤
              </button>
            ) : (
              <button
                type="button"
                onClick={iniciarGravacao}
                className="w-11 h-11 bg-stone-700 hover:bg-stone-800 rounded-full flex items-center justify-center text-lg shadow-sm shrink-0"
              >
                🎙️
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
