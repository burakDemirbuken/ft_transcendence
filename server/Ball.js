import Player from './Paddle.js';
import Object from './Object.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BALL_RADIUS = 7;
const BALL_START_SPEED = 500;

class Ball extends Object
{
	constructor()
	{
		super(CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2, BALL_RADIUS * 2, BALL_RADIUS * 2);
		this.radius = BALL_RADIUS;
		this.speed = BALL_START_SPEED;
		this.directionX = Math.random() < 0.5 ? -1 : 1;
		this.directionY = Math.random();
		this.lastGoal = null;
	}

	update(deltaTime, paddles)
	{
		console.log('---------------- Ball Update --------------');
		console.log(`Ball position: ${this.position.x}, ${this.position.y}`);
		console.log(`Ball oldPosition: ${this.oldPosition.x}, ${this.oldPosition.y}`);
		console.log(`Ball speed: ${this.speed}`);
		console.log(`Ball direction: ${this.directionX}, ${this.directionY}`);
		console.log(`-------------------------------------------`);

		const deltaTimeInSeconds = deltaTime / 1000;


		this.oldPosition = { x: this.position.x, y: this.position.y };
		this.position.x += this.directionX * this.speed * deltaTimeInSeconds;
		this.position.y += this.directionY * this.speed * deltaTimeInSeconds;

		const goalResult = this.checkCollisionWithWalls();
		this.checkCollisionWithPaddles(paddles);

		return goalResult;
	}

	checkCollisionWithWalls()
	{
		if (this.position.y - this.radius <= 0)
		{
			this.position.y = this.radius;
			this.directionY *= -1;
		}
		else if (this.position.y + this.radius >= CANVAS_HEIGHT)
		{
			this.position.y = CANVAS_HEIGHT - this.radius;
			this.directionY *= -1;
		}

		if (this.position.x <= 0)
		{
			console.log('🥅 Goal! Right player scores');
			this.lastGoal = 'right';
			this.reset();
			return 'goal-right';
		}
		else if (this.position.x + this.radius >= CANVAS_WIDTH)
		{
			console.log('🥅 Goal! Left player scores');
			this.lastGoal = 'left';
			this.reset();
			return 'goal-left';
		}

		return null;
	}

	reset()
	{
		this.position.x = CANVAS_WIDTH / 2;
		this.position.y = CANVAS_HEIGHT / 2;
		this.speed = BALL_START_SPEED;

		if (this.lastGoal === 'right')
			this.directionX = -1;
		else
			this.directionX = 1;

		this.directionY = Math.random();

		this.oldPosition = this.position;
	}

	checkCollisionWithPaddles(paddles)
	{
		for (const paddle of paddles)
		{
			if (this.isCollidingWithPaddle(paddle))
			{
				const collisionSide = this.getCollisionSide(paddle);
				this.handlePaddleCollision(paddle, collisionSide);
				break;
			}
		}
	}

	isCollidingWithPaddle(paddle)
	{
		// Circle-Rectangle collision detection
		const ballCenterX = this.position.x;
		const ballCenterY = this.position.y;

		// En yakın noktayı bul
		const closestX = Math.max(paddle.position.x, Math.min(ballCenterX, paddle.position.x + paddle.size.width));
		const closestY = Math.max(paddle.position.y, Math.min(ballCenterY, paddle.position.y + paddle.size.height));

		// Mesafe hesapla
		const distanceX = ballCenterX - closestX;
		const distanceY = ballCenterY - closestY;
		const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

		return distanceSquared <= (this.radius * this.radius);
	}

	getCollisionSide(paddle)
	{
		const ballCenterX = this.position.x;
		const ballCenterY = this.position.y;

		const prevBallX = this.oldPosition.x;
		const prevBallY = this.oldPosition.y;

		// Hangi yönden geldiğini hesapla
		if (prevBallX < paddle.position.x && ballCenterX >= paddle.position.x)
			return 'left';
		else if (prevBallX > paddle.position.x + paddle.size.width && ballCenterX <= paddle.position.x + paddle.size.width)
			return 'right';
		else if (prevBallY < paddle.position.y && ballCenterY >= paddle.position.y)
			return 'top';
		else if (prevBallY > paddle.position.y + paddle.size.height && ballCenterY <= paddle.position.y + paddle.size.height)
			return 'bottom';

		// Varsayılan olarak en yakın kenarı hesapla
		const distToLeft = Math.abs(ballCenterX - paddle.position.x);
		const distToRight = Math.abs(ballCenterX - (paddle.position.x + paddle.size.width));
		const distToTop = Math.abs(ballCenterY - paddle.position.y);
		const distToBottom = Math.abs(ballCenterY - (paddle.position.y + paddle.size.height));

		const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

		if (minDist === distToLeft)
			return 'left';
		if (minDist === distToRight)
			return 'right';
		if (minDist === distToTop)
			return 'top';
		return 'bottom';
	}

	checkTrajectoryCollision(paddle)
	{
		const ballLeft = Math.min(this.oldPosition.x, this.position.x) - this.radius;
		const ballRight = Math.max(this.oldPosition.x, this.position.x) + this.radius;
		const ballTop = Math.min(this.oldPosition.y, this.position.y) - this.radius;
		const ballBottom = Math.max(this.oldPosition.y, this.position.y) + this.radius;

		const paddleLeft = paddle.position.x;
		const paddleRight = paddle.position.x + paddle.size.width;
		const paddleTop = paddle.position.y;
		const paddleBottom = paddle.position.y + paddle.size.height;

		return (ballRight > paddleLeft &&
			ballLeft < paddleRight &&
			ballBottom > paddleTop &&
			ballTop < paddleBottom);
	}

	handlePaddleCollision(paddle, collisionSide)
	{
		console.log(`🏓 Ball hit paddle on ${collisionSide} side`);

		// Topu paddle'dan tamamen ayır
		this.separateFromPaddle(paddle, collisionSide);

		switch(collisionSide)
		{
			case 'left':
			case 'right':
				this.directionX *= -1;
				this.adjustBallAngle(paddle);
				break;

			case 'top':
			case 'bottom':
				this.directionY *= -1;
				break;
		}
	}

	separateFromPaddle(paddle, collisionSide)
	{
		// Topu paddle'dan tamamen ayırmak için doğru pozisyona yerleştir
		switch(collisionSide)
		{
			case 'left':
				this.position.x = paddle.position.x - this.radius - 1; // 1 piksel extra boşluk
				break;
			case 'right':
				this.position.x = paddle.position.x + paddle.size.width + this.radius + 1;
				break;
			case 'top':
				this.position.y = paddle.position.y - this.radius - 1;
				break;
			case 'bottom':
				this.position.y = paddle.position.y + paddle.size.height + this.radius + 1;
				break;
		}
	}

	adjustBallAngle(paddle)
	{
		const relativeIntersectY = (paddle.position.y + paddle.size.height / 2) - this.position.y;
		const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.size.height / 2);

		this.directionY = -normalizedRelativeIntersectionY;

		const length = Math.sqrt(this.directionX * this.directionX + this.directionY * this.directionY);
		this.directionX /= length;
		this.directionY /= length;

		this.speed =  BALL_START_SPEED;
		this.speed += Math.abs(length) * 200;
	}

	getState()
	{
		return {
			position: this.position,
			direction:
			{
				x: this.directionX,
				y: this.directionY
			},
			radius: this.radius,
			speed: this.speed
		};
	}

}

export default Ball;
