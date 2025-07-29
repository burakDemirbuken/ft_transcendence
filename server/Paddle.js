import Object from './Object.js';

const PADDLE_SPEED = 700; // piksel/saniye cinsinden hız
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const CANVAS_HEIGHT = 600;

const PADDLE_SPACE = 30; // Space from the edge of the canvas

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
		const deltaTimeInSeconds = deltaTime / 1000;

		if (this.down && this.position.y + this.size.height <= CANVAS_HEIGHT)
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
