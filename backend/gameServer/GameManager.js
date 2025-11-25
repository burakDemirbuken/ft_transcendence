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
				for (const [gameId, game] of this.games.entries())
				{
					if (data.game_id === gameId)
					{
						game.status = 'waiting';
						break;
					}
				}
			}
		);
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
			default:
				throw new Error(`Unhandled game message type: ${message.type}`);
		}
	}

	registerPlayerToGame(gameId, playerId)
	{
		const game = this.getGame(gameId);
		game.addRegisteredPlayer(playerId);
	}

	async createGame(id, gameMode, properties, players)
	{
		const gameId = id;
		let game;
		if (gameMode === 'local')
			game = new LocalPingPong(properties);
		else if (gameMode === 'classic')
			game = new PingPong(properties);
		else if (gameMode === 'ai')
			game = new AiPingPong(properties);
		else if (gameMode === 'multiplayer')
		{
			game = new PingPong(properties);
			game.gameMode = 'multiplayer';
			game.maxPlayers = 4;
		}
		else
			throw new Error(`Unsupported game mode: ${gameMode}`);
		game.id = gameId;
		game.initializeGame();
		players.forEach(player => game.addRegisteredPlayer(player));
		game.on('finished', (
			{results, players}) =>
			{
				setTimeout(() => this.emit(`game${gameId}`, {type: 'finished', payload: results, players: players}), 3000);
			}
		);
		game.on('update', ({gameState, players}) => this.emit(`game${gameId}`, {type: 'update', payload: gameState, players: players}));
		this.games.set(gameId, game);
		return gameId;
	}

	getGame(gameId)
	{
		if (!this.games.has(gameId))
			throw new Error(`Game with ID ${gameId} does not exist`);
		return this.games.get(gameId);
	}

	addPlayerToGame(gameId, player)
	{
		const game = this.getGame(gameId);
		game.addPlayer(player);
	}

	gameStart(gameId)
	{
		const game = this.getGame(gameId);
		game.start();
		console.log(`▶️ Game ${gameId} started`);
	}

	removeGame(gameId)
	{
		const game = this.getGame(gameId);
		this.games.delete(gameId);
		console.log(`🗑️ Game ${gameId} removed from engine`);
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

	update()
	{
		const currentTime = Date.now();
		const deltaTime = currentTime - this.lastUpdateTime;
		this.lastUpdateTime = currentTime;
		for (const [gameId, game] of this.games.entries())
		{
			if (game.status === 'ready to start')
				this.gameStart(gameId);
			game.update(deltaTime);
		}
	}

	hasGame(gameId)
	{
		return this.games.has(gameId);
	}
}

export default GameManager;
