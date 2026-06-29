/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Save, 
  HelpCircle, 
  Trophy, 
  Flag, 
  Calendar,
  Sparkles,
  Users,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import { Match, Bet, PointsBreakdown } from '../types';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

interface DashboardProps {
  user: any;
  matches: Match[];
  selectedMatch: Match | null;
  setSelectedMatch: (m: Match) => void;
  onRefreshMatches: () => void;
}

export default function Dashboard({ user, matches, selectedMatch, setSelectedMatch, onRefreshMatches }: DashboardProps) {
  const [bet, setBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [placar1tA, setPlacar1tA] = useState<number>(0);
  const [placar1tB, setPlacar1tB] = useState<number>(0);
  const [placarFinalA, setPlacarFinalA] = useState<number>(0);
  const [placarFinalB, setPlacarFinalB] = useState<number>(0);
  
  // 3 slots para autores dos gols
  const [scorer1, setScorer1] = useState('');
  const [scorer2, setScorer2] = useState('');
  const [scorer3, setScorer3] = useState('');
  
  // 8 slots para goleadores estruturados (nome, gols, seleção)
  const [goleadores, setGoleadores] = useState<{ player: string; goals: number; team: 'A' | 'B' }[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({ player: '', goals: 1, team: i < 4 ? 'A' : 'B' }))
  );
  
  const [craque, setCraque] = useState('');
  const [min1Gol, setMin1Gol] = useState<number>(0);
  
  const [escanteios1t, setEscanteios1t] = useState<number>(0);
  const [escanteios2t, setEscanteios2t] = useState<number>(0);
  
  const [cartoesAmarelos1t, setCartoesAmarelos1t] = useState<number>(0);
  const [cartoesVermelhos1t, setCartoesVermelhos1t] = useState<number>(0);
  const [cartoesAmarelos2t, setCartoesAmarelos2t] = useState<number>(0);
  const [cartoesVermelhos2t, setCartoesVermelhos2t] = useState<number>(0);

  // Carrega palpite do usuário para a partida selecionada
  useEffect(() => {
    if (selectedMatch) {
      fetchMyBet();
    }
  }, [selectedMatch]);

  const fetchMyBet = async () => {
    if (!selectedMatch) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/bets/my/${selectedMatch.id}`, {
        headers: {
          'Authorization': `Bearer ${user.id}`
        }
      });
      const data = await response.json();
      if (response.ok && data.bet) {
        setBet(data.bet);
        // Popula form
        setPlacar1tA(data.bet.placar1tA);
        setPlacar1tB(data.bet.placar1tB);
        setPlacarFinalA(data.bet.placarFinalA);
        setPlacarFinalB(data.bet.placarFinalB);
        setScorer1(data.bet.autoresGols[0] || '');
        setScorer2(data.bet.autoresGols[1] || '');
        setScorer3(data.bet.autoresGols[2] || '');
        
        if (data.bet.goleadores && data.bet.goleadores.length > 0) {
          // Preenche os goleadores salvos. Se forem menos de 8, completa com slots vazios
          const saved = [...data.bet.goleadores];
          while (saved.length < 8) {
            saved.push({ player: '', goals: 1, team: saved.length < 4 ? 'A' : 'B' });
          }
          setGoleadores(saved);
        } else {
          const initialGols = Array.from({ length: 8 }, (_, i) => ({
            player: data.bet.autoresGols[i] || '',
            goals: 1,
            team: i < 4 ? 'A' : 'B' as 'A' | 'B'
          }));
          setGoleadores(initialGols);
        }

        setCraque(data.bet.craque);
        setMin1Gol(data.bet.min1Gol);
        setEscanteios1t(data.bet.escanteios1t);
        setEscanteios2t(data.bet.escanteios2t);
        setCartoesAmarelos1t(data.bet.cartoesAmarelos1t);
        setCartoesVermelhos1t(data.bet.cartoesVermelhos1t);
        setCartoesAmarelos2t(data.bet.cartoesAmarelos2t);
        setCartoesVermelhos2t(data.bet.cartoesVermelhos2t);
      } else {
        setBet(null);
        // Reseta form
        setPlacar1tA(0);
        setPlacar1tB(0);
        setPlacarFinalA(0);
        setPlacarFinalB(0);
        setScorer1('');
        setScorer2('');
        setScorer3('');
        setGoleadores(Array.from({ length: 8 }, (_, i) => ({ player: '', goals: 1, team: i < 4 ? 'A' : 'B' })));
        setCraque('');
        setMin1Gol(0);
        setEscanteios1t(0);
        setEscanteios2t(0);
        setCartoesAmarelos1t(0);
        setCartoesVermelhos1t(0);
        setCartoesAmarelos2t(0);
        setCartoesVermelhos2t(0);
      }
    } catch (error) {
      console.error("Erro ao carregar palpite:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    
    setSaving(true);
    setMessage(null);

    const cleanGoleadores = goleadores.filter(g => g.player.trim().length > 0).map(g => ({
      player: g.player.trim(),
      goals: Number(g.goals) || 1,
      team: g.team
    }));
    const autoresGols = cleanGoleadores.map(g => g.player);

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          placar1tA,
          placar1tB,
          placarFinalA,
          placarFinalB,
          autoresGols,
          goleadores: cleanGoleadores,
          craque,
          min1Gol,
          escanteios1t,
          escanteios2t,
          cartoesAmarelos1t,
          cartoesVermelhos1t,
          cartoesAmarelos2t,
          cartoesVermelhos2t,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar palpite.");
      }

      setBet(data.bet);
      setMessage({ type: 'success', text: "Palpite gravado com sucesso! Lembre-se de confirmar o pagamento de R$10 no caixa." });
      onRefreshMatches();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "Erro de conexão." });
    } finally {
      setSaving(false);
    }
  };

  // Verifica se a partida está bloqueada para novos palpites
  const isLocked = () => {
    if (!selectedMatch) return true;
    if (selectedMatch.status !== 'open') return true;
    
    // Se o cliente já salvou o palpite, bloqueia para edições (Aposta Única)
    if (bet !== null) return true;
    
    const now = new Date();
    const limitDate = new Date(selectedMatch.matchDate);
    return now > limitDate;
  };

  const locked = isLocked();

  // Formata data amigável
  const formatMatchDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) + "h";
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-5" id="client-dashboard">
      
      {/* Seleção de Partida */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <label className="block text-xs font-black uppercase tracking-widest text-yellow-400 mb-2">
          Selecione a Rodada / Jogo:
        </label>
        {matches.length === 0 ? (
          <p className="text-xs font-bold text-zinc-500">Nenhum jogo cadastrado no momento.</p>
        ) : (
          <select
            value={selectedMatch?.id || ''}
            onChange={(e) => {
              const m = matches.find(match => match.id === e.target.value);
              if (m) setSelectedMatch(m);
            }}
            className="w-full bg-slate-950 border border-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl px-3.5 py-3.5 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.teamA} x {m.teamB} ({formatMatchDate(m.matchDate)})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedMatch && (
        <>
          {/* Status do Pagamento & Informação do Jogo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                Início: {formatMatchDate(selectedMatch.matchDate)}
              </span>

              {/* Status do Match Badge */}
              <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                selectedMatch.status === 'open' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : selectedMatch.status === 'in_progress'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}>
                {selectedMatch.status === 'open' ? 'Aberto' : selectedMatch.status === 'in_progress' ? 'Em Andamento' : 'Finalizado'}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Payment Alert Block */}
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 ${
                  bet?.isPaid 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' 
                    : 'bg-yellow-400/10 text-yellow-400 border-yellow-400'
                }`}>
                  {bet?.isPaid ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">
                    Status do Palpite
                  </h4>
                  <p className={`text-[11px] font-bold mt-0.5 uppercase tracking-wide leading-relaxed ${bet?.isPaid ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {bet?.isPaid 
                      ? "✓ PAGO • Confirmado pela equipe do bar. Palpite ATIVO!" 
                      : bet 
                      ? "⚡ AGUARDANDO PAGAMENTO • Pague R$ 10 no caixa para ativar!"
                      : "⚠ NENHUM PALPITE SALVO • Preencha o formulário abaixo."}
                  </p>
                </div>
              </div>

              {/* Match Versus Display */}
              <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 flex items-center justify-between text-center relative overflow-hidden">
                <div className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-xl font-black shadow-lg shadow-emerald-500/20 text-white select-none">
                    ⚽
                  </div>
                  <span className="font-black uppercase text-xs sm:text-sm tracking-wide text-zinc-200">{selectedMatch.teamA}</span>
                </div>
                
                <div className="px-4 shrink-0 flex flex-col justify-center items-center">
                  <div className="text-4xl sm:text-5xl font-black italic text-yellow-400 tracking-tighter">VS</div>
                  {selectedMatch.status === 'finished' && selectedMatch.realResults ? (
                    <div className="text-sm font-black text-emerald-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg mt-1">
                      {selectedMatch.realResults.placarFinalA} — {selectedMatch.realResults.placarFinalB}
                    </div>
                  ) : (
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Em breve</span>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-xl font-black shadow-lg shadow-white/10 text-black select-none">
                    ⚽
                  </div>
                  <span className="font-black uppercase text-xs sm:text-sm tracking-wide text-zinc-200">{selectedMatch.teamB}</span>
                </div>
              </div>

              {/* Se o jogo já acabou, mostra resultado oficial resumido */}
              {selectedMatch.status === 'finished' && selectedMatch.realResults && bet && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <h4 className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    Seu Desempenho
                  </h4>
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-zinc-300">
                    <span>Sua Pontuação Total:</span>
                    <span className="text-sm font-black text-emerald-400">{bet.totalPoints} Pontos</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code de Compartilhamento ("Convide a Mesa") */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-1.5 justify-center">
              <QrCode className="w-4 h-4 text-yellow-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400">
                Convide a Mesa do Bar!
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-relaxed max-w-xs">
              Compartilhe o bolão com os amigos! Aponte a câmera do celular para entrar no jogo.
            </p>
            <div className="bg-white p-3.5 rounded-xl shadow-md border border-slate-200">
              <QRCodeSVG 
                value={window.location.origin}
                size={110}
                level="M"
                includeMargin={false}
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-full max-w-xs py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-zinc-300 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link do Bolão</span>
                </>
              )}
            </button>
          </div>

          {/* Form de Palpites */}
          <form onSubmit={handleSaveBet} className="space-y-4">
            
            {/* CARD 1: PLACARES */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-4 relative">
              <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4" />
                1. Placares do Jogo
              </h3>

              {/* Placar 1º Tempo */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider">
                  Placar do 1º Tempo:
                </label>
                <div className="flex items-center justify-between gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-black text-zinc-300 uppercase truncate max-w-[100px]">{selectedMatch.teamA}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      disabled={locked}
                      value={placar1tA}
                      onChange={(e) => setPlacar1tA(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 h-10 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-white text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                    <span className="text-zinc-500 font-bold">x</span>
                    <input
                      type="number"
                      min="0"
                      disabled={locked}
                      value={placar1tB}
                      onChange={(e) => setPlacar1tB(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 h-10 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-white text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                  </div>
                  <span className="text-xs font-black text-zinc-300 uppercase truncate max-w-[100px] text-right">{selectedMatch.teamB}</span>
                </div>
              </div>

              {/* Placar Final */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider">
                  Placar Final (90 min):
                </label>
                <div className="flex items-center justify-between gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-black text-zinc-300 uppercase truncate max-w-[100px]">{selectedMatch.teamA}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      disabled={locked}
                      value={placarFinalA}
                      onChange={(e) => setPlacarFinalA(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 h-10 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-white text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                    <span className="text-zinc-500 font-bold">x</span>
                    <input
                      type="number"
                      min="0"
                      disabled={locked}
                      value={placarFinalB}
                      onChange={(e) => setPlacarFinalB(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 h-10 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-white text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                  </div>
                  <span className="text-xs font-black text-zinc-300 uppercase truncate max-w-[100px] text-right">{selectedMatch.teamB}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={locked}
                  onClick={handleSaveBet}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all"
                >
                  Inserir Palpite
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={handleSaveBet}
                  className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>

             {/* CARD 2: GOLS E CRAQUE */}
             <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-4">
               <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                 <Users className="w-4 h-4" />
                 2. Autores dos Gols & Craque
               </h3>
 
               {/* Autores dos Gols */}
               <div className="space-y-4">
                 <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                   <div>
                     <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider">
                       Palpites de Goleadores (Até 8)
                     </label>
                     <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">
                       Cada acerto exato (Jogador + Gols) vale 5 pontos!
                     </p>
                   </div>
                 </div>
 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Seleção A */}
                   <div className="space-y-3">
                     <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 text-center">
                       {selectedMatch.teamA} (Time A)
                     </h4>
                     <div className="space-y-2">
                       {goleadores.map((g, idx) => {
                         if (g.team !== 'A') return null;
                         return (
                           <div key={idx} className="bg-slate-950 p-2 rounded-xl border border-slate-800/60 space-y-2">
                             <div className="flex items-center gap-2">
                               <input
                                 type="text"
                                 placeholder="Nome do Jogador"
                                 disabled={locked}
                                 value={g.player}
                                 onChange={(e) => {
                                   const updated = [...goleadores];
                                   updated[idx].player = e.target.value;
                                   setGoleadores(updated);
                                 }}
                                 className="flex-1 min-w-0 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold text-xs focus:ring-1 focus:ring-yellow-400 focus:outline-none placeholder-zinc-600"
                               />
                               <div className="flex items-center gap-1 shrink-0">
                                 <span className="text-[9px] text-zinc-500 font-bold uppercase">Gols:</span>
                                 <input
                                   type="number"
                                   min="1"
                                   max="10"
                                   disabled={locked}
                                   value={g.goals}
                                   onChange={(e) => {
                                     const updated = [...goleadores];
                                     updated[idx].goals = Math.max(1, parseInt(e.target.value) || 1);
                                     setGoleadores(updated);
                                   }}
                                   className="w-10 px-1 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white font-black text-xs text-center focus:ring-1 focus:ring-yellow-400 focus:outline-none"
                                 />
                               </div>
                             </div>
                             
                             <div className="flex gap-1.5">
                               <button
                                 type="button"
                                 disabled={locked}
                                 onClick={handleSaveBet}
                                 className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-[9px] uppercase rounded transition-all"
                               >
                                 Inserir Palpite
                               </button>
                               <button
                                 type="button"
                                 disabled={locked}
                                 onClick={handleSaveBet}
                                 className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-slate-950 font-black text-[9px] uppercase rounded transition-all"
                               >
                                 Salvar
                               </button>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
 
                   {/* Seleção B */}
                   <div className="space-y-3">
                     <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 text-center">
                       {selectedMatch.teamB} (Time B)
                     </h4>
                     <div className="space-y-2">
                       {goleadores.map((g, idx) => {
                         if (g.team !== 'B') return null;
                         return (
                           <div key={idx} className="bg-slate-950 p-2 rounded-xl border border-slate-800/60 space-y-2">
                             <div className="flex items-center gap-2">
                               <input
                                 type="text"
                                 placeholder="Nome do Jogador"
                                 disabled={locked}
                                 value={g.player}
                                 onChange={(e) => {
                                   const updated = [...goleadores];
                                   updated[idx].player = e.target.value;
                                   setGoleadores(updated);
                                 }}
                                 className="flex-1 min-w-0 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold text-xs focus:ring-1 focus:ring-yellow-400 focus:outline-none placeholder-zinc-600"
                               />
                               <div className="flex items-center gap-1 shrink-0">
                                 <span className="text-[9px] text-zinc-500 font-bold uppercase">Gols:</span>
                                 <input
                                   type="number"
                                   min="1"
                                   max="10"
                                   disabled={locked}
                                   value={g.goals}
                                   onChange={(e) => {
                                     const updated = [...goleadores];
                                     updated[idx].goals = Math.max(1, parseInt(e.target.value) || 1);
                                     setGoleadores(updated);
                                   }}
                                   className="w-10 px-1 py-1 bg-slate-900 border border-slate-800 rounded-lg text-white font-black text-xs text-center focus:ring-1 focus:ring-yellow-400 focus:outline-none"
                                 />
                               </div>
                             </div>
 
                             <div className="flex gap-1.5">
                               <button
                                 type="button"
                                 disabled={locked}
                                 onClick={handleSaveBet}
                                 className="flex-1 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-[9px] uppercase rounded transition-all"
                               >
                                 Inserir Palpite
                               </button>
                               <button
                                 type="button"
                                 disabled={locked}
                                 onClick={handleSaveBet}
                                 className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-slate-950 font-black text-[9px] uppercase rounded transition-all"
                               >
                                 Salvar
                               </button>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 </div>
               </div>
 
               {/* Craque do Jogo */}
               <div className="space-y-1.5">
                 <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider">
                   Craque do Jogo (Eleito Oficial):
                 </label>
                 <input
                   type="text"
                   disabled={locked}
                   value={craque}
                   onChange={(e) => setCraque(e.target.value)}
                   placeholder="Ex: Neymar"
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={handleSaveBet}
                    className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all"
                  >
                    Inserir Palpite
                  </button>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={handleSaveBet}
                    className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition-all"
                  >
                    Salvar
                  </button>
                </div>
             </div>

            {/* CARD 3: ESTATÍSTICAS AVANÇADAS */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Flag className="w-4 h-4" />
                3. Estatísticas Avançadas
              </h3>

              {/* Minuto do 1º Gol */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider">
                    Minuto do 1º Gol da Partida:
                  </label>
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">(0 se não tiver gols)</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="95"
                  disabled={locked}
                  value={min1Gol}
                  onChange={(e) => setMin1Gol(Math.max(0, parseInt(e.target.value) || 0))}
                  className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* Escanteios por tempo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                    Escanteios 1º Tempo:
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={locked}
                    value={escanteios1t}
                    onChange={(e) => setEscanteios1t(Math.max(0, parseInt(e.target.value) || 0))}
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                    Escanteios 2º Tempo:
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={locked}
                    value={escanteios2t}
                    onChange={(e) => setEscanteios2t(Math.max(0, parseInt(e.target.value) || 0))}
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Cartões por tempo */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Cartões Previstos (Por Tempo):
                </span>
                
                {/* 1º tempo */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="block text-[9px] font-black text-yellow-400 uppercase tracking-widest">1º Tempo</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black text-yellow-500 uppercase tracking-wider text-center">🟨 Amarelos</span>
                      <input
                        type="number"
                        min="0"
                        disabled={locked}
                        value={cartoesAmarelos1t}
                        onChange={(e) => setCartoesAmarelos1t(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs font-black focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        title="Amarelos"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black text-red-500 uppercase tracking-wider text-center">🟥 Vermelhos</span>
                      <input
                        type="number"
                        min="0"
                        disabled={locked}
                        value={cartoesVermelhos1t}
                        onChange={(e) => setCartoesVermelhos1t(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs font-black focus:outline-none focus:ring-1 focus:ring-red-500"
                        title="Vermelhos"
                      />
                    </div>
                  </div>
                </div>

                {/* 2º tempo */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="block text-[9px] font-black text-yellow-400 uppercase tracking-widest">2º Tempo</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black text-yellow-500 uppercase tracking-wider text-center">🟨 Amarelos</span>
                      <input
                        type="number"
                        min="0"
                        disabled={locked}
                        value={cartoesAmarelos2t}
                        onChange={(e) => setCartoesAmarelos2t(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs font-black focus:outline-none focus:ring-1 focus:ring-yellow-500"
                        title="Amarelos"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[9px] font-black text-red-500 uppercase tracking-wider text-center">🟥 Vermelhos</span>
                      <input
                        type="number"
                        min="0"
                        disabled={locked}
                        value={cartoesVermelhos2t}
                        onChange={(e) => setCartoesVermelhos2t(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full h-8 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs font-black focus:outline-none focus:ring-1 focus:ring-red-500"
                        title="Vermelhos"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={locked}
                  onClick={handleSaveBet}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all"
                >
                  Inserir Palpite
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={handleSaveBet}
                  className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>

            {/* Mensagem de Feedback */}
            {message && (
              <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-start gap-2 ${
                message.type === 'success' 
                  ? 'bg-emerald-950/45 border-emerald-800 text-emerald-300' 
                  : 'bg-red-950/45 border-red-800 text-red-300'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Botão de Envio / Feedback Bloqueado */}
            {locked ? (
              bet !== null ? (
                <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-4 rounded-xl text-center font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Seu palpite está gravado e ativo! Bom jogo!
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 text-zinc-400 p-4 rounded-xl text-center font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  Apostas encerradas para este jogo.
                </div>
              )
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-800 disabled:text-zinc-500 disabled:border-transparent text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl active:scale-95 duration-200 border-b-4 border-yellow-600 active:border-b-0 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Gravar Meu Palpite
                  </>
                )}
              </button>
            )}
          </form>
        </>
      )}
    </div>
  );
}
