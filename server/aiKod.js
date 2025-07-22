// ===== 1. ANA APP.JS =====
// app.js
const fastify = require('fastify')({
  logger: {
    level: 'info',
    prettyPrint: process.env.NODE_ENV !== 'production'
  }
});

// WebSocket plugin
fastify.register(require('@fastify/websocket'));

// CORS
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true
});

// Static files (client için)
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/'
});

// Services'ları global olarak kaydet
const GameManager = require('./src/services/game/gameManager');
const MatchmakingService = require('./src/services/matchmaking/matchmaker');
const TournamentService = require('./src/services/tournament/tournamentManager');

fastify.decorate('gameManager', new GameManager());
fastify.decorate('matchmaker', new MatchmakingService());
fastify.decorate('tournamentService', new TournamentService());
-
// Routes
fastify.register(require('./src/routes/websocket'), { prefix: '/ws' });
fastify.register(require('./src/routes/api/games'), { prefix: '/api' });

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🏓 Pong Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// ===== 2. GAME ENGINE =====
// src/services/game/gameEngine.js
class GameEngine {
  constructor(gameId, gameType, players) {
    this.gameId = gameId;
    this.gameType = gameType; // 'ai', 'multiplayer', 'local'
    this.players = players;
    this.gameState = this.initializeGame();
    this.gameLoop = null;
    this.tickRate = 1000 / 60; // 60 FPS
    this.callbacks = {
      onUpdate: null,
      onScore: null,
      onGameEnd: null
    };
  }

  initializeGame() {
    return {
      ball: {
        x: 400,
        y: 300,
        vx: Math.random() > 0.5 ? 5 : -5,
        vy: (Math.random() - 0.5) * 3,
        radius: 10
      },
      paddles: {
        left: { x: 20, y: 250, width: 20, height: 100, speed: 0 },
        right: { x: 760, y: 250, width: 20, height: 100, speed: 0 }
      },
      score: { left: 0, right: 0 },
      gameWidth: 800,
      gameHeight: 600,
      maxScore: 5,
      isRunning: false,
      winner: null
    };
  }

  start() {
    this.gameState.isRunning = true;
    this.gameLoop = setInterval(() => {
      this.update();
      if (this.callbacks.onUpdate) {
        this.callbacks.onUpdate(this.gameState);
      }
    }, this.tickRate);
  }

  stop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    this.gameState.isRunning = false;
  }

  update() {
    if (!this.gameState.isRunning) return;

    this.updateBall();
    this.updatePaddles();
    this.checkCollisions();
    this.checkScore();
  }

  updateBall() {
    const { ball } = this.gameState;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top/bottom collision
    if (ball.y <= ball.radius || ball.y >= this.gameState.gameHeight - ball.radius) {
      ball.vy = -ball.vy;
    }
  }

  updatePaddles() {
    const { paddles } = this.gameState;

    // Left paddle
    paddles.left.y += paddles.left.speed;
    paddles.left.y = Math.max(0, Math.min(this.gameState.gameHeight - paddles.left.height, paddles.left.y));

    // Right paddle
    paddles.right.y += paddles.right.speed;
    paddles.right.y = Math.max(0, Math.min(this.gameState.gameHeight - paddles.right.height, paddles.right.y));
  }

  checkCollisions() {
    const { ball, paddles } = this.gameState;

    // Left paddle collision
    if (ball.x <= paddles.left.x + paddles.left.width &&
        ball.y >= paddles.left.y &&
        ball.y <= paddles.left.y + paddles.left.height &&
        ball.vx < 0) {
      ball.vx = -ball.vx * 1.05; // Speed up slightly
      ball.vy += (Math.random() - 0.5) * 2;
    }

    // Right paddle collision
    if (ball.x >= paddles.right.x &&
        ball.y >= paddles.right.y &&
        ball.y <= paddles.right.y + paddles.right.height &&
        ball.vx > 0) {
      ball.vx = -ball.vx * 1.05;
      ball.vy += (Math.random() - 0.5) * 2;
    }
  }

  checkScore() {
    const { ball, score } = this.gameState;

    if (ball.x < 0) {
      score.right++;
      this.resetBall();
      if (this.callbacks.onScore) {
        this.callbacks.onScore('right', score);
      }
    } else if (ball.x > this.gameState.gameWidth) {
      score.left++;
      this.resetBall();
      if (this.callbacks.onScore) {
        this.callbacks.onScore('left', score);
      }
    }

    // Check game end
    if (score.left >= this.gameState.maxScore || score.right >= this.gameState.maxScore) {
      this.gameState.winner = score.left > score.right ? 'left' : 'right';
      this.stop();
      if (this.callbacks.onGameEnd) {
        this.callbacks.onGameEnd(this.gameState.winner, score);
      }
    }
  }

  resetBall() {
    const { ball } = this.gameState;
    ball.x = this.gameState.gameWidth / 2;
    ball.y = this.gameState.gameHeight / 2;
    ball.vx = Math.random() > 0.5 ? 5 : -5;
    ball.vy = (Math.random() - 0.5) * 3;
  }

  setPaddleSpeed(side, speed) {
    if (this.gameState.paddles[side]) {
      this.gameState.paddles[side].speed = Math.max(-8, Math.min(8, speed));
    }
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }
}

