/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bet, MatchResults, PointsBreakdown, RankingEntry } from './types';

/**
 * Normaliza um nome para comparação (remove espaços extras e coloca em minúsculas)
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Calcula a pontuação detalhada de um palpite comparado com o resultado real
 */
export function calculatePoints(bet: {
  placar1tA: number;
  placar1tB: number;
  placarFinalA: number;
  placarFinalB: number;
  autoresGols: string[];
  goleadores?: { player: string; goals: number; team: 'A' | 'B' }[];
  craque: string;
  min1Gol: number;
  escanteios1t: number;
  escanteios2t: number;
  cartoesAmarelos1t: number;
  cartoesVermelhos1t: number;
  cartoesAmarelos2t: number;
  cartoesVermelhos2t: number;
}, real: MatchResults): PointsBreakdown {
  const breakdown: PointsBreakdown = {
    placarFinal: 0,
    placar1t: 0,
    autoresGols: 0,
    craque: 0,
    min1Gol: 0,
    escanteios1t: 0,
    escanteios2t: 0,
    cartoes1t: 0,
    cartoes2t: 0,
  };

  // 1. Placar Final Exato: 10 pontos
  const exactFinal = bet.placarFinalA === real.placarFinalA && bet.placarFinalB === real.placarFinalB;
  if (exactFinal) {
    breakdown.placarFinal = 10;
  } else {
    // 2. Vencedor ou Empate (Não acumula): 5 pontos
    const realWinner = real.placarFinalA > real.placarFinalB ? 'A' : real.placarFinalA < real.placarFinalB ? 'B' : 'TIE';
    const betWinner = bet.placarFinalA > bet.placarFinalB ? 'A' : bet.placarFinalA < bet.placarFinalB ? 'B' : 'TIE';
    if (realWinner === betWinner) {
      breakdown.placarFinal = 5;
    }
  }

  // 3. Placar 1º Tempo: 5 pontos para acerto exato
  if (bet.placar1tA === real.placar1tA && bet.placar1tB === real.placar1tB) {
    breakdown.placar1t = 5;
  }

  // 4. Autores dos Gols: 5 pontos por cada acerto exato de jogador + quantidade de gols (ou 3 pontos antigo se não houver goleadores)
  let scorerPoints = 0;
  if (bet.goleadores && Array.isArray(bet.goleadores) && bet.goleadores.length > 0) {
    const realGoalsMap: { [player: string]: number } = {};
    const allRealScorers = [...(real.autoresGolsA || []), ...(real.autoresGolsB || [])];
    for (const scorer of allRealScorers) {
      const norm = normalizeName(scorer);
      if (norm) {
        realGoalsMap[norm] = (realGoalsMap[norm] || 0) + 1;
      }
    }

    for (const g of bet.goleadores) {
      const normBetPlayer = normalizeName(g.player);
      if (!normBetPlayer) continue;
      const predictedGoals = Number(g.goals) || 0;
      const actualGoals = realGoalsMap[normBetPlayer] || 0;
      if (predictedGoals > 0 && actualGoals === predictedGoals) {
        scorerPoints += 5;
      }
    }
  } else {
    const allRealScorers = [...(real.autoresGolsA || []), ...(real.autoresGolsB || [])].map(normalizeName);
    const betScorersUnique = Array.from(new Set((bet.autoresGols || []).map(normalizeName))).filter(n => n.length > 0);
    for (const betScorer of betScorersUnique) {
      if (allRealScorers.includes(betScorer)) {
        scorerPoints += 3;
      }
    }
  }
  breakdown.autoresGols = scorerPoints;

  // 5. Craque da Partida: 5 pontos se acertar
  if (normalizeName(bet.craque) === normalizeName(real.craque) && normalizeName(real.craque).length > 0) {
    breakdown.craque = 5;
  }

  // 6. Minuto do 1º Gol: 5 pontos exato, 2 pontos com margem de até 3 min
  const realMin = real.min1Gol;
  const betMin = bet.min1Gol;
  
  if (realMin === -1 || realMin === null || realMin === undefined) {
    // Sem gols na partida
    if (betMin === -1 || betMin === 0) {
      breakdown.min1Gol = 5;
    }
  } else {
    if (betMin > 0) {
      if (betMin === realMin) {
        breakdown.min1Gol = 5;
      } else if (Math.abs(betMin - realMin) <= 3) {
        breakdown.min1Gol = 2;
      }
    }
  }

  // 7. Escanteios (Por Tempo)
  // 1º tempo: 5 pontos exato, 2 pontos se errar por 1 escanteio
  if (bet.escanteios1t === real.escanteios1t) {
    breakdown.escanteios1t = 5;
  } else if (Math.abs(bet.escanteios1t - real.escanteios1t) === 1) {
    breakdown.escanteios1t = 2;
  }

  // 2º tempo: 5 pontos exato, 2 pontos se errar por 1 escanteio
  if (bet.escanteios2t === real.escanteios2t) {
    breakdown.escanteios2t = 5;
  } else if (Math.abs(bet.escanteios2t - real.escanteios2t) === 1) {
    breakdown.escanteios2t = 2;
  }

  // 8. Cartões (Por Tempo)
  // Cartão Amarelo = 1 ponto, Cartão Vermelho = 2 pontos
  // 1º tempo
  const realCards1tPoints = real.cartoesAmarelos1t * 1 + real.cartoesVermelhos1t * 2;
  const betCards1tPoints = bet.cartoesAmarelos1t * 1 + bet.cartoesVermelhos1t * 2;
  if (realCards1tPoints === betCards1tPoints) {
    breakdown.cartoes1t = 5;
  }

  // 2º tempo
  const realCards2tPoints = real.cartoesAmarelos2t * 1 + real.cartoesVermelhos2t * 2;
  const betCards2tPoints = bet.cartoesAmarelos2t * 1 + bet.cartoesVermelhos2t * 2;
  if (realCards2tPoints === betCards2tPoints) {
    breakdown.cartoes2t = 5;
  }

  return breakdown;
}

