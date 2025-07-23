import Player from './Player.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BALL_RADIUS = 7;
const BALL_START_SPEED = 3;

class Ball
{
	constructor()
	{
		this.x = CANVAS_WIDTH / 2;
		this.y = CANVAS_HEIGHT / 2;
		this.radius = BALL_RADIUS;
		this.speed = BALL_START_SPEED;
		this.directionX = Math.random() < 0.5 ? -1 : 1;
		this.directionY = Math.random() < 0.5 ? -1 : 1;
	}

	update(deltaTime, player)
	{
		this.newX = this.x + this.directionX * this.speed * deltaTime;
		this.newY = this.y + this.directionY * this.speed * deltaTime;

		this.checkCollisionWithWalls();
		this.checkCollisionWithPaddles(player);
	}

	checkCollisionWithWalls()
	{
		if (this.newY - this.radius < 0 || this.newY + this.radius > CANVAS_HEIGHT)
			this.directionY *= -1;
		else
			this.y = this.newY;
	}

	checkCollisionWithPaddles(player)
	{
		
	}

}

export default Ball;
