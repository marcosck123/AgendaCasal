'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMensagens = useCallback(async () => {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      setMensagens(data as Mensagem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMensagens();

    const channel = supabase
      .channel('mensagens-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensagens' },
        (payload) => {
          setMensagens((prev) => [...prev, payload.new as Mensagem]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMensagens]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || enviando) return;

    setEnviando(true);
    const { error } = await supabase.from('mensagens').insert({
      conteudo: novaMensagem.trim(),
      enviado_por: userId,
      nome_remetente: nomeUsuario || 'Você',
      casal_id: userId,
    });

    if (!error) {
      setNovaMensagem('');
    }
    setEnviando(false);
  };

  const formatarHora = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-[500px]">
      <h2 className="text-xl font-bold text-rose-700 mb-4">💬 Nossas Mensagens</h2>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
        {loading ? (
          <div className="text-center py-8 text-rose-400">Carregando mensagens... 💭</div>
        ) : mensagens.length === 0 ? (
          <div className="text-center py-12 text-rose-300">
            <div className="text-4xl mb-3">💬</div>
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm mt-1">Comecem a conversar! 💕</p>
          </div>
        ) : (
          mensagens.map((msg) => {
            const isMinha = msg.enviado_por === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMinha ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMinha
                      ? 'bg-rose-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-rose-100 rounded-bl-sm'
                  }`}
                >
                  {!isMinha && (
                    <p className="text-xs font-semibold text-rose-400 mb-0.5">
                      {msg.nome_remetente}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.conteudo}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMinha ? 'text-rose-200' : 'text-gray-400'
                    } text-right`}
                  >
                    {formatarHora(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={enviarMensagem} className="flex gap-2">
        <input
          type="text"
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder="Escreva uma mensagem... 💌"
          className="flex-1 px-4 py-3 border-2 border-rose-200 rounded-2xl focus:outline-none focus:border-rose-400 text-gray-700 placeholder-rose-300"
          disabled={enviando}
        />
        <button
          type="submit"
          disabled={enviando || !novaMensagem.trim()}
          className="px-5 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold rounded-2xl transition-colors shadow-sm"
        >
          {enviando ? '...' : '❤️'}
        </button>
      </form>
    </div>
  );
}
