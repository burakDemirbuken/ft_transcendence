import Vector2D from '../utils/Vector2D.js';

const PADDLE_SPEED = 700;

class Paddle
{
	constructor(x , y, width, height, canvasSize)
	{

		this.down = false;
		this.up = false;
		this.canvasSize = canvasSize;

		this.pos = new Vector2D(x, y);
		this.oldPos = new Vector2D(x, y);
		this.defaultPos = new Vector2D(x, y);
		this.height = height;
		this.width = width;
	}

	update(deltaTime)
	{
		const deltaTimeInSeconds = deltaTime / 1000;

		if (this.down)
			this.pos.y += PADDLE_SPEED * deltaTimeInSeconds;
		if (this.up && this.pos.y >= 0)
			this.pos.y -= PADDLE_SPEED * deltaTimeInSeconds;

		if (this.pos.y + this.height > this.canvasSize.height)
			this.pos.y = this.canvasSize.height - this.height;
		if (this.pos.y < 0)
			this.pos.y = 0;
	}

	getState()
	{
		return {
			position: {
				x: this.pos.x,
				y: this.pos.y
			},
			size: {
				width: this.width,
				height: this.height
			},
		};
	}

	reset()
	{
		this.pos = { x: this.defaultPos.x, y: this.defaultPos.y };
		this.oldPos = { x: this.defaultPos.x, y: this.defaultPos.y };
		this.down = false;
		this.up = false;
	}

}

export default Paddle;
