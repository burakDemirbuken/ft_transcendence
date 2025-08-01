// ============= BASE GAME ENGINE =============
class BaseGameEngine {
    constructor(gameId, gameSettings)
	{
        this.gameId = gameId;
        this.settings = gameSettings;
        this.ball = null;
        this.paddles = new Map(); // positionKey -> Paddle
        this.score = {};
        this.status = 'waiting'; // waiting, playing, paused, finished
        this.lastUpdate = Date.now();
    }

    initializeBall() {
        this.ball = new Ball(
            this.settings.canvas.width / 2,
            this.settings.canvas.height / 2,
            this.settings.ball.radius,
            this.settings.ball.speed,
            this.settings.canvas
        );
    }

    createPaddle(position, playerId) {
        const paddleSettings = this.settings.paddles[position];
        const paddle = new Paddle(
            paddleSettings.x,
            paddleSettings.y,
            paddleSettings.width,
            paddleSettings.height,
            this.settings.canvas
        );
        this.paddles.set(position, { paddle, playerId });
        return paddle;
    }

    update(deltaTime) {
        if (this.status !== 'playing') return;

        // Update paddles
        for (const { paddle } of this.paddles.values()) {
            paddle.update(deltaTime);
        }

        // Update ball and check collisions
        this.ball.update(deltaTime);
        this.checkCollisions();
        this.checkGoals();
    }

    checkCollisions() {
        for (const { paddle } of this.paddles.values()) {
            if (this.ball.isCollidingWith(paddle)) {
                this.handleBallPaddleCollision(paddle);
            }
        }
    }

    checkGoals() {
        const ballX = this.ball.position.x;
        const canvasWidth = this.settings.canvas.width;

        if (ballX <= 0) {
            this.handleGoal('right');
        } else if (ballX >= canvasWidth) {
            this.handleGoal('left');
        }
    }

    handleGoal(scoringSide) {
        this.emit('goal', { side: scoringSide, gameId: this.gameId });
        this.ball.reset();
    }

    handleBallPaddleCollision(paddle) {
        // Ball collision logic
        this.ball.directionX *= -1;
        // Add spin based on paddle movement, etc.
    }

    getGameState() {
        return {
            gameId: this.gameId,
            status: this.status,
            ball: this.ball ? this.ball.getState() : null,
            paddles: this.getPaddleStates(),
            score: this.score,
            timestamp: Date.now()
        };
    }

    getPaddleStates() {
        const states = {};
        for (const [position, { paddle, playerId }] of this.paddles) {
            states[position] = {
                ...paddle.getState(),
                playerId
            };
        }
        return states;
    }
}

// ============= GAME MODE IMPLEMENTATIONS =============

class LocalGame extends BaseGameEngine {
    constructor(gameId, gameSettings) {
        super(gameId, gameSettings);
        this.localPlayers = new Map(); // playerId -> controls
        this.initialize();
    }

    initialize() {
        this.initializeBall();

        // Local game her zaman left-right 1v1
        this.createPaddle('left', 'player1');
        this.createPaddle('right', 'player2');

        this.score = { player1: 0, player2: 0 };
    }

    addLocalPlayer(playerId, controls) {
        this.localPlayers.set(playerId, controls);
        if (this.localPlayers.size === 2) {
            this.start();
        }
    }

    processInput(playerId, input) {
        // Local game'de her iki oyuncu da aynı client'tan geliyor
        const paddleEntry = Array.from(this.paddles.values())
            .find(entry => entry.playerId === playerId);

        if (paddleEntry) {
            paddleEntry.paddle.up = input.up;
            paddleEntry.paddle.down = input.down;
        }
    }

    start() {
        this.status = 'playing';
        this.emit('gameStarted', { gameId: this.gameId });
    }
}

class MultiplayerGame extends BaseGameEngine {
    constructor(gameId, gameSettings, gameMode = '1v1') {
        super(gameId, gameSettings);
        this.gameMode = gameMode; // '1v1', '2v2'
        this.players = new Map(); // playerId -> playerInfo
        this.teams = { team1: [], team2: [] };
        this.maxPlayers = gameMode === '2v2' ? 4 : 2;
        this.initialize();
    }

    initialize() {
        this.initializeBall();
        this.setupPaddlePositions();
        this.initializeScore();
    }

    setupPaddlePositions() {
        if (this.gameMode === '1v1') {
            // Standard left-right setup
            this.paddlePositions = ['left', 'right'];
        } else if (this.gameMode === '2v2') {
            // 2v2: team1 (left, top), team2 (right, bottom)
            this.paddlePositions = ['left', 'top', 'right', 'bottom'];
        }
    }

    initializeScore() {
        if (this.gameMode === '1v1') {
            this.score = { team1: 0, team2: 0 };
        } else {
            this.score = { team1: 0, team2: 0 };
        }
    }

