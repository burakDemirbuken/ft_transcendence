import PingPong from './PingPong/PingPong.js';

const TICK_RATE = 1000 / 30; // 30 FPS

const DEFAULT_GAME_PROPERTIES = {
	width: 800,
	height: 600,
	paddleWidth: 10,
	paddleHeight: 100,
	ballRadius: 10,
	ballSpeed: 300,
	ballSpeedIncrease: 200,
	maxPlayers: 2,
	maxScore: 11
}

class GameManager
{
	constructor()
	{
		this.games = new Map();
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
			console.log(`🚀 Starting game ${gameId} with players`);
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

	update(callback)
	{
		const currentTime = Date.now();
		const deltaTime = currentTime - this.lastUpdateTime;
		this.lastUpdateTime = currentTime;
		for (const [gameId, game] of this.games.entries())
		{
			if (game.isRunning)
			{
				game.update(deltaTime);
				console.log(`⏱️ Game ${gameId} updated`);
				console.log(`Game state:`, game.getState());
				callback(game.getState(), game.players);
			}
		}
	}
}

export default GameManager;
