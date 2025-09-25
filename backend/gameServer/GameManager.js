import PingPong from './PingPong/PingPong.js';
import LocalPingPong from './PingPong/LocalPingPong.js';
import AiPingPong from './PingPong/AiPingPong.js';
import AiNetwork from './network/AiNetworkManager.js';


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
		AiNetwork.on('game_initialized',
			(data) =>
			{
				console.log('🤖 AI Game initialized:', data);
				for (const [gameId, game] of this.games.entries())
				{
					if (data.game_id === gameId)
					{
						game.status = 'waiting';
						console.log(`🤖 AI Game ${gameId} initialized and set to waiting`);
						break;
					}
				}
			}
		);
	}

	uniqueGameId()
	{
		do {
			var id = Date.now();
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
					this.removeGame(gameId);
				return;
			}
		}
	}

	handleGameMessage(action, payload, player)
	{
		switch (action)
		{
			case 'playerAction':
				player.inputSet(payload.key, payload.action);
				break;
			default:
				throw new Error(`Unhandled game message type: ${message.type}`);
		}
	}

	createGame(gameMode, properties ,aiSettings = {})
	{
		const gameId = this.uniqueGameId();
		properties.id = gameId;
		properties.aiSettings = aiSettings;
		let game;
		if (gameMode === 'local')
			game = new LocalPingPong(properties);
		else if (gameMode === 'classic')
			game = new PingPong(properties);
		else if (gameMode === 'ai')
			game = new AiPingPong(properties);
		else
			throw new Error(`Unsupported game mode: ${gameMode}`);
		game.initializeGame();
		game.on('gameFinished', (results, players) => this.emit(`game${gameId}_Ended`, results, players));
		this.games.set(gameId, game);
		return gameId;
	}

	addPlayerToGame(gameId, player)
	{
		if (!this.games.has(gameId))
			throw new Error(`Game with ID ${gameId} does not exist`);
		const game = this.games.get(gameId);
		game.addPlayer(player);
		console.log(`👤 Player ${player.id} added to game ${gameId}`);
	}

	gameStart(gameId)
	{
		const game = this.games.get(gameId);
		if (!game)
			throw new Error(`Game with ID ${gameId} does not exist`);
		game.start();
		console.log(`▶️ Game ${gameId} started`);
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
