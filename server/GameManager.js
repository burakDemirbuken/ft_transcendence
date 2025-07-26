import Game from './Game.js';

const TICK_RATE = 1000 / 60; // 60 FPS

class GameManager
{
	constructor()
	{
		this.games = new Map();
		this.updateInterval = null;
		this.lastUpdateTime = Date.now();
	}

	addPlayerToGame(gameId, player)
	{
		console.log(`Adding player ${player.id} to game ${gameId}`);
		if (!this.games.has(gameId))
		{
			const game = new Game();
			this.games.set(gameId, game);
			console.log(`🆕 Game ${gameId} created`);
		}
		const game = this.games.get(gameId);
		game.addPlayer(player);
		console.log(`👤 Player ${player.id} added to game ${gameId}`);
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
				callback(game.getState(), game.players);
			}
		}
	}
}

export default GameManager;
