/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Match, Bet, MatchResults } from '../types';
import { 
  Users, 
  Calendar, 
  Trophy, 
  CheckSquare, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Activity, 
  RotateCcw, 
  AlertTriangle,
  Settings,
  X,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminPanelProps {
  user: any;
  matches: Match[];
  selectedMatch: Match | null;
  onRefreshMatches: () => void;
  setSelectedMatch: (m: Match) => void;
}

export default function AdminPanel({ user, matches, selectedMatch, onRefreshMatches, setSelectedMatch }: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<'payments' | 'matches' | 'results'>('payments');
  
  // States para pagamentos
  const [bets, setBets] = useState<Bet[]>([]);
  const [paymentFilter, setPaymentFilter] = useState('');
  
  // States para partidas
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchStatus, setMatchStatus] = useState<'open' | 'in_progress' | 'finished'>('open');

  // States para resultados oficiais
  const [placar1tA, setPlacar1tA] = useState<number>(0);
  const [placar1tB, setPlacar1tB] = useState<number>(0);
  const [placarFinalA, setPlacarFinalA] = useState<number>(0);
  const [placarFinalB, setPlacarFinalB] = useState<number>(0);
  
  // Marcadores do Jogo
  const [scorersAInput, setScorersAInput] = useState('');
  const [scorersBInput, setScorersBInput] = useState('');
  const [craque, setCraque] = useState('');
  const [min1Gol, setMin1Gol] = useState<number>(0);
  const [escanteios1t, setEscanteios1t] = useState<number>(0);
  const [escanteios2t, setEscanteios2t] = useState<number>(0);
  const [cartoesAmarelos1t, setCartoesAmarelos1t] = useState<number>(0);
  const [cartoesVermelhos1t, setCartoesVermelhos1t] = useState<number>(0);
  const [cartoesAmarelos2t, setCartoesAmarelos2t] = useState<number>(0);
  const [cartoesVermelhos2t, setCartoesVermelhos2t] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchBets();
  }, [selectedMatch]);

  const fetchBets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bets/all', {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setBets(data.bets);
      }
    } catch (err) {
      console.error("Erro ao carregar palpites para admin:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carrega resultados atuais para edição se houver
  useEffect(() => {
    if (selectedMatch) {
      if (selectedMatch.realResults) {
        const rr = selectedMatch.realResults;
        setPlacar1tA(rr.placar1tA);
        setPlacar1tB(rr.placar1tB);
        setPlacarFinalA(rr.placarFinalA);
        setPlacarFinalB(rr.placarFinalB);
        setScorersAInput(rr.autoresGolsA.join(', '));
        setScorersBInput(rr.autoresGolsB.join(', '));
        setCraque(rr.craque);
        setMin1Gol(rr.min1Gol);
        setEscanteios1t(rr.escanteios1t);
        setEscanteios2t(rr.escanteios2t);
        setCartoesAmarelos1t(rr.cartoesAmarelos1t);
        setCartoesVermelhos1t(rr.cartoesVermelhos1t);
        setCartoesAmarelos2t(rr.cartoesAmarelos2t);
        setCartoesVermelhos2t(rr.cartoesVermelhos2t);
      } else {
        // Reseta form de resultados
        setPlacar1tA(0);
        setPlacar1tB(0);
        setPlacarFinalA(0);
        setPlacarFinalB(0);
        setScorersAInput('');
        setScorersBInput('');
        setCraque('');
        setMin1Gol(0);
        setEscanteios1t(0);
        setEscanteios2t(0);
        setCartoesAmarelos1t(0);
        setCartoesVermelhos1t(0);
        setCartoesAmarelos2t(0);
        setCartoesVermelhos2t(0);
      }
    }
  }, [selectedMatch]);

  // Altera status de pagamento
  const handleTogglePayment = async (betId: string, currentPaidStatus: boolean) => {
    setActionMessage(null);
    try {
      const response = await fetch(`/api/bets/${betId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({ isPaid: !currentPaidStatus })
      });
      const data = await response.json();
      if (response.ok) {
        setBets(bets.map(b => b.id === betId ? { ...b, isPaid: !currentPaidStatus } : b));
        setActionMessage({ type: 'success', text: "Pagamento atualizado com sucesso!" });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || "Erro ao salvar pagamento." });
    }
  };

  // Criar ou Salvar Partida
  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          id: editingMatchId || undefined,
          teamA,
          teamB,
          matchDate: new Date(matchDate).toISOString(),
          status: editingMatchId ? matchStatus : 'open'
        })
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage({ 
          type: 'success', 
          text: editingMatchId ? "Partida atualizada com sucesso!" : "Nova partida criada com sucesso!" 
        });
        
        // Limpa form de partida
        setEditingMatchId(null);
        setTeamA('');
        setTeamB('');
        setMatchDate('');
        
        onRefreshMatches();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || "Erro ao salvar partida." });
    }
  };

  // Inicia edição de partida
  const handleStartEditMatch = (m: Match) => {
    setEditingMatchId(m.id);
    setTeamA(m.teamA);
    setTeamB(m.teamB);
    
    // Converte data ISO para local datetime-local input string
    try {
      const d = new Date(m.matchDate);
      const tzoffset = d.getTimezoneOffset() * 60000; // offset em milissegundos
      const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
      setMatchDate(localISOTime);
    } catch {
      setMatchDate('');
    }
    setMatchStatus(m.status);
    setAdminTab('matches');
  };

  // Deleta partida
  const handleDeleteMatch = async (id: string) => {
    if (!window.confirm("Atenção: Deletar esta partida removerá definitivamente todos os palpites associados! Deseja continuar?")) {
      return;
    }
    setActionMessage(null);
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: "Partida e palpites deletados!" });
        onRefreshMatches();
      } else {
        const d = await res.json();
        throw new Error(d.error);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || "Erro ao deletar partida." });
    }
  };

  // Submete resultados oficiais e roda recálculo de pontos
  const handleSubmitResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    
    setActionMessage(null);

    const realResults: MatchResults = {
      placar1tA,
      placar1tB,
      placarFinalA,
      placarFinalB,
      autoresGolsA: scorersAInput.split(',').map(s => s.trim()).filter(Boolean),
      autoresGolsB: scorersBInput.split(',').map(s => s.trim()).filter(Boolean),
      craque: craque.trim(),
      min1Gol,
      escanteios1t,
      escanteios2t,
      cartoesAmarelos1t,
      cartoesVermelhos1t,
      cartoesAmarelos2t,
      cartoesVermelhos2t,
    };

    try {
      const response = await fetch(`/api/matches/${selectedMatch.id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({ realResults })
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage({ type: 'success', text: "Resultados oficiais gravados! Pontuações e ranking foram calculados." });
        onRefreshMatches();
        fetchBets();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || "Erro ao calcular pontuações." });
    }
  };

  // Reseta resultados oficiais
  const handleResetResults = async () => {
    if (!selectedMatch) return;
    if (!window.confirm("Isto apagará os resultados oficiais e zerará a pontuação de todos para este jogo. Deseja reabrir os palpites?")) {
      return;
    }

    setActionMessage(null);
    try {
      const response = await fetch(`/api/matches/${selectedMatch.id}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({ status: 'open' })
      });
      const data = await response.json();
      if (response.ok) {
        setActionMessage({ type: 'success', text: "Partida resetada! Todos os palpites foram reabertos e zerados." });
        onRefreshMatches();
        fetchBets();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || "Erro ao resetar partida." });
    }
  };

  // Filtra palpites por nome ou telefone
  const filteredBets = bets.filter(b => {
    if (b.matchId !== selectedMatch?.id) return false;
    const q = paymentFilter.toLowerCase();
    return b.userName.toLowerCase().includes(q) || b.userId.includes(q);
  });

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-5" id="admin-panel">
      {/* Header Admin */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-yellow-400">
            👑 Painel do Admin
          </h2>
          <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider block mt-0.5">
            Controle de rodadas, pagamentos e súmulas
          </span>
        </div>
        <Settings className="w-5 h-5 text-zinc-500 animate-spin-slow" />
      </div>

      {/* Subtabs Admin */}
      <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl">
        <button
          onClick={() => setAdminTab('payments')}
          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
            adminTab === 'payments' ? 'bg-yellow-400 text-black shadow-md' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Pagamentos
        </button>
        <button
          onClick={() => setAdminTab('matches')}
          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
            adminTab === 'matches' ? 'bg-yellow-400 text-black shadow-md' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Partidas
        </button>
        <button
          onClick={() => setAdminTab('results')}
          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
            adminTab === 'results' ? 'bg-yellow-400 text-black shadow-md' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Súmula Real
        </button>
      </div>

      {/* Mensagem Geral de Feedback */}
      {actionMessage && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-950/55 border-emerald-800 text-emerald-300' 
            : 'bg-red-950/55 border-red-800 text-red-300'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* TAB 1: GERENCIAR PAGAMENTOS */}
      {adminTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Conferência de Pix / Caixa
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1.5">
              Confirme o Pix ou dinheiro de R$ 10,00 e marque o participante como [Pago] para liberar sua entrada no ranking.
            </p>
          </div>

          {/* Selecionar Jogo para conferir pagamentos */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-zinc-450 uppercase tracking-widest">Filtrar por Partida:</label>
            <select
              value={selectedMatch?.id || ''}
              onChange={(e) => {
                const m = matches.find(match => match.id === e.target.value);
                if (m) setSelectedMatch(m);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-white font-black uppercase tracking-wider text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>{m.teamA} x {m.teamB}</option>
              ))}
            </select>
          </div>

          {/* Input de Busca */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar participante por nome..."
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white placeholder-zinc-600 font-bold uppercase tracking-wider text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <Search className="w-3.5 h-3.5 text-zinc-550 absolute left-3 top-3.5" />
          </div>

          {/* Lista de Palpites */}
          <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto pr-1">
            {filteredBets.length === 0 ? (
              <p className="text-center py-6 text-xs font-black text-zinc-500 uppercase tracking-widest">
                Nenhum palpite para este filtro.
              </p>
            ) : (
              filteredBets.map((bet) => (
                <div key={bet.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-white uppercase block">{bet.userName}</span>
                    <span className="text-[9px] font-bold text-zinc-500 font-mono block">
                      ID: {bet.userId.split('-')[1] || bet.userId}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Checkbox PAGO */}
                    <button
                      onClick={() => handleTogglePayment(bet.id, bet.isPaid)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                        bet.isPaid 
                          ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-950 border-slate-800 text-zinc-400 hover:bg-slate-850'
                      }`}
                      id={`pay-btn-${bet.id}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        bet.isPaid ? 'bg-emerald-600 border-emerald-500' : 'border-slate-700'
                      }`}>
                        {bet.isPaid && <span className="text-white text-[9px]">✓</span>}
                      </div>
                      {bet.isPaid ? 'Pago' : 'Não Pago'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GERENCIAR PARTIDAS (CRIAR E MUDAR SELEÇÕES) */}
      {adminTab === 'matches' && (
        <div className="space-y-4">
          {/* Formulário para Nova Partida / Edição */}
          <form onSubmit={handleSaveMatch} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3.5">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" />
                {editingMatchId ? "Editar Partida" : "Criar Nova Rodada"}
              </h3>
              {editingMatchId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingMatchId(null);
                    setTeamA('');
                    setTeamB('');
                    setMatchDate('');
                  }}
                  className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-zinc-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">Seleção / Time A:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Brasil"
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">Seleção / Time B:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Japão"
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">Limite para Palpites (Início do Jogo):</label>
              <input
                type="datetime-local"
                required
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            {editingMatchId && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">Status da Partida:</label>
                <select
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-black uppercase text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  <option value="open">Palpites Abertos</option>
                  <option value="in_progress">Em Andamento (Bloquear Palpites)</option>
                  <option value="finished">Finalizado</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-xl border-b-4 border-yellow-600 active:border-b-0 flex items-center justify-center gap-1.5"
            >
              {editingMatchId ? "Salvar Alterações" : "Criar Nova Partida"}
            </button>
          </form>

          {/* Lista de Partidas Atuais */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-slate-800 pb-2">
              Jogos Cadastrados
            </h3>
            <div className="space-y-2">
              {matches.map((m) => (
                <div key={m.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-white uppercase">{m.teamA} x {m.teamB}</span>
                    <span className="text-[10px] text-zinc-450 font-semibold uppercase tracking-wider block mt-1">
                      📅 {new Date(m.matchDate).toLocaleDateString('pt-BR')} | Status: <strong className="text-yellow-400 font-black uppercase">{m.status}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEditMatch(m)}
                      className="p-1.5 bg-slate-900 text-zinc-350 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800 transition"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMatch(m.id)}
                      className="p-1.5 bg-slate-900 text-red-400 hover:text-red-300 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
                      title="Deletar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FORMULÁRIO MESTRE DE RESULTADOS OFICIAIS */}
      {adminTab === 'results' && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Súmula Oficial
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1.5">
                Preencha os resultados reais oficiais do jogo para calcular a pontuação de todos automaticamente.
              </p>
            </div>
            {selectedMatch?.realResults && (
              <button
                type="button"
                onClick={handleResetResults}
                className="px-2.5 py-1 bg-red-950/40 hover:bg-red-950 border border-red-900/60 text-red-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1"
                title="Limpar Súmula Oficial"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resetar
              </button>
            )}
          </div>

          {selectedMatch ? (
            <form onSubmit={handleSubmitResults} className="space-y-4">
              {/* Placar Final */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                <span className="block text-[10px] font-black text-yellow-400 uppercase tracking-widest">Placares da Partida</span>
                
                {/* 1º Tempo */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-900 pb-2">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">1º Tempo:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-white shrink-0 truncate max-w-[50px] uppercase">{selectedMatch.teamA}</span>
                    <input
                      type="number"
                      min="0"
                      value={placar1tA}
                      onChange={(e) => setPlacar1tA(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-10 h-8 bg-slate-900 border border-slate-700 rounded text-center text-xs text-white font-black"
                    />
                    <span className="text-zinc-650 font-bold">x</span>
                    <input
                      type="number"
                      min="0"
                      value={placar1tB}
                      onChange={(e) => setPlacar1tB(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-10 h-8 bg-slate-900 border border-slate-700 rounded text-center text-xs text-white font-black"
                    />
                    <span className="text-[10px] font-black text-white shrink-0 truncate max-w-[50px] uppercase">{selectedMatch.teamB}</span>
                  </div>
                </div>

                {/* Placar Final */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Placar Final (90min):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-white shrink-0 truncate max-w-[50px] uppercase">{selectedMatch.teamA}</span>
                    <input
                      type="number"
                      min="0"
                      value={placarFinalA}
                      onChange={(e) => setPlacarFinalA(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-10 h-8 bg-slate-900 border border-slate-700 rounded text-center text-xs text-white font-black"
                    />
                    <span className="text-zinc-650 font-bold">x</span>
                    <input
                      type="number"
                      min="0"
                      value={placarFinalB}
                      onChange={(e) => setPlacarFinalB(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-10 h-8 bg-slate-900 border border-slate-700 rounded text-center text-xs text-white font-black"
                    />
                    <span className="text-[10px] font-black text-white shrink-0 truncate max-w-[50px] uppercase">{selectedMatch.teamB}</span>
                  </div>
                </div>
              </div>

              {/* Autores dos Gols */}
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">Gols do {selectedMatch.teamA} (Separar por vírgula):</label>
                  <input
                    type="text"
                    value={scorersAInput}
                    onChange={(e) => setScorersAInput(e.target.value)}
                    placeholder="Ex: Neymar, Vinicius Jr"
                    className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">Gols do {selectedMatch.teamB} (Separar por vírgula):</label>
                  <input
                    type="text"
                    value={scorersBInput}
                    onChange={(e) => setScorersBInput(e.target.value)}
                    placeholder="Ex: Mitoma"
                    className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Craque e Primeiro Gol */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">Craque da Partida:</label>
                  <input
                    type="text"
                    value={craque}
                    onChange={(e) => setCraque(e.target.value)}
                    placeholder="Ex: Neymar"
                    className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">Minuto 1º Gol (0 se sem gols):</label>
                  <input
                    type="number"
                    value={min1Gol}
                    onChange={(e) => setMin1Gol(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Escanteios */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest">Escanteios 1º Tempo:</label>
                  <input
                    type="number"
                    min="0"
                    value={escanteios1t}
                    onChange={(e) => setEscanteios1t(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-black text-xs rounded px-2.5 py-1.5 text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest">Escanteios 2º Tempo:</label>
                  <input
                    type="number"
                    min="0"
                    value={escanteios2t}
                    onChange={(e) => setEscanteios2t(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-black text-xs rounded px-2.5 py-1.5 text-center"
                  />
                </div>
              </div>

              {/* Cartões Oficiais */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                <span className="block text-[10px] font-black text-yellow-400 uppercase tracking-widest border-b border-slate-800 pb-1">Cartões Súmula Real</span>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* 1T */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-black text-zinc-300 uppercase tracking-wider text-center bg-slate-900 py-1 rounded">1º Tempo</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="block text-[8px] font-bold text-yellow-500 text-center uppercase">🟨 Amarelos</span>
                        <input
                          type="number"
                          placeholder="Amarelos"
                          value={cartoesAmarelos1t}
                          onChange={(e) => setCartoesAmarelos1t(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full h-8 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs font-black focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[8px] font-bold text-red-500 text-center uppercase">🟥 Vermelhos</span>
                        <input
                          type="number"
                          placeholder="Vermelhos"
                          value={cartoesVermelhos1t}
                          onChange={(e) => setCartoesVermelhos1t(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full h-8 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs font-black focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2T */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-black text-zinc-300 uppercase tracking-wider text-center bg-slate-900 py-1 rounded">2º Tempo</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="block text-[8px] font-bold text-yellow-500 text-center uppercase">🟨 Amarelos</span>
                        <input
                          type="number"
                          placeholder="Amarelos"
                          value={cartoesAmarelos2t}
                          onChange={(e) => setCartoesAmarelos2t(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full h-8 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs font-black focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[8px] font-bold text-red-500 text-center uppercase">🟥 Vermelhos</span>
                        <input
                          type="number"
                          placeholder="Vermelhos"
                          value={cartoesVermelhos2t}
                          onChange={(e) => setCartoesVermelhos2t(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full h-8 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs font-black focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-xl border-b-4 border-yellow-600 active:border-b-0 flex items-center justify-center gap-1.5"
              >
                <Activity className="w-4 h-4" />
                Salvar Súmula e Rodar Cálculos!
              </button>
            </form>
          ) : (
            <p className="text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">Nenhum jogo selecionado para súmula.</p>
          )}
        </div>
      )}
    </div>
  );
}
