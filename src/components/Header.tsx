/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogOut, User as UserIcon, ShieldAlert, Award } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  isAdminView: boolean;
  setIsAdminView: (v: boolean) => void;
}

export default function Header({ user, onLogout, isAdminView, setIsAdminView }: HeaderProps) {
  return (
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shadow-lg sticky top-0 z-50 px-4 py-3" id="app-header">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo/Branding */}
        <div className="flex items-center gap-2">
          <div className="bg-yellow-400 text-black font-black px-2 py-0.5 text-xs sm:text-sm skew-x-[-12deg] tracking-wider select-none">
            PIER
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black uppercase tracking-tighter italic text-white leading-none">
              Bolão do Costa
            </h1>
            <span className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase leading-none block mt-1">
              ⚽ FUTEBOL & CERVEJA
            </span>
          </div>
        </div>

        {/* User Actions */}
        {user && (
          <div className="flex items-center gap-2">
            {user.isAdmin && (
              <button
                onClick={() => setIsAdminView(!isAdminView)}
                className={`p-1.5 rounded-lg border text-xs font-extrabold transition-all duration-300 flex items-center gap-1.5 ${
                  isAdminView
                    ? 'bg-amber-500 border-amber-400 text-zinc-950 shadow-md shadow-amber-500/10'
                    : 'bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700'
                }`}
                title={isAdminView ? "Ir para Área de Jogador" : "Painel Administrador"}
                id="btn-admin-toggle"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">{isAdminView ? "Palpitar" : "Painel"}</span>
              </button>
            )}

            <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-200 max-w-[80px] truncate">
                {user.name.split(' ')[0]}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-all"
              title="Sair"
              id="btn-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
