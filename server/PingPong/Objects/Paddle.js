import Vector2D from '../utils/Vector2D.js';

const PADDLE_SPEED = 700;

class Paddle
{
	constructor(x , y, width, height, canvasSize)
	{

		this.down = false;
		this.up = false;
		this.canvasSize = canvasSize;

		this.position = new Vector2D(x, y);
		this.oldPos = new Vector2D(x, y);
		this.defaultPos = new Vector2D(x, y);
		this.height = height;
		this.width = width;
	}

	update(deltaTime)
	{
		const deltaTimeInSeconds = deltaTime / 1000;

		if (this.down && this.position.y + this.size.height <= this.canvasSize.height)
			this.position.y += PADDLE_SPEED * deltaTimeInSeconds;
		if (this.up && this.position.y >= 0)
			this.position.y -= PADDLE_SPEED * deltaTimeInSeconds;
	}

	getState()
	{
		return {
			position: this.position,
			size: this.size,
		};
	}

}

export default Paddle;
