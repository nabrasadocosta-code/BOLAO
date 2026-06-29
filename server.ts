/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { User, Match, Bet, MatchResults, PointsBreakdown, RankingEntry } from "./src/types.js";
import { calculatePoints, sumPoints, calculateRankingsAndPrizes } from "./src/utils.js";

// Import Firebase Client SDK
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc, getDoc, deleteDoc, query, where } from 'firebase/firestore';
import fs from 'fs';

// Inicializar Firebase
let firebaseConfig: any;
try {
  firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
} catch (e) {
  firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    appId: process.env.FIREBASE_APP_ID,
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  };
}

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Helper para ler todos os dados (simulando o banco em memória para manter a lógica simples do backend, 
// embora em produção o ideal seja fazer queries específicas. Vamos manter a compatibilidade com a lógica existente)
async function readDb(): Promise<{ users: User[]; matches: Match[]; bets: Bet[] }> {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const matchesSnapshot = await getDocs(collection(db, 'matches'));
    const betsSnapshot = await getDocs(collection(db, 'bets'));
    
    return {
      users: usersSnapshot.docs.map(d => d.data() as User),
      matches: matchesSnapshot.docs.map(d => d.data() as Match),
      bets: betsSnapshot.docs.map(d => d.data() as Bet),
    };
  } catch (error: any) {
    console.error("Erro ao ler banco de dados do Firestore:", error);
    // Se der erro de permissão (ex: regras não configuradas), retorna vazio para não quebrar tudo
    if (error?.code === 'permission-denied') {
      console.error("AVISO: Permissão negada no Firestore. Por favor, configure as regras de segurança no console do Firebase.");
    }
    return { users: [], matches: [], bets: [] };
  }
}

