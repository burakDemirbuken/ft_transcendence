import EventEmitter from '../utils/EventEmitter.js';
import Ball from './Objects/Ball.js';
import Paddle from './Objects/Paddle.js';
import Collision2D from "./utils/Collision2D.js";
import { DEFAULT_GAME_PROPERTIES, PADDLE_SPACE } from '../utils/constants.js';

class PingPong extends EventEmitter
{
	constructor(property = {})
	{
		super();
		this.status = 'not initialized'; // 'waiting', 'playing', 'paused', 'finished', 'not initialized'
		this.gameMode = property.gameMode; // 'local', 'online', 'tournament', 'ai'

		this.lastUpdateTime = 0;
		this.startTime = 0;
		this.finishTime = 0;
		this.gameTime = 0;
		this.id = property.id || null;

		this.settings = {
			...DEFAULT_GAME_PROPERTIES,
			...property.gameSettings
		};

		console.log(`🎮 PingPong game created with mode: ${JSON.stringify(this.settings, null, 2)}`);

		this.ball = null;
		this.paddles = new Map(); // playerId -> Paddle instance
		this.players = []; // Player instances

		this.team = new Map(); // number -> { playersId: [], score: 0 }
		this.lastGoal = null;
	}

	addPlayer(player)
	{
		console.log(`👤 Player ${player.id} added to game`);
		if (this.players.length < this.settings.maxPlayers)
		{
			this.players.push(player);
			this.paddles.set(player.id, this.createPaddle(this.players.length));
			if (!this.team.has(this.players.length % 2 ? 1 : 2))
				this.team.set(this.players.length % 2 ? 1 : 2, { playersId: [], score: 0 });
			this.team.get(this.players.length % 2 ? 1 : 2).playersId.push(player.id);
		}
	}

	removePlayer(playerId)
	{
		const playerIndex = this.players.findIndex(p => p.id === playerId);
		if (playerIndex !== -1)
		{
			this.players.splice(playerIndex, 1);
			this.paddles.delete(playerId);
			for (const [teamNumber, teamInfo] of this.team.entries())
			{
				const index = teamInfo.playersId.indexOf(playerId);
				if (index !== -1)
				{
					teamInfo.playersId.splice(index, 1);
					if (teamInfo.playersId.length === 0)
						this.team.delete(teamNumber);
					break;
				}
			}
		}
		else
		{
			console.warn(`⚠️ Player ${playerId} not found in game`);
		}
	}

	createPaddle(number)
	{
		let paddlePos = { x: 0, y: this.settings.canvasHeight / 2 - this.settings.paddleHeight / 2 };
		if (number === 1)
			paddlePos.x = this.settings.canvasWidth - this.settings.paddleWidth - PADDLE_SPACE;
		else if (number === 2)
			paddlePos.x = PADDLE_SPACE;
		else if (number === 3)
			paddlePos.x = 200;
		else if (number === 4)
			paddlePos.x = this.settings.canvasWidth - this.settings.paddleWidth - 200;
		return new Paddle(
			paddlePos.x,
			paddlePos.y,
			this.settings.paddleWidth,
			this.settings.paddleHeight,
			this.settings.paddleSpeed,
			{width: this.settings.canvasWidth, height: this.settings.canvasHeight}
		);
	}

	initializeGame()
	{
		this.ball = new Ball(
			this.settings.canvasWidth / 2,
			this.settings.canvasHeight / 2,
			this.settings.ballRadius,
			this.settings.ballSpeed,
			{width: this.settings.canvasWidth, height: this.settings.canvasHeight}
		);
		this.ball.launchBall({x: Math.random() < 0.5 ? -1 : 1, y: Math.random() - 0.5});
		this.eventListeners();
		if (this.gameMode !== 'ai')
			this.status = 'waiting';
	}

	eventListeners()
	{
		this.ball.on('borderHit',
			(border) =>
			{
				if (this.checkCollisions() != null)
					return;
				if (border === 'left' || border === 'right')
				{
					if (border === 'right')
					{
						this.lastGoal = 'right';
						this.team.get(1).score++;
					}
					else
					{
						this.lastGoal = 'left';
						this.team.get(2).score++;
					}
					this.emit('goal', border);
					this.ball.reset();
					const interval = setInterval(() =>
					{
						this.ball.launchBall({x: border == "left" ? -1 : 1, y: Math.random() - 0.5});
						clearInterval(interval);
					}, 500);
				}
				else if (border === 'top')
				{
					this.ball.revertPosition();
					this.ball.launchBall({x: this.ball.direction.x, y: Math.abs(this.ball.direction.y)});
				}
				else if (border === 'bottom')
				{
					this.ball.revertPosition();
					this.ball.launchBall({x: this.ball.direction.x, y: -Math.abs(this.ball.direction.y)});
				}
			}
		);
	}

	paddleControls()
	{
		for (const player of this.players)
		{
			const paddle = this.paddles.get(player.id);
			if (paddle)
			{
				paddle.up = player.inputGet('w') || player.inputGet('ArrowUp');
				paddle.down = player.inputGet('s') || player.inputGet('ArrowDown');
			}
		}
	}

	update(deltaTime)
	{
		if (this.status === 'paused')
			return;

		if (this.status !== 'playing')
			return new Error('Game is not currently playing: ' + this.status);

		this.gameTime += deltaTime;
		this.lastUpdateTime = Date.now();

		this.paddleControls();

		this.paddles.forEach((paddle) => paddle.update(deltaTime));

		this.ball.update(deltaTime);
		this.checkCollisions();

		this.finishedControls();
		this.emit('gameStateUpdate', this.getGameState());

	}

