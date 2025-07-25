const TICK_RATE = 1000 / 60; // 60 FPS

class GameEngine
{
	constructor(webSocketManager = null)
	{
		this.games = new Map();
		this.updateInterval = null;
		this.wsManager = webSocketManager; // WebSocket manager referansı
	}

	// Game ekleme
	addGame(gameId, game)
	{
		this.games.set(gameId, game);
		console.log(`🎮 Game ${gameId} added to engine`);
	}

	// Game kaldırma
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

	update()
	{
		for (const [gameId, game] of this.games.entries())
		{
			if (game.isRunning)
			{
				game.update();

				// Game state'i client'lara broadcast et
				if (this.wsManager)
				{
					const gameState = game.getBroadcastState();
					this.wsManager.broadcast(gameState);
				}
			}
		}
	}
}
