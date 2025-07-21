const fastify = require('fastify')({ logger: true });
const WebSocket = require('ws');

// =====================================
// CONFIG & CONSTANTS
// =====================================
const CONFIG = {
    PORT: process.env.PORT || 3000,
    WS_PORT: process.env.WS_PORT || 8080,
    GAME: {
        CANVAS_WIDTH: 800,
        CANVAS_HEIGHT: 600,
        PADDLE_WIDTH: 20,
        PADDLE_HEIGHT: 100,
        BALL_SIZE: 10,
        PADDLE_SPEED: 300,
        BALL_SPEED: 200,
        PADDLE_MARGIN: 30
    },
    TICK_RATE: 1000 / 60 // 60 FPS
};

// =====================================
// MODELS
// =====================================
class Player {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.score = 0;
        this.isReady = false;
        this.inputs = new Set();
    }

    update(deltaTime) {
        if (this.inputs.has('ArrowUp') || this.inputs.has('KeyW')) {
            this.y = Math.max(0, this.y - CONFIG.GAME.PADDLE_SPEED * deltaTime);
        }
        if (this.inputs.has('ArrowDown') || this.inputs.has('KeyS')) {
            this.y = Math.min(
                CONFIG.GAME.CANVAS_HEIGHT - CONFIG.GAME.PADDLE_HEIGHT,
                this.y + CONFIG.GAME.PADDLE_SPEED * deltaTime
            );
        }
    }

    addInput(key) {
        this.inputs.add(key);
    }

    removeInput(key) {
        this.inputs.delete(key);
    }

    reset() {
        this.score = 0;
        this.isReady = false;
        this.inputs.clear();
    }
}

class Ball {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = CONFIG.GAME.CANVAS_WIDTH / 2;
        this.y = CONFIG.GAME.CANVAS_HEIGHT / 2;
        this.vx = (Math.random() > 0.5 ? 1 : -1) * CONFIG.GAME.BALL_SPEED;
        this.vy = (Math.random() - 0.5) * CONFIG.GAME.BALL_SPEED;
    }

    update(deltaTime, players) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Top and bottom wall collision
        if (this.y <= 0 || this.y >= CONFIG.GAME.CANVAS_HEIGHT - CONFIG.GAME.BALL_SIZE) {
            this.vy = -this.vy;
            this.y = Math.max(0, Math.min(CONFIG.GAME.CANVAS_HEIGHT - CONFIG.GAME.BALL_SIZE, this.y));
        }

        // Paddle collision
        for (const player of players) {
            if (this.checkPaddleCollision(player)) {
                this.vx = -this.vx;
                // Add some angle based on where it hits the paddle
                const hitPos = (this.y - player.y) / CONFIG.GAME.PADDLE_HEIGHT;
                this.vy = (hitPos - 0.5) * CONFIG.GAME.BALL_SPEED;
                break;
            }
        }

        // Score detection
        if (this.x < 0) {
            return 'right'; // Right player scores
        }
        if (this.x > CONFIG.GAME.CANVAS_WIDTH) {
            return 'left'; // Left player scores
        }

        return null;
    }

    checkPaddleCollision(player) {
        return (
            this.x < player.x + CONFIG.GAME.PADDLE_WIDTH &&
            this.x + CONFIG.GAME.BALL_SIZE > player.x &&
            this.y < player.y + CONFIG.GAME.PADDLE_HEIGHT &&
            this.y + CONFIG.GAME.BALL_SIZE > player.y
        );
    }
}

class GameState {
    constructor() {
        this.players = [];
        this.ball = new Ball();
        this.status = 'waiting'; // waiting, playing, paused, finished
        this.maxPlayers = 2;
        this.lastUpdate = Date.now();
    }

    addPlayer(playerId) {
        if (this.players.length >= this.maxPlayers) {
            return false;
        }

        const x = this.players.length === 0
            ? CONFIG.GAME.PADDLE_MARGIN
            : CONFIG.GAME.CANVAS_WIDTH - CONFIG.GAME.PADDLE_MARGIN - CONFIG.GAME.PADDLE_WIDTH;

        const y = (CONFIG.GAME.CANVAS_HEIGHT - CONFIG.GAME.PADDLE_HEIGHT) / 2;

        const player = new Player(playerId, x, y);
        this.players.push(player);

        if (this.players.length === this.maxPlayers) {
            this.status = 'ready';
        }

        return true;
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        if (this.players.length < this.maxPlayers) {
            this.status = 'waiting';
        }
    }

    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }

    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        if (this.status !== 'playing') {
            return;
        }

        // Update players
        this.players.forEach(player => player.update(deltaTime));

        // Update ball
        const scoreResult = this.ball.update(deltaTime, this.players);

        if (scoreResult) {
            if (scoreResult === 'left') {
                this.players[0].score++;
            } else {
                this.players[1].score++;
            }

            this.ball.reset();

            // Check for game end
            if (Math.max(...this.players.map(p => p.score)) >= 5) {
                this.status = 'finished';
            }
        }
    }

    getClientState() {
        return {
            players: this.players.map(p => ({
                id: p.id,
                x: p.x,
                y: p.y,
                score: p.score
            })),
            ball: {
                x: this.ball.x,
                y: this.ball.y
            },
            status: this.status,
            canvas: {
                width: CONFIG.GAME.CANVAS_WIDTH,
                height: CONFIG.GAME.CANVAS_HEIGHT
            }
        };
    }

    reset() {
        this.players.forEach(player => player.reset());
        this.ball.reset();
        this.status = this.players.length === this.maxPlayers ? 'ready' : 'waiting';
    }
}

