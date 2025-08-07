import PingPong from './PingPong/PingPong.js';

const TICK_RATE = 1000 / 60; // 30 FPS

const DEFAULT_GAME_PROPERTIES = {
	width: 800,
	height: 600,

	paddleWidth: 10,
	paddleHeight: 100,
	paddleSpeed: 700,

	ballRadius: 7,
	ballSpeed: 800,
	ballSpeedIncrease: 100,

	maxPlayers: 2,

	maxScore: 11
}

class GameManager
{
	constructor()
	{
		this.games = new Map();
		this.gameMode
		this.updateInterval = null;
		this.lastUpdateTime = Date.now();
	}

	createCustomMatch(property)
	{

	}

	addPlayerToGame(gameId, player)
	{
		if (!this.games.has(gameId))
		{
			const game = new PingPong({...DEFAULT_GAME_PROPERTIES});

			this.games.set(gameId, game);
			console.log(`🆕 Game ${gameId} created`);
		}
		const game = this.games.get(gameId);
		game.addPlayer(player);
		console.log(`👤 Player ${player.id} added to game ${gameId}`);
		if (game.isFull())
		{
			console.log(`🚀 Starting game ${gameId} with players ${Array.from(game.players.values()).map(p => p.id).join(", ")}`);
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
			if (game.hasPlayer(player))
				return game;
		}
		return null;
	}

	getPlayerGameId(player)
	{
		for (const [gameId, game] of this.games.entries())
		{
			if (game.hasPlayer(player))
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
			if (game.isRunning())
			{
				game.update(deltaTime);
				callback(game.getGameState(), game.players);
			}
		}
	}
}

export default GameManager;
