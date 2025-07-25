import Ball from './Ball.js';
import Paddle from './Paddle.js';

class Game
{
	constructor()
	{
		this.players = new Set();
		this.paddles = [new Paddle(1), new Paddle(2)];
		this.ball = new Ball();
		this.status = 'waiting'; // 'waiting', 'running', 'finished'
		this.isRunning = false;
		this.score = { team1: 0, team2: 0 };
	}

	addPlayer(player)
	{
		if (this.players.size >= 2)
			throw new Error('Game already has two players');
		this.players.add(player);
		console.log(`👤 Player ${player.id} added to game`);
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
	}

	update(deltaTime)
	{
		if (this.players.size !== 2 || !this.isRunning)
			return;
		this.ball.update(deltaTime, this.players);
		this.players.forEach(player => player.update(deltaTime));
	}

	getState()
	{
		const player1State = {
			id: this.players[0].id,
			name: this.players[0].name,
			position: this.paddles[0].getPosition(),
		}
		const player2State = {
			id: this.players[1].id,
			name: this.players[1].name,
			position: this.paddles[1].getPosition(),
		}
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