// =====================================
// GAME ENGINE
// =====================================
class GameEngine {
    constructor() {
        this.games = new Map(); // gameId -> GameState
        this.players = new Map(); // playerId -> { gameId, ws }
        this.gameIdCounter = 0;
        this.updateInterval = null;
    }

    start() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, CONFIG.TICK_RATE);
        console.log('Game Engine started');
    }

    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('Game Engine stopped');
    }

    createGame() {
        const gameId = `game_${++this.gameIdCounter}`;
        const gameState = new GameState();
        this.games.set(gameId, gameState);
        console.log(`Game created: ${gameId}`);
        return gameId;
    }

    joinGame(playerId, ws) {
        // Find available game or create new one
        let gameId = null;
        let gameState = null;

        for (const [id, state] of this.games) {
            if (state.players.length < state.maxPlayers) {
                gameId = id;
                gameState = state;
                break;
            }
        }

        if (!gameState) {
            gameId = this.createGame();
            gameState = this.games.get(gameId);
        }

        // Add player to game
        if (gameState.addPlayer(playerId)) {
            this.players.set(playerId, { gameId, ws });
            console.log(`Player ${playerId} joined game ${gameId}`);

            // Notify all players in the game
            this.broadcastToGame(gameId, {
                type: 'playerJoined',
                playerId,
                gameState: gameState.getClientState()
            });

            return gameId;
        }

        return null;
    }

    leaveGame(playerId) {
        const playerData = this.players.get(playerId);
        if (!playerData) return;

        const { gameId } = playerData;
        const gameState = this.games.get(gameId);

        if (gameState) {
            gameState.removePlayer(playerId);

            // If no players left, remove game
            if (gameState.players.length === 0) {
                this.games.delete(gameId);
                console.log(`Game ${gameId} removed - no players left`);
            } else {
                // Notify remaining players
                this.broadcastToGame(gameId, {
                    type: 'playerLeft',
                    playerId,
                    gameState: gameState.getClientState()
                });
            }
        }

        this.players.delete(playerId);
        console.log(`Player ${playerId} left game ${gameId}`);
    }

    handlePlayerInput(playerId, inputData) {
        const playerData = this.players.get(playerId);
        if (!playerData) return;

        const gameState = this.games.get(playerData.gameId);
        if (!gameState) return;

        const player = gameState.getPlayer(playerId);
        if (!player) return;

        if (inputData.type === 'keydown') {
            player.addInput(inputData.key);
        } else if (inputData.type === 'keyup') {
            player.removeInput(inputData.key);
        }
    }

    startGame(gameId) {
        const gameState = this.games.get(gameId);
        if (gameState && gameState.status === 'ready') {
            gameState.status = 'playing';
            gameState.lastUpdate = Date.now();

            this.broadcastToGame(gameId, {
                type: 'gameStarted',
                gameState: gameState.getClientState()
            });
        }
    }

    resetGame(gameId) {
        const gameState = this.games.get(gameId);
        if (gameState) {
            gameState.reset();

            this.broadcastToGame(gameId, {
                type: 'gameReset',
                gameState: gameState.getClientState()
            });
        }
    }

    update() {
        for (const [gameId, gameState] of this.games) {
            if (gameState.status === 'playing') {
                gameState.update();

                // Broadcast updated state to all players in the game
                this.broadcastToGame(gameId, {
                    type: 'gameUpdate',
                    gameState: gameState.getClientState()
                });
            }
        }
    }

    broadcastToGame(gameId, message) {
        const gameState = this.games.get(gameId);
        if (!gameState) return;

        for (const player of gameState.players) {
            const playerData = this.players.get(player.id);
            if (playerData && playerData.ws.readyState === WebSocket.OPEN) {
                playerData.ws.send(JSON.stringify(message));
            }
        }
    }

    getGameState(gameId) {
        const gameState = this.games.get(gameId);
        return gameState ? gameState.getClientState() : null;
    }
}

