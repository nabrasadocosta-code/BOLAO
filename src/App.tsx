/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Match, User } from './types';
import Header from './components/Header';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import RankingView from './components/RankingView';
import AdminPanel from './components/AdminPanel';
import InviteTable from './components/InviteTable';
import { Landmark, Trophy, PenTool } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [activeTab, setActiveTab] = useState<'palpites' | 'ranking'>('palpites');
  const [appLoading, setAppLoading] = useState(true);

  // 1. Tenta carregar sessão do localStorage na inicialização
  useEffect(() => {
    const checkSession = async () => {
      const savedUserId = localStorage.getItem("bolao_userId");
      if (savedUserId) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: {
              'Authorization': `Bearer ${savedUserId}`
            }
          });
          const data = await res.json();
          if (res.ok && data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem("bolao_userId");
          }
        } catch (err) {
          console.error("Erro ao verificar sessão:", err);
        }
      }
      setAppLoading(false);
    };

    checkSession();
  }, []);

  // 2. Carrega lista de partidas do servidor
  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      if (res.ok && data.matches) {
        setMatches(data.matches);
        // Se já tiver um match selecionado por ID, mantém. Senão, seleciona o primeiro.
        if (data.matches.length > 0) {
          setSelectedMatch((prev) => {
            if (prev) {
              const updated = data.matches.find((m: Match) => m.id === prev.id);
              return updated || data.matches[0];
            }
            return data.matches[0];
          });
        }
      }
    } catch (err) {
      console.error("Erro ao carregar partidas:", err);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [user]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("bolao_userId");
    setUser(null);
    setIsAdminView(false);
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-[#0c0d0e] flex flex-col items-center justify-center text-zinc-400 font-black uppercase text-xs tracking-widest gap-3" id="app-loading-state">
        <span className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></span>
        <span>Carregando Bolão...</span>
      </div>
    );
  }

  // Se não estiver logado, exibe tela de Login/Cadastro
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0c0d0e] flex flex-col justify-center py-6" id="unauthenticated-app">
        <LoginRegister onLoginSuccess={(u) => setUser(u)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0d0e] flex flex-col text-zinc-100 pb-20 selection:bg-yellow-400 selection:text-black" id="authenticated-app">
      {/* Top Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        isAdminView={isAdminView}
        setIsAdminView={setIsAdminView}
      />

      <main className="flex-1 w-full max-w-lg mx-auto py-2">
        {isAdminView && user.isAdmin ? (
          /* Visualização Admin */
          <AdminPanel
            user={user}
            matches={matches}
            selectedMatch={selectedMatch}
            setSelectedMatch={setSelectedMatch}
            onRefreshMatches={fetchMatches}
          />
        ) : (
          /* Visualização Cliente normal */
          <div className="space-y-4">
            
            {/* Navegação entre abas de Clientes */}
            <div className="px-4 mt-2">
              <div className="flex bg-slate-950 border border-slate-800 p-1.5 rounded-xl shadow-inner">
                <button
                  onClick={() => setActiveTab('palpites')}
                  className={`flex-1 py-3.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    activeTab === 'palpites'
                      ? 'bg-yellow-400 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  id="tab-client-palpites"
                >
                  <PenTool className="w-4 h-4" />
                  Meu Palpite
                </button>
                <button
                  onClick={() => setActiveTab('ranking')}
                  className={`flex-1 py-3.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    activeTab === 'ranking'
                      ? 'bg-yellow-400 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  id="tab-client-ranking"
                >
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Ranking Ao Vivo
                </button>
              </div>
            </div>

            {/* Conteúdo Ativo */}
            {activeTab === 'palpites' ? (
              <Dashboard
                user={user}
                matches={matches}
                selectedMatch={selectedMatch}
                setSelectedMatch={setSelectedMatch}
                onRefreshMatches={fetchMatches}
              />
            ) : (
              <RankingView
                selectedMatch={selectedMatch}
                user={user}
              />
            )}
          </div>
        )}
      </main>

      {/* Rodapé fixo com copyright / crédito do bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-850 py-3.5 px-4 text-center z-40 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
          <span>🍺 Pier do Costa © 2026</span>
          <span className="text-yellow-400">⚽ Futebol & Cerveja Gelada</span>
        </div>
      </footer>
      
      <InviteTable />
    </div>
  );
}