    addPlayer(playerInfo) {
        if (this.players.size >= this.maxPlayers) {
            throw new Error('Game is full');
        }

        this.players.set(playerInfo.id, playerInfo);
        this.assignPlayerToTeamAndPosition(playerInfo);

        if (this.players.size === this.maxPlayers) {
            this.start();
        }

        this.emit('playerJoined', {
            playerId: playerInfo.id,
            gameId: this.gameId,
            playersCount: this.players.size
        });
    }

    assignPlayerToTeamAndPosition(playerInfo) {
        const team = this.teams.team1.length <= this.teams.team2.length ? 'team1' : 'team2';
        this.teams[team].push(playerInfo.id);

        // Position assignment based on team and game mode
        let position;
        if (this.gameMode === '1v1') {
            position = team === 'team1' ? 'left' : 'right';
        } else { // 2v2
            const teamSize = this.teams[team].length;
            if (team === 'team1') {
                position = teamSize === 1 ? 'left' : 'top';
            } else {
                position = teamSize === 1 ? 'right' : 'bottom';
            }
        }

        this.createPaddle(position, playerInfo.id);
    }

    processPlayerInput(playerId, input) {
        const paddleEntry = Array.from(this.paddles.values())
            .find(entry => entry.playerId === playerId);

        if (paddleEntry) {
            paddleEntry.paddle.up = input.up;
            paddleEntry.paddle.down = input.down;
        }

        // Multiplayer'da input'u diğer oyunculara da gönder
        this.emit('playerInput', {
            playerId,
            input,
            gameId: this.gameId
        });
    }

    start() {
        this.status = 'playing';
        this.emit('gameStarted', { gameId: this.gameId, gameMode: this.gameMode });
    }
}

class AIGame extends BaseGameEngine {
    constructor(gameId, gameSettings, aiDifficulty = 'medium') {
        super(gameId, gameSettings);
        this.aiDifficulty = aiDifficulty;
        this.humanPlayerId = null;
        this.aiPlayerId = 'ai-player';
        this.initialize();
    }

    initialize() {
        this.initializeBall();
        this.score = { human: 0, ai: 0 };
    }

    addHumanPlayer(playerInfo) {
        if (this.humanPlayerId) {
            throw new Error('AI game already has a human player');
        }

        this.humanPlayerId = playerInfo.id;
        this.createPaddle('left', playerInfo.id);
        this.createPaddle('right', this.aiPlayerId);
        this.start();
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.updateAI();
    }

    updateAI() {
        const aiPaddle = this.paddles.get('right').paddle;
        const ballY = this.ball.position.y;
        const paddleCenterY = aiPaddle.position.y + aiPaddle.size.height / 2;

        // Simple AI logic (can be enhanced)
        const threshold = 10;
        if (ballY < paddleCenterY - threshold) {
            aiPaddle.up = true;
            aiPaddle.down = false;
        } else if (ballY > paddleCenterY + threshold) {
            aiPaddle.up = false;
            aiPaddle.down = true;
        } else {
            aiPaddle.up = false;
            aiPaddle.down = false;
        }
    }

    processPlayerInput(playerId, input) {
        if (playerId === this.humanPlayerId) {
            const paddleEntry = this.paddles.get('left');
            if (paddleEntry) {
                paddleEntry.paddle.up = input.up;
                paddleEntry.paddle.down = input.down;
            }
        }
    }

    start() {
        this.status = 'playing';
        this.emit('gameStarted', { gameId: this.gameId, mode: 'AI' });
    }
}

