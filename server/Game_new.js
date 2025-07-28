import Ball from './Ball.js';
import Paddle from './Paddle.js';

class Game
{
	constructor()
	{
		this.players = new Map(); // playerId -> Player instance
		this.playerPaddles = new Map(); // playerId -> Paddle instance
		this.ball = new Ball();
		this.status = 'waiting';
		this.isRunning = false;
		this.score = { team1: 0, team2: 0 };
	}

	addPlayer(player)
	{
		if (this.players.size >= 2)
			throw new Error('Game already has two players');

		// Player'ı kaydet
		this.players.set(player.id, player);

		// Paddle oluştur ve ata (ilk player sol, ikinci sağ)
		const position = this.players.size === 1 ? 'left' : 'right';
		const paddle = new Paddle(position);
		this.playerPaddles.set(player.id, paddle);

		console.log(`👤 Player ${player.id} added as ${position} player`);

		if (this.players.size === 2)
		{
			this.start();
			console.log('🚀 Game started with two players');
		}
	}

	start()
	{
		if (this.isRunning || this.players.size !== 2)
			return;

		this.isRunning = true;
		this.status = 'running';
	}

	stop()
	{
		if (!this.isRunning)
			return;
		this.isRunning = false;
		this.status = 'finished';
	}

	update(deltaTime)
	{
		if (!this.isRunning || this.players.size !== 2)
			return;

		// Her player'ın input'larını paddle'lara aktar
		for (const [playerId, player] of this.players.entries())
		{
			const paddle = this.playerPaddles.get(playerId);
			if (paddle)
			{
				this.processPlayerInput(player, paddle);
			}
		}

		// Paddle'ları güncelle
		for (const paddle of this.playerPaddles.values())
		{
			paddle.update(deltaTime);
		}

		// Ball'ı güncelle (paddle'larla collision için)
		const paddleArray = Array.from(this.playerPaddles.values());
		this.ball.update(deltaTime, paddleArray);
	}

	processPlayerInput(player, paddle)
	{
		// Player'ın Map'indeki input'ları kontrol et
		const upPressed = player.inputs.get('up') || false;
		const downPressed = player.inputs.get('down') || false;

		// Paddle'a input'ları aktar
		paddle.up(upPressed);
		paddle.down(downPressed);
	}

	getState()
	{
		const playerStates = [];

		for (const [playerId, player] of this.players.entries())
		{
			const paddle = this.playerPaddles.get(playerId);
			playerStates.push({
				id: player.id,
				name: player.name,
				score: this.getPlayerScore(playerId),
				paddle: {
					x: paddle.x,
					y: paddle.y,
					width: paddle.width,
					height: paddle.height
				}
			});
		}

		return {
			status: this.status,
			players: playerStates,
			ball: {
				x: this.ball.x,
				y: this.ball.y,
				radius: this.ball.width / 2 // radius hesapla
			},
			score: this.score
		};
	}

	getPlayerScore(playerId)
	{
		// İlk player team1, ikinci player team2
		const playerArray = Array.from(this.players.keys());
		const playerIndex = playerArray.indexOf(playerId);
		return playerIndex === 0 ? this.score.team1 : this.score.team2;
	}
}

export default Game;