module.exports = GameEngine;

// ===== 3. GAME MANAGER =====
// src/services/game/gameManager.js
const GameEngine = require('./gameEngine');
const AIPlayer = require('./aiPlayer');

class GameManager {
  constructor() {
    this.activeGames = new Map();
    this.aiPlayers = new Map();
  }

  createGame(gameType, players) {
    const gameId = this.generateGameId();
    const game = new GameEngine(gameId, gameType, players);

    // AI oyuncu ekle
    if (gameType === 'ai') {
      const aiPlayer = new AIPlayer(game);
      this.aiPlayers.set(gameId, aiPlayer);
      aiPlayer.start();
    }

    // Event listeners
    game.on('onUpdate', (gameState) => {
      this.broadcastGameState(gameId, gameState);
    });

    game.on('onScore', (scorer, score) => {
      this.broadcastScore(gameId, scorer, score);
    });

    game.on('onGameEnd', (winner, score) => {
      this.handleGameEnd(gameId, winner, score);
    });

    this.activeGames.set(gameId, game);
    return { gameId, game };
  }

  getGame(gameId) {
    return this.activeGames.get(gameId);
  }

  removeGame(gameId) {
    const game = this.activeGames.get(gameId);
    if (game) {
      game.stop();
      this.activeGames.delete(gameId);

      // AI temizle
      const aiPlayer = this.aiPlayers.get(gameId);
      if (aiPlayer) {
        aiPlayer.stop();
        this.aiPlayers.delete(gameId);
      }
    }
  }

  handlePlayerInput(gameId, playerId, input) {
    const game = this.getGame(gameId);
    if (!game) return;

    const { action, value } = input;

    if (action === 'paddle') {
      // Player 1 sol taraf, Player 2 sağ taraf
      const side = game.players[0] === playerId ? 'left' : 'right';
      game.setPaddleSpeed(side, value);
    }
  }

  broadcastGameState(gameId, gameState) {
    // WebSocket ile tüm oyunculara gönder
    // Bu kısmı SocketManager'da implement edeceğiz
  }

  broadcastScore(gameId, scorer, score) {
    // Skor güncellemesini broadcast et
  }

  handleGameEnd(gameId, winner, score) {
    // Oyun bitişini handle et, veritabanına kaydet
    this.removeGame(gameId);
  }

  generateGameId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

module.exports = GameManager;

// ===== 4. AI PLAYER =====
// src/services/game/aiPlayer.js
class AIPlayer {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.difficulty = 0.8; // 0-1 arası zorluk
    this.reactionTime = 50; // ms
    this.updateInterval = null;
  }

