import Ball from './Ball.js';
import Paddle from './Paddle.js';

//! TODOO:  Paddle ve Player ayır.
/*
const exampleGameState =
{
	currentState: 'waiting', // 'waiting', 'playing', 'finished'
	gameData:
	{
		players:
		[
			{
				id: 'player1',
				name: 'Player 1',
				position:
				{
					x: 0,
					y: 0
				},
				direction: "up", // "up", "down", "stop"
			},
			{
				id: 'player2',
				name: 'Player 2',
				position:
				{
					x: 0,
					y: 0
				},
				direction: "up", // "up", "down", "stop"
			}
		],
		ball:
		{
			position:
			{
				x: 0,
				y: 0
			},
			direction:
			{
				x: 1,
				y: 1
			},
			radius: 10,
			speed: 5
		},
		score: { player1: 0, player2: 0 },
	}
}
*/

class Game
{
	constructor()
	{
		this.players = []; // Player instance
		this.playerPaddles = new Map(); // playerId -> Paddle instance
		this.ball = new Ball();
		this.status = 'waiting';
		this.isRunning = false;
		this.score = { team1: 0, team2: 0 };
	}

	addPlayer(player)
	{
		if (this.players.length >= 2)
			throw new Error('Game already has two players');

		// Player'ı kaydet
		this.players.push(player);

		// Paddle oluştur ve ata (ilk player sol, ikinci sağ)
		const position = this.players.length === 1 ? 'left' : 'right';
		const paddle = new Paddle(position);
		this.playerPaddles.set(player.id, paddle);

		console.log(`👤 Player ${player.id} added as ${position} player`);

		if (this.players.length === 2)
		{
			this.start();
			console.log('🚀 Game started with two players');
		}
	}

	start()
	{
		if (this.isRunning || this.players.length !== 2)
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
		if (!this.isRunning || this.players.length !== 2)
			return;

		// Her player'ın input'larını paddle'lara aktar
		for (const player of this.players)
		{
			const paddle = this.playerPaddles.get(player.id);
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
		paddle.up = upPressed;
		paddle.down = downPressed;
	}

	getState()
	{
		const playerStates = [];

		for (const player of this.players)
		{
			playerStates.push({
				id: player.id,
				name: player.name,
				score: this.getPlayerScore(player.id),
				position: this.playerPaddles.get(player.id).getPosition()
			});
		}
		return {
			currentState: this.status, // 'waiting', 'running', 'finished'
			gameData:
			{
				status: this.status,
				players: playerStates,
				ball: this.ball.getState(),
				score: this.score
			}
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
