import Player from '../Paddle.js'
import EventEmitter from '../utils/EventEmitter.js';
import Vector2D from '../utils/Vector2D.js';

class Ball extends EventEmitter
{
	constructor(x, y, radius, ballSpeed, canvasSize)
	{
		super();
		this.radius = radius;
		this.speed = ballSpeed;
		this.defaultSpeed = ballSpeed;
		this.directionX = Math.random() < 0.5 ? -1 : 1;
		this.directionY = Math.random();
		this.lastGoal = null;

		this.position = new Vector2D(x, y);
		this.oldPosition = new Vector2D(x, y);
		this.height = radius * 2;
		this.width = radius * 2;

		this.canvasSize = canvasSize;
	}

	update(deltaTime)
	{
		const deltaTimeInSeconds = deltaTime / 1000;

		this.oldPosition = { x: this.position.x, y: this.position.y };
		this.position.x += this.directionX * this.speed * deltaTimeInSeconds;
		this.position.y += this.directionY * this.speed * deltaTimeInSeconds;

		this.checkBorders();
	}

	checkBorders()
	{
		if (this.position.y - this.radius < 0)
			this.emit('borderHit', 'top');
		else if (this.position.y + this.radius > this.canvasSize.height)
			this.emit('borderHit', 'bottom');
		else if (this.position.x - this.radius < 0)
			this.emit('borderHit', 'left');
		else if (this.position.x + this.radius > this.canvasSize.width)
			this.emit('borderHit', 'right');
	}

	launchBall(direction, speed = this.defaultSpeed)
	{
		this.speed = speed;
		this.directionX = direction.x;
		this.directionY = direction.y;
	}

	reset()
	{
		this.position.x = this.canvasSize.width / 2;
		this.position.y = this.canvasSize.height / 2;
		this.speed = this.defaultSpeed;
/*
		if (this.lastGoal === 'right')
			this.directionX = -1;
		else
			this.directionX = 1;

		this.directionY = (Math.random() - 0.5) * 0.8;
 */
		this.directionX = 0;
		this.directionY = 0;
		this.oldPosition = { x: this.position.x, y: this.position.y };
	}

	getState()
	{
		return {
			position: this.position,
			direction:
			{
				x: this.directionX,
				y: this.directionY
			},
			radius: this.radius,
			speed: this.speed
		};
	}
}

export default Ball;
