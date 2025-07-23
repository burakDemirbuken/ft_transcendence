const PADDLE_SPEED = 2;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const CANVAS_HEIGHT = 600;

class Player
{
	constructor(id, x)
	{
		this.id = id;
		this.x = x;
		this.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
		this.score = 0;
		this.isReady = false;
		this.down = false;
		this.up = false;
		this.height = PADDLE_HEIGHT;
		this.width = PADDLE_WIDTH;
	}

	update(deltaTime)
	{
		if (this.down && this.y + this.height <= CANVAS_HEIGHT)
			this.y += PADDLE_SPEED * deltaTime;
		if (this.up && this.y - this.height >= 0)
			this.y -= PADDLE_SPEED * deltaTime;
	}

	down(action)
	{
		this.down = action;
	}

	up(action)
	{
		this.up = action;
	}

	getPosition()
	{
		return { x: this.x, y: this.y };
	}

	getSize()
	{
		return { width: this.width, height: this.height };
	}

}

export default Player;
