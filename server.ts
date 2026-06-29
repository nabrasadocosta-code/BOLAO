/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { User, Match, Bet, MatchResults, PointsBreakdown, RankingEntry } from "./src/types.js";
import { calculatePoints, sumPoints, calculateRankingsAndPrizes } from "./src/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "db.json");

// Helper para ler o banco
function readDb(): { users: User[]; matches: Match[]; bets: Bet[] } {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { users: [], matches: [], bets: [] };
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler banco de dados:", error);
    return { users: [], matches: [], bets: [] };
  }
}

// Helper para salvar o banco
function writeDb(data: { users: User[]; matches: Match[]; bets: Bet[] }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao salvar no banco de dados:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware de Autenticação Customizado usando Headers (Authorization: Bearer <userId>)
  app.use((req: any, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const userId = authHeader.substring(7);
      const db = readDb();
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        req.user = user;
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
  app.post("/api/auth/register", (req, res) => {
    const { name, phone, pin } = req.body;

    if (!name || !phone || !pin) {
      return res.status(400).json({ error: "Nome, telefone e PIN de 4 dígitos são obrigatórios." });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanPin = pin.replace(/\D/g, "");

    if (cleanPin.length !== 4) {
      return res.status(400).json({ error: "O PIN deve conter exatamente 4 números." });
    }

    const db = readDb();
    const existing = db.users.find((u) => u.phone.replace(/\D/g, "") === cleanPhone);

    if (existing) {
      return res.status(400).json({ error: "Já existe uma conta registrada com este número de telefone." });
    }

    const newUser: User = {
      id: "user-" + Date.now(),
      name: name.trim(),
      phone: cleanPhone,
      pin: cleanPin,
      isAdmin: false, // Por padrão, usuários normais
    };

    db.users.push(newUser);
    writeDb(db);

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
  app.post("/api/auth/login", (req, res) => {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({ error: "Telefone e PIN são obrigatórios." });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const cleanPin = pin.replace(/\D/g, "");

    const db = readDb();
    const user = db.users.find(
      (u) => u.phone.replace(/\D/g, "") === cleanPhone && u.pin === cleanPin
    );

    if (!user) {
      return res.status(401).json({ error: "Telefone ou PIN incorretos." });
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
  app.get("/api/matches", (req, res) => {
    const db = readDb();
    res.json({ matches: db.matches });
  });

  // Criar ou atualizar partida (Admin)
  app.post("/api/matches", requireAdmin, (req, res) => {
    const { id, teamA, teamB, matchDate, status } = req.body;

    if (!teamA || !teamB || !matchDate) {
      return res.status(400).json({ error: "Times e data da partida são obrigatórios." });
    }

    const db = readDb();

    if (id) {
      // Atualiza partida existente
      const idx = db.matches.findIndex((m) => m.id === id);
      if (idx !== -1) {
        db.matches[idx] = {
          ...db.matches[idx],
          teamA: teamA.trim(),
          teamB: teamB.trim(),
          matchDate,
          status: status || db.matches[idx].status,
        };
        writeDb(db);
        return res.json({ success: true, match: db.matches[idx] });
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
      db.matches.push(newMatch);
      writeDb(db);
      return res.json({ success: true, match: newMatch });
    }
  });

  // Deletar partida (Admin)
  app.delete("/api/matches/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.matches = db.matches.filter((m) => m.id !== id);
    db.bets = db.bets.filter((b) => b.matchId !== id); // Remove palpites correspondentes
    writeDb(db);
    res.json({ success: true });
  });

  // Obter palpite do usuário logado para uma partida
  app.get("/api/bets/my/:matchId", requireAuth, (req: any, res) => {
    const { matchId } = req.params;
    const db = readDb();
    const bet = db.bets.find((b) => b.userId === req.user.id && b.matchId === matchId);
    res.json({ bet: bet || null });
  });

  // Criar ou atualizar palpite
  app.post("/api/bets", requireAuth, (req: any, res) => {
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

    const db = readDb();
    const match = db.matches.find((m) => m.id === matchId);

    if (!match) {
      return res.status(404).json({ error: "Partida não encontrada." });
    }

    // Regras de bloqueio de palpites:
    // O sistema deve fechar às 14:00 (ou se o status for in_progress/finished)
    const now = new Date();
    const limitDate = new Date(match.matchDate);
    const isPastLimit = now > limitDate;

    if (match.status !== "open" || isPastLimit) {
      return res.status(400).json({
        error: "Os palpites para esta partida estão encerrados (limite do início do jogo atingido).",
      });
    }

    // Encontra se já tem palpite
    const existingBetIndex = db.bets.findIndex(
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

    db.bets.push(betData);

    writeDb(db);
    res.json({ success: true, bet: betData });
  });

  // Listar todos os palpites para administração (Admin)
  app.get("/api/bets/all", requireAdmin, (req, res) => {
    const db = readDb();
    res.json({ bets: db.bets });
  });

  // Atualizar status de pagamento de um palpite (Admin)
  app.post("/api/bets/:id/pay", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { isPaid } = req.body;

    const db = readDb();
    const idx = db.bets.findIndex((b) => b.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: "Palpite não encontrado." });
    }

    db.bets[idx].isPaid = Boolean(isPaid);
    writeDb(db);

    res.json({ success: true, bet: db.bets[idx] });
  });

  // Salvar resultados oficiais da partida e rodar o cálculo de pontos (Admin)
  app.post("/api/matches/:id/results", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { realResults } = req.body;

    if (!realResults) {
      return res.status(400).json({ error: "Resultados oficiais são necessários." });
    }

    const db = readDb();
    const matchIdx = db.matches.findIndex((m) => m.id === id);

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
    db.matches[matchIdx].realResults = typedResults;
    db.matches[matchIdx].status = "finished";

    // Recalcula pontos de TODOS os palpites desta partida
    db.bets.forEach((bet) => {
      if (bet.matchId === id) {
        const breakdown = calculatePoints(bet, typedResults);
        bet.pointsBreakdown = breakdown;
        bet.totalPoints = sumPoints(breakdown);
      }
    });

    writeDb(db);
    res.json({ success: true, match: db.matches[matchIdx] });
  });

  // Resetar resultados oficiais e voltar partida para "open" ou "in_progress" (Admin)
  app.post("/api/matches/:id/reset", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const db = readDb();
    const matchIdx = db.matches.findIndex((m) => m.id === id);

    if (matchIdx === -1) {
      return res.status(404).json({ error: "Partida não encontrada." });
    }

    db.matches[matchIdx].realResults = null;
    db.matches[matchIdx].status = status || "open";

    // Reseta pontos de palpites desta partida
    db.bets.forEach((bet) => {
      if (bet.matchId === id) {
        bet.pointsBreakdown = null;
        bet.totalPoints = 0;
      }
    });

    writeDb(db);
    res.json({ success: true, match: db.matches[matchIdx] });
  });

  // Obter ranking e simulação de prêmios ao vivo
  app.get("/api/ranking/:matchId", (req, res) => {
    const { matchId } = req.params;
    const db = readDb();

    // Filtra palpites dessa partida
    const matchBets = db.bets.filter((b) => b.matchId === matchId);

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
