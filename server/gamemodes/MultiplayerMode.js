import GameMode from './GameMode.js';
import Ball from '../PıngPong/Ball.js';
import Paddle from '../Paddle.js';

/**
 * MultiplayerMode - 4 oyunculu (2v2) Pong
 */
class MultiplayerMode extends GameMode
{
	constructor(gameId, gameManager)
	{
		super(gameId, gameManager);
		this.maxPlayers = 4;
		this.teams = {
			team1: [], // Sol taraf
			team2: []  // Sağ taraf
		};
		this.ball = new Ball();
		this.paddles = new Map(); // playerId -> Paddle
		this.score = { team1: 0, team2: 0 };
		this.isRunning = false;
	}

	addPlayer(player)
	{
		if (this.players.size >= this.maxPlayers)
		{
			throw new Error('Multiplayer mode is full (4 players max)');
		}

		this.players.set(player.id, player);

		// Takımlara dağıt
		if (this.teams.team1.length < 2)
		{
			this.teams.team1.push(player);
			// 2 sol paddle: üst ve alt
			const isUpperPaddle = this.teams.team1.length === 1;
			const paddle = new Paddle('left', isUpperPaddle);
			this.paddles.set(player.id, paddle);
		}
		else
		{
			this.teams.team2.push(player);
			// 2 sağ paddle: üst ve alt
			const isUpperPaddle = this.teams.team2.length === 1;
			const paddle = new Paddle('right', isUpperPaddle);
			this.paddles.set(player.id, paddle);
		}

		console.log(`🎮 Player ${player.id} joined Multiplayer Mode (${this.players.size}/${this.maxPlayers})`);
		console.log(`👥 Teams: Team1(${this.teams.team1.length}) vs Team2(${this.teams.team2.length})`);

		if (this.canStart())
		{
			this.start();
		}

		return this;
	}

	update(deltaTime)
	{
		if (!this.isRunning || this.players.size !== 4)
			return;

		// Tüm paddle'ları güncelle
		for (const [playerId, paddle] of this.paddles.entries())
		{
			const player = this.players.get(playerId);
			if (player)
			{
				this.processPlayerInput(player, paddle);
				paddle.update(deltaTime);
			}
		}

		// Ball'ı güncelle
		const paddleArray = Array.from(this.paddles.values());
		const goalResult = this.ball.update(deltaTime, paddleArray);

		if (goalResult)
		{
			this.handleGoal(goalResult);
		}
	}

	processPlayerInput(player, paddle)
	{
		const upPressed = player.inputs.get('up') || false;
		const downPressed = player.inputs.get('down') || false;

		paddle.up = upPressed;
		paddle.down = downPressed;
	}

	handleGoal(goalResult)
	{
		if (goalResult === 'goal-left')
		{
			this.score.team2++; // Sağ takım gol attı
			console.log(`🎯 Team 2 scores! Score: ${this.score.team1}-${this.score.team2}`);
		}
		else if (goalResult === 'goal-right')
		{
			this.score.team1++; // Sol takım gol attı
			console.log(`🎯 Team 1 scores! Score: ${this.score.team1}-${this.score.team2}`);
		}

		if (this.score.team1 >= 5 || this.score.team2 >= 5)
		{
			this.stop();
			console.log('🏆 Multiplayer Game Over!');
		}
	}

	getGameState()
	{
		const playerStates = [];

		for (const [playerId, player] of this.players.entries())
		{
			const paddle = this.paddles.get(playerId);
			const team = this.teams.team1.includes(player) ? 'team1' : 'team2';

			playerStates.push({
				id: player.id,
				name: player.name,
				team: team,
				score: this.score[team],
				position: paddle ? paddle.getPosition() : { x: 0, y: 0 }
			});
		}

		return {
			mode: 'multiplayer',
			gameId: this.gameId,
			status: this.status,
			isRunning: this.isRunning,
			players: this.players.size,
			maxPlayers: this.maxPlayers,
			gameData: {
				status: this.status,
				players: playerStates,
				ball: this.ball.getState(),
				score: this.score,
				teams: {
					team1: this.teams.team1.map(p => ({ id: p.id, name: p.name })),
					team2: this.teams.team2.map(p => ({ id: p.id, name: p.name }))
				}
			}
		};
	}

	onGameStart()
	{
		this.isRunning = true;
		console.log(`🚀 Multiplayer Mode started: ${this.gameId}`);
		console.log(`👥 Team 1: ${this.teams.team1.map(p => p.name).join(', ')}`);
		console.log(`👥 Team 2: ${this.teams.team2.map(p => p.name).join(', ')}`);
	}

	onGameEnd()
	{
		this.isRunning = false;
		console.log(`🏁 Multiplayer Mode ended: ${this.gameId}`);
	}
}

export default MultiplayerMode;
