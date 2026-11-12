import React, { useState, useEffect } from 'react';
import { Folder, User, Calendar, ArrowRight, Sparkles, Plus, X, Trash2, CheckCircle2, Clock } from 'lucide-react';

export default function ProjectList({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem('trackflow_user') || '{}');
  const role = savedUser.role; 

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    fetch(`${API_URL}/api/projects/`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    fetch(`${API_URL}/api/projects/create/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, description: newDescription }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchProjects();
          setNewTitle('');
          setNewDescription('');
          setIsModalOpen(false);
        } else {
          alert(data.error || 'Error al crear el proyecto.');
        }
        setIsSubmitting(false);
      });
  };

  const handleDeleteProject = (e, projectId, title) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseas eliminar el proyecto "${title}"?`)) {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

      fetch(`${API_URL}/api/projects/${projectId}/delete/`, { 
        method: 'DELETE',
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setProjects(projects.filter((p) => p.id !== projectId));
          else alert(data.error || 'Error al eliminar el proyecto.');
        });
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Cargando proyectos...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-4">
      <div className="flex justify-between items-end mb-10 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold mb-3">
            <Sparkles size={13} /> PORTAL TRACKFLOW
          </div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Folder className="text-indigo-400" size={32} /> Proyectos Musicales
          </h1>
        </div>

        {role === 'producer' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus size={18} /> Nuevo Proyecto
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">     
        {projects.map((project) => (
          <div
            key={project.id}
            className={`group border rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all ${
              project.is_approved
                ? 'bg-slate-900/90 border-emerald-500/40'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1 pr-6">
                  {project.is_approved ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full w-fit">
                      <CheckCircle2 size={12} /> COMPLETADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full w-fit uppercase tracking-wider">
                      <Clock size={12} /> En Proceso
                    </span>
                  )}

                  <h3 className="text-xl font-bold text-white mt-1">{project.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                
                  {role === 'producer' && (
                    <button
                      onClick={(e) => handleDeleteProject(e, project.id, project.title)}
                      className="p-1.5 bg-slate-950 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 rounded-lg transition-all cursor-pointer"
                      title="Eliminar proyecto"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-6 line-clamp-2">{project.description || 'Sin descripción.'}</p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800 pt-4 mb-5">
                <span className="flex items-center gap-1.5"><User size={14} className="text-indigo-400" /> {project.creator}</span>
                <span className="flex items-center gap-1.5 font-mono text-slate-500"><Calendar size={13} /> {project.created_at}</span>
              </div>

              <button
                onClick={() => onSelectProject(project.id)}
                className={`w-full text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  project.is_approved ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                Abrir Proyecto <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md relative shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            <h3 className="text-xl font-bold text-white mb-1">Crear Nuevo Proyecto</h3>
            <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Título del Proyecto *</label>
                <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ej: Mi primer álbum musical" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Artista / Descripción</label>
                <textarea rows="3" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Nombre del artista o descripción del proyecto..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-800 text-slate-300 py-2.5 cursor-pointer rounded-xl text-sm font-medium">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white py-2.5 cursor-pointer rounded-xl text-sm font-medium">{isSubmitting ? 'Guardando...' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}