import Game from './Game.js';
import ClassicMode from './gamemodes/ClassicMode.js';
import MultiplayerMode from './gamemodes/MultiplayerMode.js';
import TournamentMode from './gamemodes/TournamentMode.js';
import AIMode from './gamemodes/AIMode.js';

const TICK_RATE = 1000 / 60; // 60 FPS

class EnhancedGameManager
{
	constructor()
	{
		this.games = new Map(); // gameId -> GameMode instance
		this.updateInterval = null;
		this.lastUpdateTime = Date.now();
		this.gameCounter = 0;
		this.playerGameMap = new Map(); // playerId -> gameId
	}

	// Farklı oyun modları oluşturma
	createGame(mode, options = {})
	{
		const gameId = this.generateGameId(mode);
		let game;

		switch(mode)
		{
			case 'classic':
				game = new ClassicMode(gameId, this);
				break;
			case 'multiplayer':
				game = new MultiplayerMode(gameId, this);
				break;
			case 'tournament':
				game = new TournamentMode(gameId, this);
				break;
			case 'ai':
				const difficulty = options.difficulty || 'medium';
				game = new AIMode(gameId, this, difficulty);
				break;
			default:
				throw new Error(`Unknown game mode: ${mode}`);
		}

		this.games.set(gameId, game);
		console.log(`🎮 ${mode.toUpperCase()} game created: ${gameId}`);
		return game;
	}

	generateGameId(mode)
	{
		this.gameCounter++;
		return `${mode}_${Date.now()}_${this.gameCounter}`;
	}

	// Oyuncuyu belirtilen moda ekle
	joinGame(mode, player, options = {})
	{
		// Mevcut bekleyen oyun var mı?
		const waitingGame = this.findWaitingGame(mode);
		
		let game;
		if (waitingGame)
		{
			game = waitingGame;
			console.log(`👤 Player ${player.id} joining existing ${mode} game: ${game.gameId}`);
		}
		else
		{
			// Yeni oyun oluştur
			game = this.createGame(mode, options);
			console.log(`👤 Player ${player.id} creating new ${mode} game: ${game.gameId}`);
		}

		game.addPlayer(player);
		this.playerGameMap.set(player.id, game.gameId);
		return game;
	}

	findWaitingGame(mode)
	{
		for (const [gameId, game] of this.games.entries())
		{
			// Mode type check
			let isCorrectMode = false;
			switch(mode)
			{
				case 'classic':
					isCorrectMode = game instanceof ClassicMode;
					break;
				case 'multiplayer':
					isCorrectMode = game instanceof MultiplayerMode;
					break;
				case 'tournament':
					isCorrectMode = game instanceof TournamentMode;
					break;
				case 'ai':
					isCorrectMode = game instanceof AIMode;
					break;
			}

			if (isCorrectMode &&
			    game.status === 'waiting' &&
			    game.players.size < game.maxPlayers)
			{
				return game;
			}
		}
		return null;
	}

	// Oyuncuyu oyundan çıkar
	removePlayer(playerId)
	{
		const gameId = this.playerGameMap.get(playerId);
		if (gameId && this.games.has(gameId))
		{
			const game = this.games.get(gameId);
			game.removePlayer(playerId);
			this.playerGameMap.delete(playerId);

			// Oyun boşaldıysa kaldır
			if (game.players.size === 0)
			{
				this.removeGame(gameId);
			}

			console.log(`👤 Player ${playerId} removed from game ${gameId}`);
		}
	}

	removeGame(gameId)
	{
		if (this.games.has(gameId))
		{
			const game = this.games.get(gameId);
			game.stop();
			this.games.delete(gameId);
			console.log(`🗑️ Game ${gameId} removed`);
		}
	}

	// Legacy method - geriye uyumluluk için
	addPlayerToGame(gameId, player)
	{
		// Classic mode olarak treat et
		return this.joinGame('classic', player);
	}

	start(callback)
	{
		this.gameCallback = callback;
		this.updateInterval = setInterval(() => this.update(), TICK_RATE);
		console.log('🚀 Enhanced GameManager started');
	}

	stop()
	{
		if (this.updateInterval)
		{
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
		console.log('⏹️ Enhanced GameManager stopped');
	}

	update()
	{
		const currentTime = Date.now();
		const deltaTime = currentTime - this.lastUpdateTime;
		this.lastUpdateTime = currentTime;

		for (const [gameId, game] of this.games.entries())
		{
			try
			{
				game.update(deltaTime);

				// Callback ile state'i gönder
				if (this.gameCallback && (game.status === 'playing' || game.status === 'finished'))
				{
					const gameState = game.getGameState();
					const players = Array.from(game.players.values());
					this.gameCallback(gameState, players);
				}

				// Bitmiş oyunları temizle
				if (game.status === 'finished')
				{
					setTimeout(() => {
						this.removeGame(gameId);
					}, 5000); // 5 saniye sonra temizle
				}
			}
			catch (error)
			{
				console.error(`❌ Error updating game ${gameId}:`, error);
			}
		}
	}

	// Debug ve stats
	getStats()
	{
		const stats = {
			totalGames: this.games.size,
			activePlayers: this.playerGameMap.size,
			gamesByMode: {}
		};

		for (const [gameId, game] of this.games.entries())
		{
			const mode = game.constructor.name.replace('Mode', '').toLowerCase();
			if (!stats.gamesByMode[mode])
			{
				stats.gamesByMode[mode] = 0;
			}
			stats.gamesByMode[mode]++;
		}

		return stats;
	}

	getGameForPlayer(playerId)
	{
		const gameId = this.playerGameMap.get(playerId);
		return gameId ? this.games.get(gameId) : null;
	}

	getAllGames()
	{
		return Array.from(this.games.values()).map(game => ({
			id: game.gameId,
			mode: game.constructor.name.replace('Mode', '').toLowerCase(),
			status: game.status,
			players: game.players.size,
			maxPlayers: game.maxPlayers
		}));
	}
}

export default EnhancedGameManager;
