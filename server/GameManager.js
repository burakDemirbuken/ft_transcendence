import PingPong from './PingPong/PingPong.js';
import LocalPingPong from './PingPong/LocalPingPong.js';
import { TICK_RATE, DEFAULT_GAME_PROPERTIES } from './utils/constants.js';
import EventEmitter from './utils/EventEmitter.js';

class GameManager extends EventEmitter
{
	constructor()
	{
		super();
		this.games = new Map();
		this.updateInterval = null;
		this.lastUpdateTime = Date.now();
	}

	uniqueGameId()
	{
		do {
			var id = 'game_' + Date.now();
		} while (this.games.has(id));
		return id;
	}

	removePlayerFromGame(playerId)
	{
		for (const [gameId, game] of this.games.entries())
		{
			if (game.hasPlayer(playerId))
			{
				game.removePlayer(playerId);
				console.log(`👤 Player ${playerId} removed from game ${gameId}`);
				if (game.players.length === 0)
				{
					this.removeGame(gameId);
				}
				return;
			}
		}
	}

	handleGameMessage(action, payload, player)
	{
		switch (action)
		{
			case 'playerAction':
				player.inputsSet(payload.key, payload.action);
				break;
			default:
				throw new Error(`Unhandled game message type: ${message.type}`);
		}
	}

	createGame(gameMode, properties)
	{
		const gameId = this.uniqueGameId();
		let game;
		if (gameMode === 'local')
			game = new LocalPingPong(properties);
		else if (gameMode === 'classic')
			game = new PingPong(properties);
		else
			throw new Error(`Unsupported game mode: ${gameMode}`);

		this.games.set(gameId, game);
		game.initializeGame();
		console.log(`🆕 Game ${gameId} created with mode: ${properties.gameMode}`);
		return gameId;
	}

	addPlayerToGame(gameId, player)
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

	start()
	{
		this.updateInterval = setInterval(() => this.update(), TICK_RATE);
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

	update()
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
				this.emit(`game${gameId}_StateUpdate`, {gameState: game.getGameState(), players: game.players.map(p => p.id)});
			}
		}
	}

	hasGame(gameId)
	{
		return this.games.has(gameId);
	}
}

export default GameManager;
