
const PADDLE_SPEED = 700;

class Paddle
{
	constructor(x , y, width, height, canvasSize)
	{
		super(x, y, width, height);
		this.down = false;
		this.up = false;
		this.canvasSize = canvasSize;
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
