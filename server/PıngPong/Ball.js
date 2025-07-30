import Player from '../Paddle.js';
import Object from '../Object.js';

const BALL_SPEED_INCREASE = 200;

class Ball extends Object
{
	constructor(x, y, radius, ballSpeed, canvasSize)
	{
		super(x, y, radius * 2, radius * 2);
		this.radius = radius;
		this.speed = ballSpeed;
		this.defaultSpeed = ballSpeed;
		this.directionX = Math.random() < 0.5 ? -1 : 1;
		this.directionY = Math.random();
		this.lastGoal = null;
		this.canvasSize = canvasSize;
	}

	update(deltaTime, paddles)
	{
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
		else if (this.position.y + this.radius >= this.canvasSize.height)
		{
			this.position.y = this.canvasSize.height - this.radius;
			this.directionY *= -1;
		}

		if (this.position.x <= 0)
		{
			console.log('🥅 Goal! Right player scores');
			this.lastGoal = 'right';
			this.reset();
			return 'goal-right';
		}
		else if (this.position.x + this.radius >= this.canvasSize.width)
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
		this.position.x = this.canvasSize.width / 2;
		this.position.y = this.canvasSize.height / 2;
		this.speed = defaultSpeed;

		if (this.lastGoal === 'right')
			this.directionX = -1;
		else
			this.directionX = 1;

		this.directionY = Math.random();

		this.oldPosition = { x: this.position.x, y: this.position.y };
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
		return this.checkTrajectoryCollision(paddle) && this.isCollidingWith(paddle);
	}

	getCollisionSide(paddle)
	{
		const ballCenterX = this.position.x;
		const ballCenterY = this.position.y;

		const prevBallX = this.oldPosition.x;
		const prevBallY = this.oldPosition.y;

		if (prevBallX < paddle.position.x && ballCenterX >= paddle.position.x)
			return 'left';
		else if (prevBallX > paddle.position.x + paddle.size.width && ballCenterX <= paddle.position.x + paddle.size.width)
			return 'right';
		else if (prevBallY < paddle.position.y && ballCenterY >= paddle.position.y)
			return 'top';
		else if (prevBallY > paddle.position.y + paddle.size.height && ballCenterY <= paddle.position.y + paddle.size.height)
			return 'bottom';

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
		switch(collisionSide)
		{
			case 'left':
				this.position.x = paddle.position.x - this.radius - 1;
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

		this.speed =  defaultSpeed;
		this.speed += Math.abs(length) * BALL_SPEED_INCREASE;
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
