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

		if (this.down && this.pos.y + this.height <= this.canvasSize.height)
			this.pos.y += PADDLE_SPEED * deltaTimeInSeconds;
		if (this.up && this.pos.y >= 0)
			this.pos.y -= PADDLE_SPEED * deltaTimeInSeconds;
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

}

export default Paddle;
