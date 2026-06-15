'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { supabase, Audio } from '@/lib/supabase';

interface AudioRecorderProps {
  userId: string;
}

export default function AudioRecorder({ userId }: AudioRecorderProps) {
  const [gravando, setGravando] = useState(false);
  const [audios, setAudios] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [erro, setErro] = useState('');
  const [tituloNovo, setTituloNovo] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAudios = useCallback(async () => {
    const { data, error } = await supabase
      .from('audios')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAudios(data as Audio[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAudios();
  }, [fetchAudios]);

  const iniciarGravacao = async () => {
    setErro('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setGravando(true);
      setTempo(0);
      timerRef.current = setInterval(() => {
        setTempo((t) => t + 1);
      }, 1000);
    } catch (err) {
      setErro('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const pararGravacao = () => {
    return new Promise<Blob>((resolve) => {
      if (!mediaRecorderRef.current) return;

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());

      if (timerRef.current) clearInterval(timerRef.current);
      setGravando(false);
    });
  };

  const salvarAudio = async () => {
    setEnviando(true);
    setErro('');

    try {
      const blob = await pararGravacao();
      const nomeArquivo = `audios/${userId}/${Date.now()}.webm`;
      const storageRef = ref(storage, nomeArquivo);

      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      const titulo = tituloNovo.trim() || `Áudio ${new Date().toLocaleDateString('pt-BR')}`;

      const { error } = await supabase.from('audios').insert({
        titulo,
        url,
        gravado_por: userId,
        casal_id: userId,
        duracao: tempo,
      });

      if (error) {
        setErro(error.message);
      } else {
        setTituloNovo('');
        fetchAudios();
      }
    } catch (err) {
      setErro('Erro ao salvar o áudio. Tente novamente.');
    }

    setEnviando(false);
    setTempo(0);
  };

  const cancelarGravacao = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setGravando(false);
    setTempo(0);
  };

  const deletarAudio = async (id: string) => {
    const { error } = await supabase.from('audios').delete().eq('id', id);
    if (!error) {
      setAudios((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const formatarTempo = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-rose-700">🎙️ Nossos Áudios</h2>

      {/* Gravador */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-5">
        {!gravando ? (
          <div className="space-y-3">
            <input
              type="text"
              value={tituloNovo}
              onChange={(e) => setTituloNovo(e.target.value)}
              placeholder="Nome do áudio (opcional)"
              className="w-full px-4 py-2 border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-400 text-gray-700 bg-white"
            />
            <button
              onClick={iniciarGravacao}
              disabled={enviando}
              className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg"
            >
              <span className="text-2xl">🎙️</span>
              Iniciar gravação
            </button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-2xl font-mono font-bold text-rose-700">
                {formatarTempo(tempo)}
              </span>
            </div>
            <p className="text-rose-500 text-sm">Gravando... fale com carinho! 💕</p>
            <div className="flex gap-3">
              <button
                onClick={cancelarGravacao}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                ✕ Cancelar
              </button>
              <button
                onClick={salvarAudio}
                disabled={enviando}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl transition-colors shadow-md"
              >
                {enviando ? 'Salvando...' : '✓ Salvar áudio'}
              </button>
            </div>
          </div>
        )}

        {erro && (
          <p className="text-red-500 text-sm mt-3 text-center">⚠️ {erro}</p>
        )}
      </div>

      {/* Lista de áudios */}
      {loading ? (
        <div className="text-center py-8 text-rose-400">Carregando áudios... 🎵</div>
      ) : audios.length === 0 ? (
        <div className="text-center py-10 text-rose-300">
          <div className="text-4xl mb-3">🎵</div>
          <p>Nenhum áudio ainda</p>
          <p className="text-sm mt-1">Grave uma mensagem especial!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {audios.map((audio) => (
            <div
              key={audio.id}
              className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{audio.titulo}</p>
                  <p className="text-xs text-rose-400">
                    {new Date(audio.created_at).toLocaleDateString('pt-BR')}
                    {audio.duracao > 0 && ` • ${formatarTempo(audio.duracao)}`}
                  </p>
                </div>
                <button
                  onClick={() => deletarAudio(audio.id)}
                  className="text-rose-300 hover:text-rose-500 transition-colors"
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
              <audio
                src={audio.url}
                controls
                className="w-full h-10 accent-rose-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
