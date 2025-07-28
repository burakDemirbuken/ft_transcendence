import Player from './Paddle.js';
import Object from './Object.js';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BALL_RADIUS = 7;
const BALL_START_SPEED = 0.25;

class Ball extends Object
{
	constructor()
	{
		super(CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2, BALL_RADIUS * 2, BALL_RADIUS * 2);
		this.radius = BALL_RADIUS; // Radius property'si ekle
		this.speed = BALL_START_SPEED;
		this.directionX = Math.random() < 0.5 ? -1 : 1;
		this.directionY = Math.random() < 0.5 ? -1 : 1;
		this.oldPosition = { x: this.x, y: this.y };
		this.lastGoal = null;
	}

	update(deltaTime, paddles = [])
	{
		this.oldPosition = { x: this.x, y: this.y };
		this.x += this.directionX * this.speed * deltaTime;
		this.y += this.directionY * this.speed * deltaTime;

		const goalResult = this.checkCollisionWithWalls();
		this.checkCollisionWithPaddles(paddles);

		return goalResult;
	}

	checkCollisionWithWalls()
	{
		if (this.y - this.radius <= 0)
		{
			this.y = this.radius;
			this.directionY *= -1;
		}
		else if (this.y + this.radius >= CANVAS_HEIGHT)
		{
			this.y = CANVAS_HEIGHT - this.radius;
			this.directionY *= -1;
		}

		if (this.x <= 0)
		{
			console.log('🥅 Goal! Right player scores');
			this.lastGoal = 'right';
			this.reset();
			return 'goal-right';
		}
		else if (this.x + this.radius >= CANVAS_WIDTH)
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

		this.x = CANVAS_WIDTH / 2;
		this.y = CANVAS_HEIGHT / 2;
		this.speed = BALL_START_SPEED;

		if (this.lastGoal === 'right')
			this.directionX = -1;
		else
			this.directionX = 1;

		this.directionY = Math.random() < 0.5 ? -1 : 1;

		this.oldPosition = { x: this.x, y: this.y };
	}

	checkCollisionWithPaddles(paddles)
	{
		for (const paddle of paddles)
		{
			if (this.isCollidingWithPaddle(paddle))
			{
				const collisionSide = this.getCollisionSide(paddle);
				this.handlePaddleCollision(paddle, collisionSide);
				break; // Sadece bir paddle ile çarpışma işle
			}
		}
	}

	isCollidingWithPaddle(paddle)
	{
		// Topun merkezi ile paddle'ın kenarları arasındaki mesafeyi hesapla
		const closestX = Math.max(paddle.x, Math.min(this.x, paddle.x + paddle.width));
		const closestY = Math.max(paddle.y, Math.min(this.y, paddle.y + paddle.height));

		// Topun merkezi ile en yakın nokta arasındaki mesafe
		const distanceX = this.x - closestX;
		const distanceY = this.y - closestY;
		const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

		return distanceSquared < (this.radius * this.radius);
	}

	getCollisionSide(paddle)
	{
		// Topun merkezi paddle'ın hangi tarafında?
		const ballCenterX = this.x;
		const ballCenterY = this.y;

		const paddleCenterX = paddle.x + (paddle.width / 2);
		const paddleCenterY = paddle.y + (paddle.height / 2);

		// Önceki pozisyondan collision'ı analiz et
		const prevBallX = this.oldPosition.x;
		const prevBallY = this.oldPosition.y;

		// Hangi yönden geldiğini hesapla
		if (prevBallX < paddle.x && ballCenterX >= paddle.x)
		{
			return 'left'; // Soldan çarptı
		}
		else if (prevBallX > paddle.x + paddle.width && ballCenterX <= paddle.x + paddle.width)
		{
			return 'right'; // Sağdan çarptı
		}
		else if (prevBallY < paddle.y && ballCenterY >= paddle.y)
		{
			return 'top'; // Üstten çarptı
		}
		else if (prevBallY > paddle.y + paddle.height && ballCenterY <= paddle.y + paddle.height)
		{
			return 'bottom'; // Alttan çarptı
		}

		// Varsayılan olarak en yakın kenarı hesapla
		const distToLeft = Math.abs(ballCenterX - paddle.x);
		const distToRight = Math.abs(ballCenterX - (paddle.x + paddle.width));
		const distToTop = Math.abs(ballCenterY - paddle.y);
		const distToBottom = Math.abs(ballCenterY - (paddle.y + paddle.height));

		const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

		if (minDist === distToLeft) return 'left';
		if (minDist === distToRight) return 'right';
		if (minDist === distToTop) return 'top';
		return 'bottom';
	}

	handlePaddleCollision(paddle, collisionSide)
	{
		console.log(`🏓 Ball hit paddle on ${collisionSide} side`);

		// Topun pozisyonunu düzelt (paddle içinde kalmasını engelle)
		this.x = this.oldPosition.x;
		this.y = this.oldPosition.y;

		switch(collisionSide)
		{
			case 'left':
			case 'right':
				this.directionX *= -1; // X yönünü ters çevir
				// Y yönünü paddle'ın hareket yönüne göre ayarla
				this.adjustBallAngle(paddle);
				break;

			case 'top':
			case 'bottom':
				this.directionY *= -1; // Y yönünü ters çevir
				break;
		}
	}

	adjustBallAngle(paddle)
	{
		const relativeIntersectY = (paddle.y + paddle.height / 2) - this.y;
		const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.height / 2);

		this.directionY = -normalizedRelativeIntersectionY;

		const length = Math.sqrt(this.directionX * this.directionX + this.directionY * this.directionY);
		this.directionX /= length;
		this.directionY /= length;

		console.log(`🎯 Ball angle adjusted: ${this.directionY}`);
	}

	getState()
	{
		return {
			position:
			{
				x: this.x,
				y: this.y
			},
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