// =====================================
// WEBSOCKET MANAGER
// =====================================
class WebSocketManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.wss = null;
        this.clients = new Map(); // ws -> playerId
    }

    start() {
        this.wss = new WebSocket.Server({ port: CONFIG.WS_PORT });

        this.wss.on('connection', (ws) => {
            console.log('New WebSocket connection');

            ws.on('message', (data) => {
                this.handleMessage(ws, data);
            });

            ws.on('close', () => {
                this.handleDisconnection(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        console.log(`WebSocket server started on port ${CONFIG.WS_PORT}`);
    }

    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'join':
                    this.handleJoin(ws, message);
                    break;
                case 'input':
                    this.handleInput(ws, message);
                    break;
                case 'startGame':
                    this.handleStartGame(ws, message);
                    break;
                case 'resetGame':
                    this.handleResetGame(ws, message);
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    handleJoin(ws, message) {
        const playerId = message.playerId || `player_${Date.now()}_${Math.random()}`;
        const gameId = this.gameEngine.joinGame(playerId, ws);

        if (gameId) {
            this.clients.set(ws, playerId);

            ws.send(JSON.stringify({
                type: 'joined',
                playerId,
                gameId,
                gameState: this.gameEngine.getGameState(gameId)
            }));
        } else {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Unable to join game'
            }));
        }
    }

    handleInput(ws, message) {
        const playerId = this.clients.get(ws);
        if (playerId) {
            this.gameEngine.handlePlayerInput(playerId, message.data);
        }
    }

    handleStartGame(ws, message) {
        const playerId = this.clients.get(ws);
        if (playerId) {
            const playerData = this.gameEngine.players.get(playerId);
            if (playerData) {
                this.gameEngine.startGame(playerData.gameId);
            }
        }
    }

    handleResetGame(ws, message) {
        const playerId = this.clients.get(ws);
        if (playerId) {
            const playerData = this.gameEngine.players.get(playerId);
            if (playerData) {
                this.gameEngine.resetGame(playerData.gameId);
            }
        }
    }

    handleDisconnection(ws) {
        const playerId = this.clients.get(ws);
        if (playerId) {
            this.gameEngine.leaveGame(playerId);
            this.clients.delete(ws);
            console.log(`Player ${playerId} disconnected`);
        }
    }

    stop() {
        if (this.wss) {
            this.wss.close();
            console.log('WebSocket server stopped');
        }
    }
}

// =====================================
// HTTP SERVER (API ROUTES)
// =====================================
class APIServer {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        fastify.get('/health', async (request, reply) => {
            return { status: 'OK', timestamp: new Date().toISOString() };
        });

        // Get server status
        fastify.get('/status', async (request, reply) => {
            return {
                games: this.gameEngine.games.size,
                players: this.gameEngine.players.size,
                config: CONFIG
            };
        });

        // Get specific game state
        fastify.get('/game/:gameId', async (request, reply) => {
            const { gameId } = request.params;
            const gameState = this.gameEngine.getGameState(gameId);

            if (gameState) {
                return { gameId, gameState };
            } else {
                reply.code(404);
                return { error: 'Game not found' };
            }
        });

        // Create new game
        fastify.post('/game', async (request, reply) => {
            const gameId = this.gameEngine.createGame();
            const gameState = this.gameEngine.getGameState(gameId);

            return { gameId, gameState };
        });

        // Serve static files (if needed)
        fastify.register(require('@fastify/static'), {
            root: require('path').join(__dirname, '../client'),
            prefix: '/static/'
        });
    }

    async start() {
        try {
            await fastify.listen({ port: CONFIG.PORT, host: '0.0.0.0' });
            console.log(`HTTP server started on port ${CONFIG.PORT}`);
        } catch (error) {
            console.error('Error starting HTTP server:', error);
            process.exit(1);
        }
    }

    async stop() {
        try {
            await fastify.close();
            console.log('HTTP server stopped');
        } catch (error) {
            console.error('Error stopping HTTP server:', error);
        }
    }
}

// =====================================
// MAIN SERVER CLASS
// =====================================
class GameServer {
    constructor() {
        this.gameEngine = new GameEngine();
        this.webSocketManager = new WebSocketManager(this.gameEngine);
        this.apiServer = new APIServer(this.gameEngine);
    }

    async start() {
        console.log('Starting Game Server...');

        // Start game engine
        this.gameEngine.start();

        // Start WebSocket server
        this.webSocketManager.start();

        // Start HTTP server
        await this.apiServer.start();

        console.log('Game Server fully started!');
        console.log(`HTTP API: http://localhost:${CONFIG.PORT}`);
        console.log(`WebSocket: ws://localhost:${CONFIG.WS_PORT}`);
    }

    async stop() {
        console.log('Stopping Game Server...');

        this.gameEngine.stop();
        this.webSocketManager.stop();
        await this.apiServer.stop();

        console.log('Game Server stopped!');
    }
}

// =====================================
// GRACEFUL SHUTDOWN
// =====================================
const server = new GameServer();

process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
});

// =====================================
// START SERVER
// =====================================
if (require.main === module) {
    server.start().catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = {
    GameServer,
    GameEngine,
    WebSocketManager,
    APIServer,
    Player,
    Ball,
    GameState,
    CONFIG
};
