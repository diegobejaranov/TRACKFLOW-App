import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, MessageSquare, Send, CheckCircle2, Clock, Sparkles, Volume2 } from 'lucide-react';

export default function AudioPlayer({ audioUrl, versionId, comments: initialComments }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comments, setComments] = useState(initialComments || []);
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('trackflow_user') || '{}');

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    const fullUrl = audioUrl.startsWith('http') ? audioUrl : `http://127.0.0.1:8000${audioUrl}`;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4338ca',
      progressColor: '#818cf8',
      cursorColor: '#f43f5e',
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 4,
      responsive: true,
      height: 100,
      url: fullUrl,
    });

    ws.on('ready', () => {
      setDuration(ws.getDuration());
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('interaction', (newTime) => {
      setCurrentTime(newTime);
      setSelectedTimestamp(newTime);
    });

    ws.on('finish', () => {
      setIsPlaying(false);
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying(wavesurferRef.current.isPlaying());
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const timeToAttach = selectedTimestamp !== null ? selectedTimestamp : currentTime;

    fetch(`http://127.0.0.1:8000/api/audio-versions/${versionId}/comment/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        timestamp_seconds: timeToAttach,
        text: newCommentText,
        author_id: currentUser.id,             // <--- Se envía el ID del usuario actual
        author_username: currentUser.username, // <--- Se envía el Username del usuario actual
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setComments((prev) => [
            ...prev,
            {
              id: data.comment.id,
              author: data.comment.author,
              timestamp_seconds: data.comment.timestamp_seconds,
              text: data.comment.text,
              is_resolved: false,
              created_at: data.comment.created_at,
            },
          ]);
          setNewCommentText('');
        } else {
          alert(data.error || 'Error al publicar el comentario.');
        }
      })
      .catch((err) => console.error('Error al guardar comentario:', err));
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const seekToTimestamp = (seconds) => {
    if (wavesurferRef.current && duration > 0) {
      wavesurferRef.current.seekTo(seconds / duration);
      setCurrentTime(seconds);
    }
  };

  return (
    <div className="mt-6 bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
      {/* Visualizador de Waveform */}
      <div className="relative mb-6 bg-slate-950/80 p-5 rounded-xl border border-slate-800 shadow-inner group">
        <div className="absolute top-3 right-4 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Volume2 size={14} className="text-indigo-400 animate-pulse" />
          <span>WAVEFORM PREVIEW</span>
        </div>
        <div ref={containerRef} className="pt-4" />
        <div className="flex justify-between text-xs text-indigo-300/80 mt-3 font-mono font-medium tracking-wider">
          <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">{formatTime(currentTime)}</span>
          <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles y marcador */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="group relative flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </button>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Estado</span>
            <span className="text-sm font-medium text-white flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              {isPlaying ? 'Reproduciendo...' : 'Pausado'}
            </span>
          </div>
        </div>

        <div>
          {selectedTimestamp !== null ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-300 rounded-full text-xs font-medium border border-rose-500/30 backdrop-blur">
              <Clock size={14} className="text-rose-400" /> Marcador fijado en: <strong className="font-mono text-rose-200">{formatTime(selectedTimestamp)}</strong>
            </span>
          ) : (
            <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50">
              <Sparkles size={13} className="text-indigo-400" /> Haz clic en la onda para fijar un timestamp exacto
            </span>
          )}
        </div>
      </div>

      {/* Formulario de comentarios */}
      <form onSubmit={handleAddComment} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={`Agregar comentario en ${formatTime(selectedTimestamp !== null ? selectedTimestamp : currentTime)}... (Ej: "Bajar volumen de voces")`}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 active:scale-95"
        >
          <Send size={16} /> Comentar
        </button>
      </form>

      {/* Lista de comentarios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-400" />
            Feedback de Producción
          </h4>
          <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono border border-slate-700">
            {`${comments.length} mensajes`}
          </span>
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-8 bg-slate-950/40 border border-dashed border-slate-800/80 rounded-xl">
            <p className="text-xs text-slate-500">Sin comentarios aún. Sé el primero en dejar feedback técnico.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="group flex items-start justify-between bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/30 p-3.5 rounded-xl transition-all duration-200 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => seekToTimestamp(comment.timestamp_seconds)}
                    className="font-mono text-xs font-semibold bg-indigo-500/10 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-1 shadow-sm"
                  >
                    <Clock size={12} /> {formatTime(comment.timestamp_seconds)}
                  </button>
                  <div>
                    <p className="text-sm text-slate-200 font-normal leading-relaxed">{comment.text}</p>
                    <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                      {comment.author} • {comment.created_at}
                    </span>
                  </div>
                </div>

                {comment.is_resolved && (
                  <span className="text-emerald-400 flex items-center gap-1 text-xs bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                    <CheckCircle2 size={13} /> Resuelto
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}