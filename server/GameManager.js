import PingPong from './PingPong/PingPong.js';
import LocalPingPong from './PingPong/LocalPingPong.js';
import { TICK_RATE, DEFAULT_GAME_PROPERTIES } from './utils/constants.js';

class GameManager
{
	constructor()
	{
		this.games = new Map();
		this.gameMode = null; 
		this.updateInterval = null;
		this.lastUpdateTime = Date.now();
	}

	createCustomMatch(property)
	{

	}

	createGame(gameMode, gameId, properties = {})
	{
		if (this.games.has(gameId))
			throw new Error(`Game with ID ${gameId} already exists`);
		let game;
		const gameProperties = {...DEFAULT_GAME_PROPERTIES, gameMode: gameMode, ...properties};
		if (gameMode === 'local')
			game = new LocalPingPong(gameProperties);
		else
			game = new PingPong(gameProperties);
		this.games.set(gameId, game);
		game.initializeGame();
		console.log(`🆕 Game ${gameId} created with mode: ${gameMode}`);
		return game;
	}

	addPlayerToGame(gameMode, gameId, player)
	{
		if (!this.games.has(gameId))
			throw new Error(`Game with ID ${gameId} does not exist`);
		const game = this.games.get(gameId);
		game.addPlayer(player);
		console.log(`👤 Player ${player.id} added to game ${gameId}`);
		if (game.isFull())
		{
			console.log(`🚀 Starting game ${gameId} with players ${game.players.map(p => p.id).join(", ")}`);
			game.start();
		}
	}

	removeGame(gameId)
	{
		if (this.games.has(gameId))
		{
			const game = this.games.get(gameId);
			game.stop();
			this.games.delete(gameId);
			console.log(`🗑️ Game ${gameId} removed from engine`);
		}
	}

	resetGame(gameId)
	{
		if (this.games.has(gameId))
		{
			const game = this.games.get(gameId);
			game.resetGame();
			console.log(`🔄 Game ${gameId} reset`);
		}
	}

	getPlayerGame(player)
	{
		for (const [gameId, game] of this.games.entries())
		{
			if (game.hasPlayer(player.id))
				return game;
		}
		return null;
	}

	getPlayerGameId(playerId)
	{
		for (const [gameId, game] of this.games.entries())
		{
			if (game.hasPlayer(playerId))
				return gameId;
		}
		return null;
	}

	start(callback)
	{
		this.updateInterval = setInterval(() => this.update(callback), TICK_RATE);
	}

	stop()
	{
		if (this.updateInterval)
		{
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
	}

	pause(gameId)
	{
		if (this.games.has(gameId))
		{
			const game = this.games.get(gameId);
			if (game.status === 'playing')
				game.pause();
			else if (game.status === 'paused')
				game.resume();
		}
	}

	update(callback)
	{
		const currentTime = Date.now();
		const deltaTime = currentTime - this.lastUpdateTime;
		this.lastUpdateTime = currentTime;
		for (const [gameId, game] of this.games.entries())
		{
			if (game.players.length === 0)
			{
				this.removeGame(gameId);
				continue;
			}
			if (game.isRunning())
			{
				game.update(deltaTime);
				callback(game.getGameState(), game.players);
			}
		}
	}

	hasGame(gameId)
	{
		return this.games.has(gameId);
	}
}

export default GameManager;
