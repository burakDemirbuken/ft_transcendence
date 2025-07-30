import GameMode from './GameMode.js';
import Game from '../Game.js';

/**
 * ClassicMode - Geleneksel 2 oyunculu Pong
 */
class ClassicMode extends GameMode
{
	constructor(gameId, gameManager)
	{
		super(gameId, gameManager);
		this.maxPlayers = 2;
		this.game = new Game();
	}

	addPlayer(player)
	{
		if (this.players.size >= this.maxPlayers)
		{
			throw new Error('Classic mode is full (2 players max)');
		}

		this.players.set(player.id, player);
		this.game.addPlayer(player);
		
		console.log(`🎮 Player ${player.id} joined Classic Mode (${this.players.size}/${this.maxPlayers})`);
		
		if (this.canStart())
		{
			this.start();
		}

		return this;
	}

	update(deltaTime)
	{
		if (this.status === 'playing')
		{
			this.game.update(deltaTime);
		}
	}

	getGameState()
	{
		return {
			mode: 'classic',
			gameId: this.gameId,
			status: this.status,
			players: this.players.size,
			maxPlayers: this.maxPlayers,
			gameData: this.game.getState()
		};
	}

	onGameStart()
	{
		console.log(`🚀 Classic Mode started: ${this.gameId}`);
	}

	onGameEnd()
	{
		console.log(`🏁 Classic Mode ended: ${this.gameId}`);
	}
}

export default ClassicMode;
