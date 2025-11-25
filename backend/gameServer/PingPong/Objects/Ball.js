import EventEmitter from '../../utils/EventEmitter.js';
import Vector2D from '../utils/Vector2D.js';

class Ball extends EventEmitter
{
	constructor(x, y, radius, ballSpeed, canvasSize)
	{
		super();
		this.speed = ballSpeed / 2;
		this.defaultSpeed = ballSpeed;
		this.direction =
		{
			x : Math.random() < 0.5 ? -1 : 1,
			y : Math.random()
		}
		this.lastGoal = null;

		this.pos = new Vector2D(x, y);
		this.oldPos = new Vector2D(x, y);
		this.defaultPos = new Vector2D(x - radius, y - radius);
		this.height = radius * 2;
		this.width = radius * 2;

		this.canvasSize = canvasSize;
	}

	update(deltaTime)
	{
		const deltaTimeInSeconds = deltaTime / 1000;

		this.oldPos = { x: this.pos.x, y: this.pos.y };
		this.pos.x += this.direction.x * this.speed * deltaTimeInSeconds;
		this.pos.y += this.direction.y * this.speed * deltaTimeInSeconds;

		this.checkBorders();
	}

	checkBorders()
	{
		if (this.pos.y < 0)
			this.emit('borderHit', 'top');
		if (this.pos.y + this.width > this.canvasSize.height)
			this.emit('borderHit', 'bottom');
		if (this.pos.x < 0)
			this.emit('borderHit', 'left');
		if (this.pos.x + this.height > this.canvasSize.width)
			this.emit('borderHit', 'right');
	}

	revertPosition()
	{
		this.pos = { x: this.oldPos.x, y: this.oldPos.y };
	}

	launchBall(direction, speed = this.speed)
	{
		this.speed = speed;
		this.direction.x = direction.x;
		this.direction.y = direction.y;
	}

	reset()
	{
		this.pos.x = this.defaultPos.x;
		this.pos.y = this.defaultPos.y;
		this.speed = this.defaultSpeed / 2;
		this.direction.x = 0;
		this.direction.y = 0;
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
				x: this.direction.x,
				y: this.direction.y
			},
			radius: this.width / 2,
			speed: this.speed
		};
	}
}

export default Ball;
