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

	ballRadius: 3,
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
			this.paddles.set(player.id, this.createPaddle());
		}
	}

	createPaddle()
	{
		let paddlePos = { x: 0, y: this.settings.canvasHeight / 2 - this.settings.paddleHeight / 2 };
		if (this.players.length === 1)
			paddlePos.x = this.settings.canvasWidth - this.settings.paddleWidth - PADDLE_SPACE;
		else if (this.players.length === 2)
			paddlePos.x = PADDLE_SPACE;
		else if (this.players.length === 3)
			paddlePos.x = 200;
		else if (this.players.length === 4)
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
				if (border === 'left')
				{
					this.score.right++;
					this.emit('goal', 'right');
					this.ball.reset();
					this.ball.launchBall({x: 1, y: Math.random() - 0.5});
				}
				else if (border === 'right')
				{
					this.score.left++;
					this.emit('goal', 'left');
					this.ball.reset();
					this.ball.launchBall({x: -1, y: Math.random() - 0.5});
				}
				else if (border === 'top' || border === 'bottom')
				{
					this.ball.launchBall({x: this.ball.directionX, y: -this.ball.directionY});
				}
			}
		);
	}

	processPlayerInput(player, paddle)
	{
		const upPressed = player.inputs.get('up') || false;
		const downPressed = player.inputs.get('down') || false;

		paddle.up = upPressed;
		paddle.down = downPressed;
	}

	update(deltaTime)
	{
		if (this.status === 'paused')
		{
			this.deltaTime = 0;
			return;
		}

		if (this.status !== 'playing')
			return new Error('Game is not currently playing: ' + this.status);

		this.deltaTime = deltaTime;
		this.gameTime += deltaTime;

		for (const player of this.players)
		{
			const paddle = this.paddles.get(player.id);
			if (paddle)
			{
				this.processPlayerInput(player, paddle);
				paddle.update(deltaTime);
			}
		}

		if (this.ball)
			this.ball.update(deltaTime);

		this.checkCollisions();

	}

	checkCollisions()
	{
		for (const player of this.players)
		{
			const paddle = this.paddles.get(player.id);
			if (paddle)
			{
				const collisionDetails = Collision2D.trajectoryRectangleToRectangle(this.ball, paddle, true);
				if (collisionDetails.colliding)
				{
					const side = collisionDetails.side;
					if (side === "top" || side === "bottom")
						this.ball.launchBall({x: this.ball.directionX, y: -this.ball.directionY});
					else if (side === "left" || side === "right")
						this.adjustBallAngle(paddle);
				}
			}
		}
	}


	adjustBallAngle(paddle)
	{
		const relativeIntersectY = (paddle.position.y + paddle.size.height / 2) - this.ball.position.y;
		const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.size.height / 2);
		const length = Math.sqrt(this.ball.directionX * this.ball.directionX + this.ball.directionY * this.ball.directionY);
		this.ball.launchBall({x: this.ball.directionX / length, y: -normalizedRelativeIntersectionY / length},
										(this.ball.defaultSpeed + this.settings.ballSpeedIncrease) / length);
	}


	start()
	{
		if (this.maxPlayers && this.players.length < this.maxPlayers)
			return new Error(`Not enough players to start the game. Required: ${this.maxPlayers}, Current: ${this.players.length}`);
		this.status = 'playing';
	}

	pause()
	{
		this.status = 'paused';
	}

	resume()
	{
		this.status = 'playing';
	}

	stop()
	{
		this.status = 'finished';
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

	processPlayerInput(player, paddle)
	{
		const upPressed = player.inputs.get('up') || false;
		const downPressed = player.inputs.get('down') || false;

		paddle.up = upPressed;
		paddle.down = downPressed;
	}

	isFull()
	{
		return this.players.length === this.settings.maxPlayers;
	}
}

export default PingPong;
