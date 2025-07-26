import Ball from './Ball.js';
import Paddle from './Paddle.js';

class Game
{
	constructor()
	{
		this.playerPaddles = new Map();
		this.ball = new Ball();
		this.status = 'waiting'; // 'waiting', 'running', 'finished'
		this.isRunning = false;
		this.score = { team1: 0, team2: 0 };
	}

	addPlayer(player)
	{
		if (this.playerPaddles.size >= 2)
			throw new Error('Game already has two players');
		this.playerPaddles.set(player.id, new Paddle(this.playerPaddles.size === 0 ? 'left' : 'right'));
		console.log(`👤 Player ${player.id} added to game`);
		if (this.playerPaddles.size === 2)
		{
			this.start();
			console.log('🚀 Game started with two players');
		}
	}

	input(playerId, action)
	{
		const paddle = this.playerPaddles.get(playerId);
		if (!paddle)
			throw new Error(`Paddle for player ${playerId} not found`);
		if (action === 'up')
			paddle.up(true);
		else if (action === 'down')
			paddle.down(true);
	}

	start()
	{
		if (this.isRunning || this.playerPaddles.size !== 2)
			return;

		this.isRunning = true;
		this.status = 'running';
	}

	stop()
	{
		if (!this.isRunning)
			return;
		this.isRunning = false;
	}

	update(deltaTime)
	{
		if (this.playerPaddles.size !== 2 || !this.isRunning)
			return;
		this.ball.update(deltaTime);
		this.playerPaddles.forEach(paddle => paddle.update(deltaTime));
	}

	getState()
	{
		const ballState = {
			position: this.ball.getPosition(),
			radius: this.ball.radius,
			speed: this.ball.speed,
		}

		return {
			currentState: this.status,
			gameData: {
				players: [player1State, player2State],
				ball: ballState,
				score: this.score,
			}
		}
	}
}

export default Game;
