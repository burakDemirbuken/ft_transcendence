import EventEmitter from '../../utils/EventEmitter.js';
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

		this.pos = new Vector2D(x, y);
		this.oldPos = new Vector2D(x, y);
		this.defaultPos = new Vector2D(x, y);
		this.height = radius * 2;
		this.width = radius * 2;

		this.canvasSize = canvasSize;
	}

	update(deltaTime)
	{
		const deltaTimeInSeconds = deltaTime / 1000;

		this.oldPos = { x: this.pos.x, y: this.pos.y };
		this.pos.x += this.directionX * this.speed * deltaTimeInSeconds;
		this.pos.y += this.directionY * this.speed * deltaTimeInSeconds;

		this.checkBorders();
	}

	checkBorders()
	{
		if (this.pos.y - this.radius < 0)
			this.emit('borderHit', 'top');
		else if (this.pos.y + this.radius > this.canvasSize.height)
			this.emit('borderHit', 'bottom');
		else if (this.pos.x - this.radius < 0)
			this.emit('borderHit', 'left');
		else if (this.pos.x + this.radius > this.canvasSize.width)
			this.emit('borderHit', 'right');
	}

	revertPosition()
	{
		this.pos = { x: this.oldPos.x, y: this.oldPos.y };
	}

	launchBall(direction, speed = this.speed)
	{
		this.speed = speed;
		this.directionX = direction.x;
		this.directionY = direction.y;
	}

	reset()
	{
		this.pos.x = this.defaultPos.x;
		this.pos.y = this.defaultPos.y;
		this.speed = this.defaultSpeed;
		this.directionX = 0;
		this.directionY = 0;
		this.oldPos = { x: this.pos.x, y: this.pos.y };
	}

	setPosition(x, y)
	{
		this.pos.x = x;
		this.pos.y = y;
	}

	setSafePosition(x, y)
	{
		this.pos.x = x;
		this.pos.y = y;
		this.oldPos = { x: x, y: y };
	}

	getState()
	{
		return {
			position:
			{
				x: this.pos.x,
				y: this.pos.y
			},
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
