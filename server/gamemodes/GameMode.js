/**
 * Base GameMode class - Tüm oyun modlarının temel sınıfı
 */
class GameMode
{
	constructor(gameId, gameManager)
	{
		this.gameId = gameId;
		this.gameManager = gameManager;
		this.players = new Map(); // playerId -> Player
		this.status = 'waiting'; // 'waiting', 'playing', 'finished'
		this.maxPlayers = 2; // Her modda farklı olabilir
	}

	// Her alt sınıfta override edilmeli
	addPlayer(player)
	{
		throw new Error('addPlayer method must be implemented');
	}

	removePlayer(playerId)
	{
		this.players.delete(playerId);
		this.onPlayerRemoved(playerId);
	}

	start()
	{
		if (this.canStart())
		{
			this.status = 'playing';
			this.onGameStart();
		}
	}

	stop()
	{
		this.status = 'finished';
		this.onGameEnd();
	}

	update(deltaTime)
	{
		// Her modda farklı update logic'i olabilir
		throw new Error('update method must be implemented');
	}

	canStart()
	{
		return this.players.size >= this.maxPlayers;
	}

	getGameState()
	{
		throw new Error('getGameState method must be implemented');
	}

	// Event callbacks - alt sınıflarda override edilebilir
	onPlayerAdded(player) {}
	onPlayerRemoved(playerId) {}
	onGameStart() {}
	onGameEnd() {}
}

export default GameMode;
