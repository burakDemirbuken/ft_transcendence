const DEFAULT_BALL_SPEED_INCREASE = 200;
const DEFAULT_BALL_SPEED = 300;
const DEFAULT_BALL_RADIUS = 10;

const DEFAULT_PADDLE_WIDTH = 10;
const DEFAULT_PADDLE_HEIGHT = 100;
const DEFAULT_PADDLE_SPEED = 300;

const DEFAULT_GAME_AREA_WIDTH = 800;
const DEFAULT_GAME_AREA_HEIGHT = 600;


class PingPongBase
{
	constructor(gameMode, property = {})
	{
		this.status = 'waiting'; // 'waiting', 'playing', 'paused', 'finished'
		this.gameMode = gameMode;

		this.gameArea = {
			width: property.width || DEFAULT_GAME_AREA_WIDTH,
			height: property.height || DEFAULT_GAME_AREA_HEIGHT,
		};

		this.deltaTime = 0;
		this.lastUpdateTime = 0;
		this.gameTime = 0;

		this.settings = {
			ballSpeed: property.ballSpeed || DEFAULT_BALL_SPEED,
			paddleSpeed: property.paddleSpeed || DEFAULT_PADDLE_SPEED,
			paddleSize: {
				width: property.paddleWidth || DEFAULT_PADDLE_WIDTH,
				height: property.paddleHeight || DEFAULT_PADDLE_HEIGHT
			},
			ballRadius: property.ballRadius || DEFAULT_BALL_RADIUS,
			ballSpeedIncrease: property.ballSpeedIncrease || DEFAULT_BALL_SPEED_INCREASE,
			...property
		};

		this.ball = null;
		this.paddles = new Map(); // playerId -> Paddle instance
		this.players = []; // Player instances

		this.maxPlayers = 2;
		if (this.gameMode !== 'multiplayer')
			this.maxPlayers = 4;

		this.score = {
			left: 0,
			right: 0
		};

		this.initializeGame();
	}

	addPlayer()
	{
		throw new Error('addPlayer method must be implemented in derived classes');
	}

	initializeGame()
	{

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
		if (this.status !== 'playing')
			return;

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

	}
	/*
	adjustBallAngle(paddle)
	{
		const ball = this.ball;
		const relativeIntersectY = (paddle.position.y + paddle.size.height / 2) - ball.position.y;
		const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.size.height / 2);

		ball.directionY = -normalizedRelativeIntersectionY;

		const length = Math.sqrt(ball.directionX * ball.directionX + ball.directionY * ball.directionY);
		ball.directionX /= length;
		ball.directionY /= length;

		ball.speed =  ball.defaultSpeed;
		ball.speed += Math.abs(length) * this.settings.ballSpeedIncrease;
	}
	 */

	start()
	{
		this.status = 'playing';
		console.log(`🚀 PingPong game started in ${this.gameMode} mode`);
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
		throw new Error('getGameState method must be implemented in derived classes');
	}

	processPlayerInput(player, paddle)
	{
		const upPressed = player.inputs.get('up') || false;
		const downPressed = player.inputs.get('down') || false;

		paddle.up = upPressed;
		paddle.down = downPressed;
	}
}

export default PingPongBase;
