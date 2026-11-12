import React, { useEffect, useState } from 'react';
import { Music, Disc, Activity, Key, ChevronLeft, Volume2, Upload, X, Trash2, CheckCircle2, Clock } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

export default function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const savedUser = JSON.parse(localStorage.getItem('trackflow_user') || '{}');
  const role = savedUser.role; 

  const [selectedSongId, setSelectedSongId] = useState('new');
  const [songTitle, setSongTitle] = useState('');
  const [bpm, setBpm] = useState('');
  const [key, setKey] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadProjectDetail();
  }, [projectId]);

  const loadProjectDetail = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    fetch(`${API_URL}/api/projects/${projectId}/`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setProject(data);
        setLoading(false);
        if (data.songs?.length > 0 && data.songs[0].versions?.length > 0) {
          setActiveVersion(data.songs[0].versions[0]);
        }
        if (role !== 'producer' && data.songs?.length > 0) {
          setSelectedSongId(data.songs[0].id);
        }
      });
  };

  const handleStatusChange = (songId, newStatus) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    fetch(`${API_URL}/api/songs/${songId}/status/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) loadProjectDetail();
        else alert(data.error || 'Error al cambiar estado.');
      });
  };

  const handleUploadSong = (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    if (selectedSongId === 'new') {
      formData.append('song_title', songTitle);
    } else {
      formData.append('song_id', selectedSongId);
    }

    formData.append('bpm', bpm);
    formData.append('key', key);
    formData.append('audio_file', file);

    if (savedUser.id) formData.append('author_id', savedUser.id);
    if (savedUser.username) formData.append('author_username', savedUser.username);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

      fetch(`${API_URL}/api/projects/${projectId}/upload-song/`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsModalOpen(false);
          setSongTitle('');
          setBpm('');
          setKey('');
          setFile(null);
          loadProjectDetail();
        } else {
          alert(data.error || 'Error al subir el audio.');
        }
        setIsUploading(false);
      });
  };

  const handleDeleteSong = (songId, title) => {
    if (window.confirm(`¿Deseas eliminar la canción "${title}"?`)) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

      fetch(`${API_URL}/api/songs/${songId}/delete/`, {
        method: 'DELETE',
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) loadProjectDetail();
          else alert(data.error || 'Error al eliminar.');
        });
    }
  };

  const isProjectFullyApproved = project?.songs?.length > 0 && project.songs.every((s) => s.status === 'approved');

  if (loading) return <div className="text-center py-20 text-slate-400">Cargando detalles...</div>;
  if (!project) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 space-y-8">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl cursor-pointer transition-all">
        <ChevronLeft size={16} /> Volver a proyectos
      </button>

      <div className={`border rounded-2xl p-8 shadow-2xl flex flex-wrap justify-between items-center gap-4 ${
        isProjectFullyApproved ? 'bg-linear-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border-emerald-500/40' : 'bg-linear-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-widest">PROYECTO SELECCIONADO</span>
            {isProjectFullyApproved ? (
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-3 py-1 rounded-full border border-emerald-500/40 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} /> PROYECTO 100% COMPLETADO
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 text-[11px] px-3 py-1 rounded-full border border-amber-500/40 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <Clock size={14} /> PROYECTO EN PROCESO
              </span>
            )}
          </div>
          <h2 className="text-3xl font-black text-white">{project.title}</h2>
          <p className="text-slate-400 text-sm mt-2">{project.description || 'Sin descripción.'}</p>
        </div>

        {/* El cliente NO ve el botón de subir audio. El músico sí lo ve para subir nuevas versiones a canciones existentes */}
        {role !== 'client' && (
          <button 
            onClick={() => {
              if (role !== 'producer' && selectedSongId === 'new' && project.songs?.length > 0) {
                setSelectedSongId(project.songs[0].id);
              }
              setIsModalOpen(true);
            }} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Upload size={16} /> Subir Audio (.MP3)
          </button>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Music className="text-indigo-400" size={22} /> Tracklist ({project.songs?.length || 0})
        </h3>

        {project.songs?.map((song) => (
          <div key={song.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-800">
              <div>
                <h4 className="text-xl font-bold text-white flex items-center gap-2.5"><Disc className="text-indigo-400" size={20} />{song.title}</h4>
                <div className="flex gap-4 text-xs font-mono text-slate-400 mt-2">
                  {song.bpm && <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800"><Activity size={13} className="inline text-indigo-400" /> {song.bpm} BPM</span>}
                  {song.key && <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800"><Key size={13} className="inline text-indigo-400" /> Tonalidad: {song.key}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {role === 'producer' ? (
                  <select
                    value={song.status}
                    onChange={(e) => handleStatusChange(song.id, e.target.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer ${
                      song.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-300 border-slate-700'
                    }`}
                  >
                    <option value="composition">Composición</option>
                    <option value="recording">Grabación</option>
                    <option value="editing">Edición</option>
                    <option value="mixing">Mezcla</option>
                    <option value="mastering">Masterización</option>
                    <option value="approved">✓ Terminada</option>
                  </select>
                ) : (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-slate-950 border-slate-800 text-slate-300">
                    {song.status_display}
                  </span>
                )}

                {role === 'producer' && (
                  <button 
                    onClick={() => handleDeleteSong(song.id, song.title)} 
                    className="p-1.5 bg-slate-950 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 rounded-lg cursor-pointer transition-all" 
                    title="Eliminar canción"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-mono font-semibold uppercase">Versiones:</span>
              <div className="flex flex-wrap gap-2.5">
                {song.versions.map((ver) => (
                  <button
                    key={ver.id}
                    onClick={() => setActiveVersion(ver)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-2 border ${
                      activeVersion?.id === ver.id ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    <Volume2 size={14} /> v{ver.version_number} <span className="opacity-60 text-[10px]">({ver.uploaded_by})</span>
                  </button>
                ))}
              </div>
            </div>

            {activeVersion && song.versions.some((v) => v.id === activeVersion.id) && (
              <AudioPlayer key={activeVersion.id} audioUrl={activeVersion.audio_file} versionId={activeVersion.id} comments={activeVersion.comments} />
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            <h3 className="text-xl font-bold text-white mb-1">Subir Versión de Audio (.MP3)</h3>
            
            <form onSubmit={handleUploadSong} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Pertenece a:</label>
                <select 
                  value={selectedSongId} 
                  onChange={(e) => setSelectedSongId(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-indigo-300 cursor-pointer"
                >
                  {/* Solo el productor ve la opción de crear una nueva canción */}
                  {role === 'producer' && <option value="new">+ Crear Nueva Canción</option>}
                  
                  {project.songs?.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title} (v{song.versions.length + 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* El campo del título solo se muestra si seleccionó 'new' y es productor */}
              {selectedSongId === 'new' && role === 'producer' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Título de la Canción *</label>
                  <input type="text" required value={songTitle} onChange={(e) => setSongTitle(e.target.value)} placeholder="Ej: Mi nueva cancion" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">BPM</label>
                  <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="120" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tonalidad</label>
                  <input type="text" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Am" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Archivo MP3 *</label>
                <input type="file" accept="audio/mp3,audio/mpeg" required onChange={(e) => setFile(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white cursor-pointer" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all">Cancelar</button>
                <button type="submit" disabled={isUploading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all shadow-lg shadow-indigo-600/30">{isUploading ? 'Subiendo...' : 'Subir'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}