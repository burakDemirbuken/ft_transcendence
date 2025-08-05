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

			// İlk player eklendiğinde oyunu initialize et
			if (this.players.length === 1 && this.status === 'not initialized')
			{
				this.initializeGame();
				console.log(`🎮 Game initialized with first player`);
			}
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
		this.isFinished();
	}

	isFinished()
	{
		if (this.score.left >= this.settings.maxScore || this.score.right >= this.settings.maxScore)
		{
			this.status = 'finished';
			this.emit('gameFinished', this.getGameState());
			console.log(`🏁 Game finished! Final Score - Left: ${this.score.left}, Right: ${this.score.right}`);
		}
		else
		{
			this.emit('gameStateUpdate', this.getGameState());
		}
		return this.status === 'finished';
	}

	checkCollisions()
	{
		if (!this.ball)
		{
			console.warn('⚠️ Ball is null in checkCollisions');
			return;
		}

		for (const player of this.players)
		{
			const paddle = this.paddles.get(player.id);
			if (paddle)
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
			else
			{
				console.warn(`⚠️ Paddle not found for player ${player.id}`);
			}
		}
		return null;
	}

	adjustBallAngle(paddle)
	{
		const relativeIntersectY = (paddle.pos.y + paddle.height / 2) - this.ball.pos.y;
		const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.height / 2);
		this.ball.launchBall({x: -this.ball.directionX, y: -normalizedRelativeIntersectionY},
										this.ball.defaultSpeed + this.settings.ballSpeedIncrease * Math.abs(normalizedRelativeIntersectionY));
	}

/*
node-1  | 🔧 COLLISION DEBUG:
node-1  |    Ball: pos(770.4, 365.8) size(14x14)
node-1  |    Paddle: pos(770.0, 272.4) size(10x100)
node-1  |    Ball direction: (1.00, 0.19)
node-1  |    Detected side: "top"
node-1  |    TOP collision: 272.40000000000003 - 14 - 1 = 257.40000000000003
node-1  |    Final position: (770.4, 257.4)


node-1  | 🔧 COLLISION DEBUG:
node-1  |    Ball: pos(25.8, 348.4) size(14x14)
node-1  |    Paddle: pos(20.0, 250.0) size(10x100)
node-1  |    Ball direction: (-1.00, 0.15)
node-1  |    Detected side: "top"
node-1  |    TOP collision: 250 - 14 - 1 = 235
node-1  |    Final position: (25.8, 235.0)

*/


	separateBallFromPaddle(ball, paddle, side)
	{
		console.log(`🔧 COLLISION DEBUG:`);
		console.log(`   Ball: pos(${ball.pos.x.toFixed(1)}, ${ball.pos.y.toFixed(1)}) size(${ball.width}x${ball.height})`);
		console.log(`   Paddle: pos(${paddle.pos.x.toFixed(1)}, ${paddle.pos.y.toFixed(1)}) size(${paddle.width}x${paddle.height})`);
		console.log(`   Ball direction: (${ball.directionX.toFixed(2)}, ${ball.directionY.toFixed(2)})`);
		console.log(`   Detected side: "${side}"`);

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
		{
			newY = paddle.pos.y - ball.height - 1;
			console.log(`   TOP collision: ${paddle.pos.y} - ${ball.height} - 1 = ${newY}`);
		}
		else if (side === 'bottom')
		{
			newY = paddle.pos.y + paddle.height + 1;
			console.log(`   BOTTOM collision: ${paddle.pos.y} + ${paddle.height} + 1 = ${newY}`);
		}

		console.log(`   Final position: (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
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
	}

	resume()
	{
		this.status = 'playing';
	}

	stop()
	{
		this.status = 'finished';
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

	isFull()
	{
		return this.players.length === this.settings.maxPlayers;
	}

}

export default PingPong;
