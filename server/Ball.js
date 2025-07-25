import Player from './Paddle.js';
import Object from './Object.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BALL_RADIUS = 7;
const BALL_START_SPEED = 3;

class Ball extends Object
{
	constructor()
	{
		super(CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2, BALL_RADIUS * 2, BALL_RADIUS * 2);
		this.speed = BALL_START_SPEED;
		this.directionX = Math.random() < 0.5 ? -1 : 1;
		this.directionY = Math.random() < 0.5 ? -1 : 1;
		this.oldPosition = { x: this.x, y: this.y };
	}

	update(deltaTime, players)
	{
		this.oldPosition = { x: this.x, y: this.y };
		this.x += this.directionX * this.speed * deltaTime;
		this.y += this.directionY * this.speed * deltaTime;

		this.checkCollisionWithWalls();
	}

	checkCollisionWithWalls()
	{
		if (this.y - this.radius < 0 || this.y + this.radius > CANVAS_HEIGHT)
			this.directionY *= -1;
	}

}

export default Ball;
