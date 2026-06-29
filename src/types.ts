/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  phone: string;
  pin: string;
  isAdmin: boolean;
}

export interface MatchResults {
  placar1tA: number;
  placar1tB: number;
  placarFinalA: number;
  placarFinalB: number;
  autoresGolsA: string[]; // Gols do Time A
  autoresGolsB: string[]; // Gols do Time B
  craque: string;
  min1Gol: number; // Minute of 1st goal, -1 if no goals
  escanteios1t: number;
  escanteios2t: number;
  cartoesAmarelos1t: number;
  cartoesVermelhos1t: number;
  cartoesAmarelos2t: number;
  cartoesVermelhos2t: number;
}

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  matchDate: string; // ISO string or simple date string
  status: 'open' | 'in_progress' | 'finished';
  realResults: MatchResults | null;
}

export interface Bet {
  id: string;
  userId: string;
  userName: string;
  matchId: string;
  isPaid: boolean;
  placar1tA: number;
  placar1tB: number;
  placarFinalA: number;
  placarFinalB: number;
  autoresGols: string[]; // Nomes dos jogadores previstos para marcar gol
  goleadores?: { player: string; goals: number; team: 'A' | 'B' }[]; // Goleadores com quantidade de gols e seleção
  craque: string;
  min1Gol: number;
  escanteios1t: number;
  escanteios2t: number;
  cartoesAmarelos1t: number;
  cartoesVermelhos1t: number;
  cartoesAmarelos2t: number;
  cartoesVermelhos2t: number;
  pointsBreakdown: PointsBreakdown | null;
  totalPoints: number;
}

export interface PointsBreakdown {
  placarFinal: number; // 10 exact, 5 result
  placar1t: number; // 5 exact
  autoresGols: number; // 3 per player
  craque: number; // 5 exact
  min1Gol: number; // 5 exact, 2 within 3 min
  escanteios1t: number; // 5 exact, 2 within 1
  escanteios2t: number; // 5 exact, 2 within 1
  cartoes1t: number; // 5 exact (Yellow = 1, Red = 2)
  cartoes2t: number; // 5 exact (Yellow = 1, Red = 2)
}

export interface RankingEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  betsCount: number;
  isPaid: boolean;
  position: number;
  prize: number; // Dinamicamente calculado
}
