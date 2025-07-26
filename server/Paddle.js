import Object from './Object.js';

const PADDLE_SPEED = 2;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const CANVAS_HEIGHT = 600;
const PADDLE_SPACE = 10; // Space from the edge of the canvas

class Paddle extends Object
{
	constructor(position)
	{
		if (position === "left")
			var x = 0 + PADDLE_SPACE;
		else if (position === "right")
			var x = 800 - PADDLE_WIDTH - PADDLE_SPACE; // Assuming canvas width is 800
		else
			throw new Error('Invalid position for Paddle');
		super(x, CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT);
		this.down = false;
		this.up = false;
	}

	update(deltaTime)
	{
		if (this.down && this.y + this.height <= CANVAS_HEIGHT)
			this.y += PADDLE_SPEED * deltaTime;
		if (this.up && this.y - this.height >= 0)
			this.y -= PADDLE_SPEED * deltaTime;
	}

	getState()
	{
		return {
			position: this.getPosition(),
			size: this.getSize(),
		};
	}

}

export default Paddle;
