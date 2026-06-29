/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Match, RankingEntry, Bet } from '../types';
import { Trophy, HelpCircle, Users, Coins, ChevronDown, ChevronUp, Flag, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Confetti from './Confetti';

interface RankingViewProps {
  selectedMatch: Match | null;
  user: any;
}

export default function RankingView({ selectedMatch, user }: RankingViewProps) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [paidCount, setPaidCount] = useState(0);
  const [totalCollection, setTotalCollection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  
  // Todos os palpites para poder revelar os palpites dos outros usuários
  const [allBets, setAllBets] = useState<Bet[]>([]);

  useEffect(() => {
    if (selectedMatch) {
      fetchRankingAndBets();
    }
  }, [selectedMatch]);

  const fetchRankingAndBets = async () => {
    if (!selectedMatch) return;
    setLoading(true);
    try {
      // Carrega ranking
      const rRes = await fetch(`/api/ranking/${selectedMatch.id}`);
      const rData = await rRes.json();
      if (rRes.ok) {
        setRanking(rData.ranking);
        setPaidCount(rData.paidCount);
        setTotalCollection(rData.totalCollection);
      }

      // Se o jogo não estiver aberto (in_progress ou finished),
      // ou se o usuário for Admin, podemos buscar todos os palpites
      // para mostrar a transparência. Se o jogo ainda estiver 'open',
      // os palpites são confidenciais para ninguém copiar!
      // Vamos carregar os palpites da partida se o status !== 'open' ou se for admin
      if (selectedMatch.status !== 'open' || user?.isAdmin) {
        // Usamos uma chamada para obter palpites
        // Para simplificar, o admin pode acessar todos, e para clientes nós
        // enviamos os palpites calculados e de transparência
        const bRes = await fetch(`/api/bets/all`, {
          headers: {
            'Authorization': `Bearer ${user?.id}`
          }
        });
        const bData = await bRes.json();
        if (bRes.ok && bData.bets) {
          setAllBets(bData.bets.filter((b: Bet) => b.matchId === selectedMatch.id));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandUser = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
    }
  };

  // Formata moeda
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Posição visual Badge
  const getPositionBadge = (pos: number) => {
    switch (pos) {
      case 1:
        return <span className="w-7 h-7 bg-yellow-400 text-zinc-950 font-black italic text-xs flex items-center justify-center border border-yellow-300 shadow-md">01</span>;
      case 2:
        return <span className="w-7 h-7 bg-zinc-300 text-zinc-950 font-black italic text-xs flex items-center justify-center border border-zinc-200">02</span>;
      case 3:
        return <span className="w-7 h-7 bg-amber-600 text-white font-black italic text-xs flex items-center justify-center border border-amber-500">03</span>;
      default:
        return <span className="w-7 h-7 bg-slate-950 text-slate-400 font-bold italic text-xs flex items-center justify-center border border-slate-850">
          {pos < 10 ? `0${pos}` : pos}
        </span>;
    }
  };

  const getResenhaBadge = (pos: number, total: number) => {
    if (total === 0) return null;
    if (pos <= 3) {
      return (
        <span className="text-[8px] bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
          👑 Pelé do Pier
        </span>
      );
    }
    
    // Se estiver nas últimas posições (últimos 30% ou os 3 últimos, mas sem invadir o top 3)
    const isBottom = pos > 3 && (pos > total - 3 || pos > Math.floor(total * 0.7));
    if (isBottom) {
      return (
        <span className="text-[8px] bg-red-500/15 border border-red-500/40 text-red-400 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
          🪵 Perna de Pau
        </span>
      );
    }

    return (
      <span className="text-[8px] bg-sky-500/15 border border-sky-500/40 text-sky-400 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
        🎉 Arroz de Festa
      </span>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-5" id="ranking-section">
      {selectedMatch?.status === 'finished' && ranking.some(row => row.userId === user?.id && row.position <= 3) && (
        <Confetti />
      )}
      
      {/* Resumo de Arrecadação e Prêmios */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
        {/* Yellow lighting bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400"></div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black uppercase text-yellow-400 tracking-widest flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Acumulado do Bolão
            </h3>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/50 border border-emerald-900/60 px-2.5 py-1 rounded uppercase tracking-wider">
              R$ 10 / entrada
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 items-stretch">
            {/* Rotated Yellow Card from design */}
            <div className="bg-yellow-400 text-black p-4 rounded-xl rotate-[-1deg] shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider block opacity-80">Total Arrecadado</span>
                <span className="text-2xl font-black italic tracking-tighter block mt-0.5">{formatCurrency(totalCollection)}</span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider mt-2 block flex items-center gap-1 opacity-90">
                ✓ {paidCount} Pagantes
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Divisão</span>
              <span className="text-[10px] font-black text-zinc-300 block leading-relaxed uppercase tracking-wider">
                🥇 1º: <strong className="text-yellow-400">60%</strong><br />
                🥈 2º: <strong className="text-zinc-100">30%</strong><br />
                🥉 3º: <strong className="text-amber-500">10%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela do Ranking */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Classificação Geral
          </h3>
          <button 
            onClick={fetchRankingAndBets}
            className="text-[10px] font-black text-yellow-400 hover:text-yellow-300 uppercase tracking-widest bg-yellow-400/10 hover:bg-yellow-400/20 px-3 py-1.5 rounded-lg border border-yellow-400/30 transition-all"
          >
            Atualizar
          </button>
        </div>

        {ranking.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-xs font-bold uppercase tracking-wider space-y-1">
            <p>Nenhum participante pago ainda.</p>
            <p className="text-[10px] text-zinc-600">Apenas jogadores com pagamento verificado entram no ranking oficial!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-850">
            {ranking.map((row) => {
              const isExpanded = expandedUserId === row.userId;
              
              // Localiza o palpite correspondente para exibir detalhes
              const userBet = allBets.find(b => b.userId === row.userId);
              const hasAvailableBet = userBet && (selectedMatch?.status !== 'open' || user?.isAdmin || row.userId === user?.id);

              return (
                <div key={row.userId} className={`transition-all ${isExpanded ? 'bg-slate-950/80' : 'hover:bg-slate-950/30'}`}>
                  {/* Linha Principal */}
                  <div 
                    onClick={() => hasAvailableBet && toggleExpandUser(row.userId)}
                    className={`p-3.5 flex items-center justify-between gap-2 ${hasAvailableBet ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {getPositionBadge(row.position)}
                      <div>
                        <span className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                          {row.userName}
                          {row.userId === user?.id && (
                            <span className="text-[8px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Você</span>
                          )}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {getResenhaBadge(row.position, ranking.length)}
                          {row.prize > 0 && (
                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                              • Prêmio: <strong className="font-black">{formatCurrency(row.prize)}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-lg font-black italic text-yellow-400 block tracking-tighter">{row.totalPoints} PTS</span>
                      </div>
                      {hasAvailableBet ? (
                        isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />
                      ) : (
                        selectedMatch?.status === 'open' && row.userId !== user?.id && (
                          <div className="p-1" title="Palpites fechados até o início do jogo">
                            <EyeOff className="w-3.5 h-3.5 text-zinc-600" />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Detalhes Expandidos (Palpite e Breakdown) */}
                  <AnimatePresence>
                    {isExpanded && userBet && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-800 bg-slate-950/90 px-4 py-3 text-xs space-y-3"
                      >
                        {/* Palpite Resumido */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          <div>
                            <span className="text-zinc-500 block uppercase text-[8px] tracking-widest">Placar 1T:</span>
                            <span className="text-zinc-200 font-mono">{userBet.placar1tA} x {userBet.placar1tB}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[8px] tracking-widest">Placar Final:</span>
                            <span className="text-zinc-200 font-mono">{userBet.placarFinalA} x {userBet.placarFinalB}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[8px] tracking-widest">Gols Previstos:</span>
                            <span className="text-zinc-200 text-[10px] space-y-0.5 block">
                              {userBet.goleadores && userBet.goleadores.length > 0 ? (
                                userBet.goleadores.map((g: any, i: number) => (
                                  <span key={i} className="block">
                                    ⚽ {g.player} ({g.goals} gol{g.goals > 1 ? 's' : ''}) - Time {g.team}
                                  </span>
                                ))
                              ) : (
                                (userBet.autoresGols || []).join(", ") || "Nenhum"
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[8px] tracking-widest">Craque:</span>
                            <span className="text-zinc-200 text-[10px]">{userBet.craque || "Nenhum"}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[8px] tracking-widest">1º Gol (Min):</span>
                            <span className="text-zinc-200 font-mono">{userBet.min1Gol > 0 ? `${userBet.min1Gol}'` : "Sem gol"}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block uppercase text-[8px] tracking-widest">Escanteios 1T / 2T:</span>
                            <span className="text-zinc-200 font-mono">{(userBet.escanteios1t ?? 0)} / {(userBet.escanteios2t ?? 0)}</span>
                          </div>
                        </div>

                        {/* Detalhamento dos Pontos se já houver resultados */}
                        {userBet.pointsBreakdown && (
                          <div className="pt-2.5 border-t border-slate-800 space-y-1.5">
                            <span className="block text-[9px] font-black text-yellow-400 uppercase tracking-widest">Detalhamento de Pontos:</span>
                            <div className="grid grid-cols-2 gap-1.5 font-bold text-[9px] text-zinc-400 uppercase tracking-wider">
                              <div className="flex justify-between">
                                <span>Placar Final:</span>
                                <span className={(userBet.pointsBreakdown.placarFinal ?? 0) > 0 ? "text-emerald-400 font-black" : "text-zinc-600"}>+{(userBet.pointsBreakdown.placarFinal ?? 0)} pts</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Placar 1T:</span>
                                <span className={(userBet.pointsBreakdown.placar1t ?? 0) > 0 ? "text-emerald-400 font-black" : "text-zinc-600"}>+{(userBet.pointsBreakdown.placar1t ?? 0)} pts</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Autores de Gols:</span>
                                <span className={(userBet.pointsBreakdown.autoresGols ?? 0) > 0 ? "text-emerald-400 font-black" : "text-zinc-600"}>+{(userBet.pointsBreakdown.autoresGols ?? 0)} pts</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Craque:</span>
                                <span className={(userBet.pointsBreakdown.craque ?? 0) > 0 ? "text-emerald-400 font-black" : "text-zinc-600"}>+{(userBet.pointsBreakdown.craque ?? 0)} pts</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Minuto 1º Gol:</span>
                                <span className={(userBet.pointsBreakdown.min1Gol ?? 0) > 0 ? "text-emerald-400 font-black" : "text-zinc-600"}>+{(userBet.pointsBreakdown.min1Gol ?? 0)} pts</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Escanteios (1T/2T):</span>
                                <span className={((userBet.pointsBreakdown.escanteios1t ?? 0) + (userBet.pointsBreakdown.escanteios2t ?? 0)) > 0 ? "text-emerald-400 font-black" : "text-zinc-600"}>+{((userBet.pointsBreakdown.escanteios1t ?? 0) + (userBet.pointsBreakdown.escanteios2t ?? 0))} pts</span>
                              </div>
                              <div className="flex justify-between col-span-2 border-t border-slate-800 pt-1 mt-1">
                                <span className="text-white">Total:</span>
                                <span className="text-yellow-400 font-black">+{userBet.totalPoints} PTS</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Regras e Legenda Popover Link */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3 text-xs">
        <h4 className="font-black text-white uppercase tracking-widest flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-yellow-400" />
          Regras de Pontuação
        </h4>
        <ul className="space-y-1.5 font-black text-zinc-400 uppercase tracking-wider text-[10px] leading-relaxed list-disc list-inside">
          <li>🥇 <strong className="text-zinc-200">Placar Final Exato:</strong> 10 pts</li>
          <li>🎯 <strong className="text-zinc-200">Vencedor ou Empate:</strong> 5 pts (Não acumula)</li>
          <li>⏱️ <strong className="text-zinc-200">Placar 1º Tempo:</strong> 5 pts</li>
          <li>⚽ <strong className="text-zinc-200">Autores dos Gols:</strong> 3 pts por jogador</li>
          <li>⭐ <strong className="text-zinc-200">Craque Eleito:</strong> 5 pts</li>
          <li>⏱️ <strong className="text-zinc-200">Minuto do 1º Gol:</strong> 5 pts exato / 2 pts (margem 3 min)</li>
          <li>🚩 <strong className="text-zinc-200">Escanteios:</strong> 5 pts exato / 2 pts (errar por 1)</li>
          <li>🟨 <strong className="text-zinc-200">Cartões:</strong> 5 pts exato por tempo</li>
        </ul>
      </div>

    </div>
  );
}
