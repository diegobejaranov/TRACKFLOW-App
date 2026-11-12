import React, { useState } from 'react';
import Login from './components/Login';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import { LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('trackflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('trackflow_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('trackflow_user');
    setUser(null);
    setSelectedProjectId(null);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-600 text-white font-black text-sm px-2.5 py-1 rounded-lg tracking-wider">
            TF
          </span>
          <span className="font-bold text-white text-base tracking-tight">TrackFlow Studio</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-300">
            Usuario: <strong className="text-white">{user.username}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <main className="py-6">
        {selectedProjectId ? (
          <ProjectDetail
            projectId={selectedProjectId}
            onBack={() => setSelectedProjectId(null)}
            userRole={user.role}
          />
        ) : (
          <ProjectList
            onSelectProject={(id) => setSelectedProjectId(id)}
            userRole={user.role}
          />
        )}
      </main>
    </div>
  );
}