  start() {
    this.updateInterval = setInterval(() => {
      this.update();
    }, this.reactionTime);
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  update() {
    if (!this.game.gameState.isRunning) return;

    const { ball, paddles } = this.game.gameState;
    const paddle = paddles.right; // AI sağ tarafta

    // Basit AI: topun Y pozisyonuna göre paddle hareket ettir
    const paddleCenter = paddle.y + paddle.height / 2;
    const ballY = ball.y;

    let targetSpeed = 0;

    if (ballY < paddleCenter - 10) {
      targetSpeed = -6 * this.difficulty;
    } else if (ballY > paddleCenter + 10) {
      targetSpeed = 6 * this.difficulty;
    }

    // Biraz hata ekle (zorluk ayarı)
    if (Math.random() > this.difficulty) {
      targetSpeed *= 0.3;
    }

    this.game.setPaddleSpeed('right', targetSpeed);
  }

  setDifficulty(level) {
    this.difficulty = Math.max(0.1, Math.min(1.0, level));
  }
}

module.exports = AIPlayer;

// ===== 5. WEBSOCKET ROUTES =====
// src/routes/websocket.js
async function websocketRoutes(fastify, options) {

  fastify.get('/game', { websocket: true }, (connection, req) => {
    const playerId = req.query.playerId || 'guest_' + Math.random().toString(36).substr(2, 9);

    console.log(`Player ${playerId} connected`);

    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleWebSocketMessage(connection, playerId, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    connection.socket.on('close', () => {
      console.log(`Player ${playerId} disconnected`);
      handlePlayerDisconnect(playerId);
    });
  });

  function handleWebSocketMessage(connection, playerId, data) {
    const { type, payload } = data;

    switch (type) {
      case 'CREATE_AI_GAME':
        handleCreateAIGame(connection, playerId, payload);
        break;

      case 'JOIN_MATCHMAKING':
        handleJoinMatchmaking(connection, playerId, payload);
        break;

      case 'GAME_INPUT':
        handleGameInput(connection, playerId, payload);
        break;

      case 'JOIN_TOURNAMENT':
        handleJoinTournament(connection, playerId, payload);
        break;

      default:
        console.log('Unknown message type:', type);
    }
  }

  function handleCreateAIGame(connection, playerId, payload) {
    const { gameId, game } = fastify.gameManager.createGame('ai', [playerId, 'ai']);

    // Oyuncuya game ID gönder
    connection.socket.send(JSON.stringify({
      type: 'GAME_CREATED',
      payload: { gameId, gameType: 'ai' }
    }));

    // Oyunu başlat
    game.start();

    // GameState broadcast callback'ini ayarla
    game.broadcastGameState = (gameId, gameState) => {
      connection.socket.send(JSON.stringify({
        type: 'GAME_STATE',
        payload: { gameId, gameState }
      }));
    };
  }

  function handleJoinMatchmaking(connection, playerId, payload) {
    const { rating = 1200 } = payload;

    fastify.matchmaker.addToQueue(playerId, rating, (matchData) => {
      // Match bulunduğunda
      const { gameId, game } = fastify.gameManager.createGame('multiplayer', matchData.players);

      // Tüm oyunculara bildir
      matchData.players.forEach(pid => {
        // Her oyuncuya kendi connection'ı üzerinden bildir
        connection.socket.send(JSON.stringify({
          type: 'MATCH_FOUND',
          payload: { gameId, players: matchData.players }
        }));
      });

      game.start();
    });

    connection.socket.send(JSON.stringify({
      type: 'JOINED_QUEUE',
      payload: { message: 'Matchmaking queue joined' }
    }));
  }

  function handleGameInput(connection, playerId, payload) {
    const { gameId, input } = payload;
    fastify.gameManager.handlePlayerInput(gameId, playerId, input);
  }

  function handleJoinTournament(connection, playerId, payload) {
    const { tournamentId } = payload;
    // Tournament logic burada implement edilecek
    console.log(`Player ${playerId} joining tournament ${tournamentId}`);
  }

  function handlePlayerDisconnect(playerId) {
    // Oyuncunun aktif oyunlarını temizle
    // Matchmaking queue'dan çıkar
    console.log(`Cleaning up for player ${playerId}`);
  }
}

module.exports = websocketRoutes;

// ===== 6. MATCHMAKING SERVICE =====
// src/services/matchmaking/matchmaker.js
class Matchmaker {
  constructor() {
    this.queue = [];
    this.matchingInterval = null;
    this.startMatching();
  }

  addToQueue(playerId, rating, callback) {
    const player = {
      playerId,
      rating,
      timestamp: Date.now(),
      callback
    };

    this.queue.push(player);
    console.log(`Player ${playerId} added to matchmaking queue (Rating: ${rating})`);
  }

  removeFromQueue(playerId) {
    this.queue = this.queue.filter(p => p.playerId !== playerId);
  }

  startMatching() {
    this.matchingInterval = setInterval(() => {
      this.tryMatch();
    }, 2000); // Her 2 saniyede match dene
  }

  tryMatch() {
    if (this.queue.length < 2) return;

    // Basit matching algoritması: rating farkı 200'den az olanları eşleştir
    for (let i = 0; i < this.queue.length - 1; i++) {
      for (let j = i + 1; j < this.queue.length; j++) {
        const player1 = this.queue[i];
        const player2 = this.queue[j];

        const ratingDiff = Math.abs(player1.rating - player2.rating);
        const waitTime = Date.now() - Math.min(player1.timestamp, player2.timestamp);

        // Rating farkı 200'den az veya 30 saniye beklediyse eşleştir
        if (ratingDiff < 200 || waitTime > 30000) {
          this.createMatch([player1, player2]);
          return;
        }
      }
    }
  }

  createMatch(players) {
    // Oyuncuları kuyruktan çıkar
    players.forEach(player => {
      this.removeFromQueue(player.playerId);
    });

    // Match verilerini hazırla
    const matchData = {
      players: players.map(p => p.playerId),
      averageRating: players.reduce((sum, p) => sum + p.rating, 0) / players.length
    };

    // Her oyuncunun callback'ini çağır
    players.forEach(player => {
      if (player.callback) {
        player.callback(matchData);
      }
    });

    console.log(`Match created between players: ${matchData.players.join(', ')}`);
  }
}

module.exports = Matchmaker;

// ===== 7. PACKAGE.JSON =====
/*
{
  "name": "pong-server",
  "version": "1.0.0",
  "description": "Multiplayer Pong Game Server",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "jest"
  },
  "dependencies": {
    "fastify": "^4.24.3",
    "@fastify/websocket": "^8.3.1",
    "@fastify/cors": "^8.4.0",
    "@fastify/static": "^6.12.0",
    "ws": "^8.14.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0"
  }
}
*/