/**
 * Calcula a soma dos pontos do breakdown
 */
export function sumPoints(breakdown: PointsBreakdown): number {
  return (
    breakdown.placarFinal +
    breakdown.placar1t +
    breakdown.autoresGols +
    breakdown.craque +
    breakdown.min1Gol +
    breakdown.escanteios1t +
    breakdown.escanteios2t +
    breakdown.cartoes1t +
    breakdown.cartoes2t
  );
}

/**
 * Atribui posições e distribui prêmios dinamicamente considerando empates
 */
export function calculateRankingsAndPrizes(
  bets: { userId: string; userName: string; totalPoints: number; isPaid: boolean }[],
  totalCollection: number
): RankingEntry[] {
  // Somente usuários PAGOS entram no ranking
  const paidBets = bets.filter(b => b.isPaid);

  // Ordena por pontos decrescente
  const sorted = [...paidBets].sort((a, b) => b.totalPoints - a.totalPoints);

  const results: RankingEntry[] = [];
  
  // Percentual dos prêmios por posição (1º, 2º, 3º)
  const prizePercentages = [0.60, 0.30, 0.10]; // 60%, 30%, 10%

  let i = 0;
  while (i < sorted.length) {
    // Encontra o grupo de empatados com a mesma pontuação
    const currentScore = sorted[i].totalPoints;
    let j = i;
    while (j < sorted.length && sorted[j].totalPoints === currentScore) {
      j++;
    }

    const groupSize = j - i;
    
    // As posições ocupadas por este grupo são de i até j-1 (0-based)
    // Coletamos a fração de prêmios correspondente a essas posições
    let groupPrizeSum = 0;
    for (let pos = i; pos < j; pos++) {
      if (pos < prizePercentages.length) {
        groupPrizeSum += prizePercentages[pos] * totalCollection;
      }
    }

    const prizePerPlayer = groupPrizeSum / groupSize;

    // Adiciona todos do grupo com a mesma posição e prêmio dividido
    for (let k = i; k < j; k++) {
      results.push({
        userId: sorted[k].userId,
        userName: sorted[k].userName,
        totalPoints: sorted[k].totalPoints,
        betsCount: 1, // simplificado
        isPaid: true,
        position: i + 1, // Posição oficial (ex: se 2 empatam em 1º, ambos são 1º)
        prize: parseFloat(prizePerPlayer.toFixed(2)),
      });
    }

    i = j; // Pula para o próximo grupo
  }

  return results;
}