// ============= TOURNAMENT SYSTEM =============
class Tournament {
    constructor(tournamentId, settings) {
        this.tournamentId = tournamentId;
        this.settings = settings;
        this.participants = [];
        this.games = new Map(); // gameId -> Game instance
        this.bracket = [];
        this.currentRound = 0;
        this.status = 'waiting'; // waiting, active, finished
        this.eventCallbacks = new Map();
    }

    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event).forEach(callback => callback(data));
        }
    }

    addParticipant(playerInfo) {
        if (this.status !== 'waiting') {
            throw new Error('Tournament already started');
        }
        this.participants.push(playerInfo);

        if (this.participants.length >= this.settings.minPlayers) {
            this.generateBracket();
            this.start();
        }
    }

    generateBracket() {
        // Tournament bracket generation logic
        const shuffled = [...this.participants].sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffled.length; i += 2) {
            if (shuffled[i + 1]) {
                this.bracket.push({
                    player1: shuffled[i],
                    player2: shuffled[i + 1],
                    round: 0,
                    status: 'pending'
                });
            }
        }
    }

    start() {
        this.status = 'active';
        this.startRoundGames();
        this.emit('tournamentStarted', { tournamentId: this.tournamentId });
    }

    startRoundGames() {
        const roundMatches = this.bracket.filter(match =>
            match.round === this.currentRound && match.status === 'pending'
        );

        for (const match of roundMatches) {
            const gameId = `${this.tournamentId}-r${this.currentRound}-${Date.now()}`;
            const game = new MultiplayerGame(gameId, this.settings.gameSettings);

            game.on('gameFinished', (result) => {
                this.handleGameFinished(match, result);
            });

            game.addPlayer(match.player1);
            game.addPlayer(match.player2);

            this.games.set(gameId, game);
            match.gameId = gameId;
            match.status = 'playing';
        }
    }

    handleGameFinished(match, result) {
        match.status = 'finished';
        match.winner = result.winner;

        // Check if round is complete
        const roundMatches = this.bracket.filter(match => match.round === this.currentRound);
        const finishedCount = roundMatches.filter(match => match.status === 'finished').length;

        if (finishedCount === roundMatches.length) {
            this.advanceToNextRound();
        }

        this.emit('matchFinished', {
            tournamentId: this.tournamentId,
            match,
            result
        });
    }

    advanceToNextRound() {
        const currentRoundMatches = this.bracket.filter(match =>
            match.round === this.currentRound && match.status === 'finished'
        );

        if (currentRoundMatches.length === 1) {
            // Tournament finished
            this.status = 'finished';
            this.emit('tournamentFinished', {
                tournamentId: this.tournamentId,
                winner: currentRoundMatches[0].winner
            });
            return;
        }

        // Create next round matches
        this.currentRound++;
        for (let i = 0; i < currentRoundMatches.length; i += 2) {
            if (currentRoundMatches[i + 1]) {
                this.bracket.push({
                    player1: currentRoundMatches[i].winner,
                    player2: currentRoundMatches[i + 1].winner,
                    round: this.currentRound,
                    status: 'pending'
                });
            }
        }

        this.startRoundGames();
    }

    getAllGameStates() {
        const gameStates = {};
        for (const [gameId, game] of this.games) {
            gameStates[gameId] = game.getGameState();
        }
        return gameStates;
    }

    getTournamentState() {
        return {
            tournamentId: this.tournamentId,
            status: this.status,
            currentRound: this.currentRound,
            bracket: this.bracket,
            participants: this.participants,
            activeGames: this.getAllGameStates()
        };
    }
}

// ============= GAME MANAGER =============
class GameManager {
    constructor() {
        this.games = new Map();
        this.tournaments = new Map();
        this.gameSettings = this.getDefaultGameSettings();
    }

    getDefaultGameSettings() {
        return {
            canvas: { width: 800, height: 400 },
            ball: { radius: 10, speed: 300 },
            paddles: {
                left: { x: 20, y: 200, width: 15, height: 80 },
                right: { x: 765, y: 200, width: 15, height: 80 },
                top: { x: 400, y: 20, width: 80, height: 15 },
                bottom: { x: 400, y: 365, width: 80, height: 15 }
            }
        };
    }

    createLocalGame() {
        const gameId = `local-${Date.now()}`;
        const game = new LocalGame(gameId, this.gameSettings);
        this.games.set(gameId, game);
        return game;
    }

    createMultiplayerGame(gameMode = '1v1') {
        const gameId = `mp-${gameMode}-${Date.now()}`;
        const game = new MultiplayerGame(gameId, this.gameSettings, gameMode);
        this.games.set(gameId, game);
        return game;
    }

    createAIGame(difficulty = 'medium') {
        const gameId = `ai-${difficulty}-${Date.now()}`;
        const game = new AIGame(gameId, this.gameSettings, difficulty);
        this.games.set(gameId, game);
        return game;
    }

    createTournament(settings) {
        const tournamentId = `tournament-${Date.now()}`;
        const tournament = new Tournament(tournamentId, {
            ...settings,
            gameSettings: this.gameSettings
        });
        this.tournaments.set(tournamentId, tournament);
        return tournament;
    }

    getGame(gameId) {
        return this.games.get(gameId);
    }

    getTournament(tournamentId) {
        return this.tournaments.get(tournamentId);
    }

    updateAllGames(deltaTime) {
        for (const game of this.games.values()) {
            game.update(deltaTime);
        }

        for (const tournament of this.tournaments.values()) {
            for (const game of tournament.games.values()) {
                game.update(deltaTime);
            }
        }
    }

    getAllActiveGameStates() {
        const states = {};

        // Regular games
        for (const [gameId, game] of this.games) {
            if (game.status === 'playing') {
                states[gameId] = game.getGameState();
            }
        }

        // Tournament games
        for (const tournament of this.tournaments.values()) {
            const tournamentStates = tournament.getAllGameStates();
            Object.assign(states, tournamentStates);
        }

        return states;
    }
}

export { GameManager, LocalGame, MultiplayerGame, AIGame, Tournament };