	finishedControls()
	{
		if (this.isFinished())
			return;
		if (this.team.get(1).score >= this.settings.maxScore || this.team.get(2).score >= this.settings.maxScore)
		{
			this.status = 'finished';
			this.finishTime = Date.now();
			this.emit('gameFinished',
				{
					players: this.players.map(p => p.id),
					results:
					{
						team1:
						{
							score: this.team.get(1).score,
							playersId: this.team.get(1).playersId
						},
						team2:
						{
							score: this.team.get(2).score,
							playersId: this.team.get(2).playersId
						},
						winner: "team"+this.team.get(1).score > this.team.get(2).score ? 1 : 2,
						time:
						{
							start: this.startTime,
							finish: this.finishTime,
							duration: this.gameTime
						},
						matchType: this.gameMode,

					}

				}
			);
			console.log(`🏁 Game finished! Final Score - Left: ${this.team.get(1).score}, Right: ${this.team.get(2).score}`);
		}
	}


	isFinished()
	{
		return this.status === 'finished';
	}

	checkCollisions()
	{
		if (!this.ball)
		{
			console.warn('⚠️ Ball is null in checkCollisions');
			return;
		}


		this.paddles.forEach(
			(paddle) =>
			{
				const collisionDetails = Collision2D.trajectoryRectangleToRectangle(this.ball, paddle, true);
				if (collisionDetails && collisionDetails.colliding)
				{
					const side = collisionDetails.side;
					this.separateBallFromPaddle(this.ball, paddle, side);
					if (side === "top" || side === "bottom")
						this.ball.launchBall({x: this.ball.direction.x, y: -this.ball.direction.y});
					else if (side === "left" || side === "right")
						this.adjustBallAngle(paddle);
					return collisionDetails.colliding;
				}
			}
		);
		return null;
	}

	adjustBallAngle(paddle)
	{
		const relativeIntersectY = (paddle.pos.y + paddle.height / 2) - this.ball.pos.y + this.ball.height / 2;
		const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.height / 2);
		this.ball.launchBall({x: -this.ball.direction.x, y: -normalizedRelativeIntersectionY},
										this.ball.defaultSpeed + this.settings.ballSpeedIncrease * Math.abs(normalizedRelativeIntersectionY));
	}

	separateBallFromPaddle(ball, paddle, side)
	{
		let newX = ball.pos.x;
		let newY = ball.pos.y;

		if (side === 'left' || side === 'right')
		{
			if (ball.direction.x < 0)
				newX = paddle.pos.x + paddle.width + 1;
			else
				newX = paddle.pos.x - ball.width - 1;
		}
		else if (side === 'top')
			newY = paddle.pos.y - ball.height - 1;
		else if (side === 'bottom')
			newY = paddle.pos.y + paddle.height + 1;
		ball.setSafePosition(newX, newY);
	}

	start()
	{
		this.startTime = Date.now();
		if (this.settings.maxPlayers && this.players.length < this.settings.maxPlayers)
			return new Error(`Not enough players to start the game. Required: ${this.settings.maxPlayers}, Current: ${this.players.length}`);

		if (this.status === 'not initialized')
		{
			this.initializeGame();
		}
		console.log('▶️ Starting game...');
		this.status = 'countdown';
		const interval = setInterval(() =>
		{
			this.status = 'playing';
			clearInterval(interval);
		}, 1000);
	}

	pause()
	{
		this.status = 'paused';
		console.log(`⏸️ Game paused`);
	}

	resume()
	{
		this.status = 'playing';
		console.log(`▶️ Game resumed`);
	}

	stop()
	{
		this.status = 'stopped';
		console.log(`⏸️ Game stopped`);
	}

	resetGame()
	{
		console.log('🔄 Resetting game state...');
		this.score = {
			left: 0,
			right: 0
		};
		this.status = 'not initialized';
		this.ball = null;
		for (const paddle of this.paddles.values())
			paddle.reset();
		this.gameTime = 0;
		this.lastUpdateTime = 0;
		this.start();
	}

	isRunning()
	{
		return this.status === 'playing' || this.status === 'countdown';
	}

	getGameState()
	{
		const playerStates = [];

		for (const player of this.players)
		{
			playerStates.push({
				id: player.id,
				name: player.name,
				...this.paddles.get(player.id).getState(),
			});
		}
		return {
			currentState: this.status, // 'waiting', 'running', 'finished'
			gameData:
			{
				players: playerStates,
				ball: {
					...this.ball.getState(),
				},
				score: {
					left: this.team.get(1).score,
					right: this.team.get(2).score
				},
			}
		};
	}

	hasPlayer(playerId)
	{
		return this.players.some(p => p.id === playerId);
	}

	isFull()
	{
		return this.players.length === this.settings.maxPlayers;
	}

	getWinner()
	{
		if (!this.isFinished())
			return null;
	}

	getLoser()
	{
		if (!this.isFinished())
			return null;
	}

	getScore()
	{
		if (this.status !== 'not initialized')
			return {
				left: "-",
				right: "-"
			};
		return {
			left: this.team.get(1).score,
			right: this.team.get(2).score
		};
	}

	dispose()
	{
		this.ball = null;
		this.paddles.clear();
		this.players = [];
		this.status = 'not initialized';
		this.gameTime = 0;
		this.lastUpdateTime = 0;
		console.log('🗑️ Game disposed');
	}
}

export default PingPong;
