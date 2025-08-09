import EventEmitter from '../utils/EventEmitter.js';
import Ball from './Objects/Ball.js';
import Paddle from './Objects/Paddle.js';
import Collision2D from "./utils/Collision2D.js";

const DEFAULT_GAME_PROPERTIES = {
	canvasWidth: 800,
	canvasHeight: 600,

	paddleWidth: 10,
	paddleHeight: 100,
	paddleSpeed: 300,

	ball         : 3,
	ballSpeed: 300,
	ballSpeedIncrease: 200,

	maxScore: 11,

	maxPlayers: 2,
};

const PADDLE_SPACE = 20;

class PingPong extends EventEmitter
{
	constructor(property = {})
	{
		super();
		this.status = 'not initialized'; // 'waiting', 'playing', 'paused', 'finished', 'not initialized'
		this.gameMode = property.gameMode || 'online'; // 'local', 'online', 'tournament', 'ai'

		this.deltaTime = 0;
		this.lastUpdateTime = 0;
		this.gameTime = 0;

		this.settings = {
			...DEFAULT_GAME_PROPERTIES,
			...property
		};

		this.ball = null;
		this.paddles = new Map(); // playerId -> Paddle instance
		this.players = []; // Player instances

		this.score = {
			left: 0,
			right: 0
		};

		console.log(`🆕 Game created with settings: ${JSON.stringify(this.settings)}`);
	}

	addPlayer(player)
	{
		console.log(`👤 Player ${player.id} added to game`);
		if (this.players.length < this.settings.maxPlayers)
		{
			this.players.push(player);
			this.paddles.set(player.id, this.createPaddle(this.players.length));
		}
	}

	createPaddle(number)
	{
		console.log(`Creating paddle for player ${number}`);
		let paddlePos = { x: 0, y: this.settings.canvasHeight / 2 - this.settings.paddleHeight / 2 };
		if (number === 1)
			paddlePos.x = this.settings.canvasWidth - this.settings.paddleWidth - PADDLE_SPACE;
		else if (number === 2)
			paddlePos.x = PADDLE_SPACE;
		else if (number === 3)
			paddlePos.x = 200;
		else if (number === 4)
			paddlePos.x = this.settings.canvasWidth - this.settings.paddleWidth - 200;

		console.log(`Creating paddle at position: ${JSON.stringify(paddlePos)}`);
		return new Paddle(
			paddlePos.x,
			paddlePos.y,
			this.settings.paddleWidth,
			this.settings.paddleHeight,
			{width: this.settings.canvasWidth, height: this.settings.canvasHeight},
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
						this.score.right++;
					else
						this.score.left++;
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
					this.ball.launchBall({x: this.ball.directionX, y: Math.abs(this.ball.directionY)});
				}
				else if (border === 'bottom')
				{
					this.ball.revertPosition();
					this.ball.launchBall({x: this.ball.directionX, y: -Math.abs(this.ball.directionY)});
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
				paddle.up = player.inputsGet('w') || player.inputsGet('ArrowUp');
				paddle.down = player.inputsGet('s') || player.inputsGet('ArrowDown');
			}
		}
	}

	update(deltaTime)
	{
		if (this.status === 'paused')
			return;

		if (this.status !== 'playing')
			return new Error('Game is not currently playing: ' + this.status);

		this.deltaTime = deltaTime;
		this.gameTime += deltaTime;
		this.lastUpdateTime = Date.now();

		this.paddleControls();

		this.paddles.forEach((paddle) => paddle.update(deltaTime));

		this.ball.update(deltaTime);
		this.checkCollisions();

		this.isFinished();
		this.emit('gameStateUpdate', this.getGameState());

	}

	finishedControls()
	{
		if (this.status === 'finished')
			return;
		if (this.score.left >= this.settings.maxScore || this.score.right >= this.settings.maxScore)
		{
			this.status = 'finished';
			this.emit('gameFinished', this.getGameState());
			console.log(`🏁 Game finished! Final Score - Left: ${this.score.left}, Right: ${this.score.right}`);
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
						this.ball.launchBall({x: this.ball.directionX, y: -this.ball.directionY});
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
		const relativeIntersectY = (paddle.pos.y + paddle.height / 2) - this.ball.pos.y;
		const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.height / 2);
		this.ball.launchBall({x: -this.ball.directionX, y: -normalizedRelativeIntersectionY},
										this.ball.defaultSpeed + this.settings.ballSpeedIncrease * Math.abs(normalizedRelativeIntersectionY));
	}

	separateBallFromPaddle(ball, paddle, side)
	{
		let newX = ball.pos.x;
		let newY = ball.pos.y;

		if (side === 'left' || side === 'right')
		{
			if (ball.directionX < 0)
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
		if (this.settings.maxPlayers && this.players.length < this.settings.maxPlayers)
			return new Error(`Not enough players to start the game. Required: ${this.settings.maxPlayers}, Current: ${this.players.length}`);

		if (this.status === 'not initialized')
		{
			this.initializeGame();
		}

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
		this.deltaTime = 0;
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
					left: this.score.left,
					right: this.score.right
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

}

export default PingPong;