// Helper para salvar todos os dados no Firestore (simulando a escrita do arquivo inteiro)
// NOTA: Para performance e concorrência, o ideal seria atualizar apenas os documentos necessários,
// mas para manter a compatibilidade exata com as funções síncronas anteriores, estamos persistindo assim.
// Vamos criar funções específicas para atualizar apenas o necessário nas rotas.
async function writeUser(user: User) {
  await setDoc(doc(db, 'users', user.id), user);
}
async function writeMatch(match: Match) {
  await setDoc(doc(db, 'matches', match.id), match);
}
async function writeBet(bet: Bet) {
  await setDoc(doc(db, 'bets', bet.id), bet);
}
async function removeMatch(matchId: string) {
  await deleteDoc(doc(db, 'matches', matchId));
}
async function removeBet(betId: string) {
  await deleteDoc(doc(db, 'bets', betId));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[API REQUEST] ${req.method} ${req.url} - Body:`, JSON.stringify(req.body));
    const oldSend = res.send;
    res.send = function (data) {
      console.log(`[API RESPONSE] ${req.method} ${req.url} - Status: ${res.statusCode} - Response:`, typeof data === 'string' ? data.substring(0, 200) : data);
      return oldSend.apply(res, arguments as any);
    };
    next();
  });

  // Middleware de Autenticação Customizado usando Headers (Authorization: Bearer <userId>)
  app.use(async (req: any, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const userId = authHeader.substring(7);
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          req.user = userDoc.data() as User;
        }
      } catch (err) {
        console.error("Auth middleware db error:", err);
      }
    }
    next();
  });

  // Helper para rotas que exigem estar autenticado
  const requireAuth = (req: any, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Não autorizado. Faça login primeiro." });
    }
    next();
  };

  // Helper para rotas de Admin
  const requireAdmin = (req: any, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: "Acesso restrito para administradores." });
    }
    next();
  };

  // --- API ROUTES ---

  // Registro de Usuário
  app.post("/api/auth/register", async (req, res) => {
    const { name, phone, pin } = req.body;

    if (!name || !phone || !pin) {
      return res.status(200).json({ success: false, error: "Nome, telefone e PIN de 4 dígitos são obrigatórios." });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanPin = pin.replace(/\D/g, "");

    if (cleanPin.length !== 4) {
      return res.status(200).json({ success: false, error: "O PIN deve conter exatamente 4 números." });
    }

    const database = await readDb();
    
    // Validar se já existe um participante com esse mesmo nome
    const nameExists = database.users.some((u) => u.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (nameExists) {
      return res.status(200).json({ success: false, error: "Já existe um participante cadastrado com este nome completo. Adicione um sobrenome ou outra identificação para diferenciar." });
    }

    const existing = database.users.find((u) => u.phone.replace(/\D/g, "") === cleanPhone);

    if (existing) {
      return res.status(200).json({ success: false, error: "Já existe uma conta registrada com este número de telefone." });
    }

    const newUser: User = {
      id: "user-" + Date.now(),
      name: name.trim(),
      phone: cleanPhone,
      pin: cleanPin,
      isAdmin: false, // Por padrão, usuários normais
    };

    try {
      await writeUser(newUser);
    } catch (e: any) {
      return res.status(500).json({ success: false, error: "Erro interno no banco de dados. " + (e.message || "") });
    }

    res.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        isAdmin: newUser.isAdmin,
      },
    });
  });

  // Login de Usuário
  app.post("/api/auth/login", async (req, res) => {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(200).json({ success: false, error: "Telefone e PIN são obrigatórios." });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanPin = pin.replace(/\D/g, "");

    const database = await readDb();
    const user = database.users.find(
      (u) => u.phone.replace(/\D/g, "") === cleanPhone && u.pin === cleanPin
    );

    if (!user) {
      return res.status(200).json({ success: false, error: "Telefone ou PIN incorretos." });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
    });
  });

  // Obter usuário logado atual
  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        phone: req.user.phone,
        isAdmin: req.user.isAdmin,
      },
    });
  });

  // Listar partidas
  app.get("/api/matches", async (req, res) => {
    const database = await readDb();
    res.json({ matches: database.matches });
  });

  // Criar ou atualizar partida (Admin)
  app.post("/api/matches", requireAdmin, async (req, res) => {
    const { id, teamA, teamB, matchDate, status } = req.body;

    if (!teamA || !teamB || !matchDate) {
      return res.status(400).json({ error: "Times e data da partida são obrigatórios." });
    }

    const database = await readDb();

    if (id) {
      // Atualiza partida existente
      const idx = database.matches.findIndex((m) => m.id === id);
      if (idx !== -1) {
        const updatedMatch = {
          ...database.matches[idx],
          teamA: teamA.trim(),
          teamB: teamB.trim(),
          matchDate,
          status: status || database.matches[idx].status,
        };
        await writeMatch(updatedMatch);
        return res.json({ success: true, match: updatedMatch });
      }
      return res.status(404).json({ error: "Partida não encontrada para atualização." });
    } else {
      // Cria nova partida
      const newMatch: Match = {
        id: "match-" + Date.now(),
        teamA: teamA.trim(),
        teamB: teamB.trim(),
        matchDate,
        status: "open",
        realResults: null,
      };
      await writeMatch(newMatch);
      return res.json({ success: true, match: newMatch });
    }
  });

  // Deletar partida (Admin)
  app.delete("/api/matches/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const database = await readDb();
    
    await removeMatch(id);
    
    const betsToRemove = database.bets.filter((b) => b.matchId === id);
    for (const bet of betsToRemove) {
      await removeBet(bet.id);
    }
    
    res.json({ success: true });
  });

  // Obter palpite do usuário logado para uma partida
  app.get("/api/bets/my/:matchId", requireAuth, async (req: any, res) => {
    const { matchId } = req.params;
    const database = await readDb();
    const bet = database.bets.find((b) => b.userId === req.user.id && b.matchId === matchId);
    res.json({ bet: bet || null });
  });

  // Criar ou atualizar palpite
  app.post("/api/bets", requireAuth, async (req: any, res) => {
    const {
      matchId,
      placar1tA,
      placar1tB,
      placarFinalA,
      placarFinalB,
      autoresGols,
      goleadores,
      craque,
      min1Gol,
      escanteios1t,
      escanteios2t,
      cartoesAmarelos1t,
      cartoesVermelhos1t,
      cartoesAmarelos2t,
      cartoesVermelhos2t,
    } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: "ID da partida é obrigatório." });
    }

    const database = await readDb();
    const match = database.matches.find((m) => m.id === matchId);

    if (!match) {
      return res.status(404).json({ error: "Partida não encontrada." });
    }

    // Regras de bloqueio de palpites:
    const now = new Date();
    const limitDate = new Date(match.matchDate);
    const isPastLimit = now > limitDate;

    if (match.status !== "open" || isPastLimit) {
      return res.status(400).json({
        error: "Os palpites para esta partida estão encerrados (limite do início do jogo atingido).",
      });
    }

    // Encontra se já tem palpite
    const existingBetIndex = database.bets.findIndex(
      (b) => b.userId === req.user.id && b.matchId === matchId
    );

    if (existingBetIndex !== -1) {
      return res.status(400).json({
        error: "Você já salvou seu palpite para este jogo. Não é permitido editar após salvar."
      });
    }

    const betData: Bet = {
      id: "bet-" + Date.now(),
      userId: req.user.id,
      userName: req.user.name,
      matchId,
      isPaid: false, // Inicia como não pago
      placar1tA: Number(placar1tA),
      placar1tB: Number(placar1tB),
      placarFinalA: Number(placarFinalA),
      placarFinalB: Number(placarFinalB),
      autoresGols: Array.isArray(autoresGols) ? autoresGols.filter(Boolean) : [],
      goleadores: Array.isArray(goleadores) ? goleadores : [],
      craque: (craque || "").trim(),
      min1Gol: Number(min1Gol),
      escanteios1t: Number(escanteios1t),
      escanteios2t: Number(escanteios2t),
      cartoesAmarelos1t: Number(cartoesAmarelos1t),
      cartoesVermelhos1t: Number(cartoesVermelhos1t),
      cartoesAmarelos2t: Number(cartoesAmarelos2t),
      cartoesVermelhos2t: Number(cartoesVermelhos2t),
      pointsBreakdown: null,
      totalPoints: 0,
    };

    await writeBet(betData);
    res.json({ success: true, bet: betData });
  });

  // Listar todos os palpites para administração (Admin)
  app.get("/api/bets/all", requireAdmin, async (req, res) => {
    const database = await readDb();
    res.json({ bets: database.bets });
  });

  // Atualizar status de pagamento de um palpite (Admin)
  app.post("/api/bets/:id/pay", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { isPaid } = req.body;

    const database = await readDb();
    const idx = database.bets.findIndex((b) => b.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: "Palpite não encontrado." });
    }

    const updatedBet = {
      ...database.bets[idx],
      isPaid: Boolean(isPaid)
    };
    await writeBet(updatedBet);

    res.json({ success: true, bet: updatedBet });
  });

  // Salvar resultados oficiais da partida e rodar o cálculo de pontos (Admin)
  app.post("/api/matches/:id/results", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { realResults } = req.body;

    if (!realResults) {
      return res.status(400).json({ error: "Resultados oficiais são necessários." });
    }

    const database = await readDb();
    const matchIdx = database.matches.findIndex((m) => m.id === id);

    if (matchIdx === -1) {
      return res.status(404).json({ error: "Partida não encontrada." });
    }

    const typedResults: MatchResults = {
      placar1tA: Number(realResults.placar1tA),
      placar1tB: Number(realResults.placar1tB),
      placarFinalA: Number(realResults.placarFinalA),
      placarFinalB: Number(realResults.placarFinalB),
      autoresGolsA: Array.isArray(realResults.autoresGolsA) ? realResults.autoresGolsA.filter(Boolean) : [],
      autoresGolsB: Array.isArray(realResults.autoresGolsB) ? realResults.autoresGolsB.filter(Boolean) : [],
      craque: (realResults.craque || "").trim(),
      min1Gol: Number(realResults.min1Gol),
      escanteios1t: Number(realResults.escanteios1t),
      escanteios2t: Number(realResults.escanteios2t),
      cartoesAmarelos1t: Number(realResults.cartoesAmarelos1t),
      cartoesVermelhos1t: Number(realResults.cartoesVermelhos1t),
      cartoesAmarelos2t: Number(realResults.cartoesAmarelos2t),
      cartoesVermelhos2t: Number(realResults.cartoesVermelhos2t),
    };

    // Atualiza partida
    const updatedMatch = {
      ...database.matches[matchIdx],
      realResults: typedResults,
      status: "finished" as const
    };
    await writeMatch(updatedMatch);

    // Recalcula pontos de TODOS os palpites desta partida
    for (const bet of database.bets) {
      if (bet.matchId === id) {
        const breakdown = calculatePoints(bet, typedResults);
        const updatedBet = {
          ...bet,
          pointsBreakdown: breakdown,
          totalPoints: sumPoints(breakdown)
        };
        await writeBet(updatedBet);
      }
    }

    res.json({ success: true, match: updatedMatch });
  });

  // Resetar resultados oficiais e voltar partida para "open" ou "in_progress" (Admin)
  app.post("/api/matches/:id/reset", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const database = await readDb();
    const matchIdx = database.matches.findIndex((m) => m.id === id);

    if (matchIdx === -1) {
      return res.status(404).json({ error: "Partida não encontrada." });
    }

    const updatedMatch = {
      ...database.matches[matchIdx],
      realResults: null,
      status: status || "open"
    };
    await writeMatch(updatedMatch);

    // Reseta pontos de palpites desta partida
    for (const bet of database.bets) {
      if (bet.matchId === id) {
        const updatedBet = {
          ...bet,
          pointsBreakdown: null,
          totalPoints: 0
        };
        await writeBet(updatedBet);
      }
    }

    res.json({ success: true, match: updatedMatch });
  });

  // Obter ranking e simulação de prêmios ao vivo
  app.get("/api/ranking/:matchId", async (req, res) => {
    const { matchId } = req.params;
    const database = await readDb();

    // Filtra palpites dessa partida
    const matchBets = database.bets.filter((b) => b.matchId === matchId);

    // Quantidade de pagantes (isPaid = true)
    const paidBets = matchBets.filter((b) => b.isPaid);
    const paidCount = paidBets.length;
    const totalCollection = paidCount * 10; // Taxa de participação: R$ 10,00

    // Calcula ranking e prêmios
    const ranking = calculateRankingsAndPrizes(matchBets, totalCollection);

    res.json({
      ranking,
      paidCount,
      totalCollection,
    });
  });

  // --- VITE DEV SERVER OR STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Bolão Pier do Costa] rodando em http://localhost:${PORT}`);
  });
}

startServer();
