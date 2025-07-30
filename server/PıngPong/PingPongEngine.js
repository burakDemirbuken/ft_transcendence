import Ball from './Ball.js';
import Paddle from './Paddle.js';

class PingPongEngine
{
	constructor(gameMode = 'classic', settings = {})
	{
		this.status = 'waiting';
		this.gameMode = gameMode;

		this.gameArea = {
			width: 800,
			height: 600,
		};

		this.deltaTime = 0;
		this.lastUpdateTime = 0;
		this.gameTime = 0;

		// Oyun ayarları
		this.settings = {
			ballSpeed: settings.ballSpeed || 5,
			paddleSpeed: settings.paddleSpeed || 8,
			paddleSize: {
				width: settings.paddleWidth || 20,
				height: settings.paddleHeight || 80
			},
			ballRadius: settings.ballRadius || 10,
			...settings
		};

		this.ball = new Ball(this.gameArea.width / 2, this.gameArea.height / 2, this.settings.ballRadius, this.settings.ballSpeed, this.gameArea);
		this.paddles = [];

		this.onGoal = null;

		this.initializeGame();
	}

	/**
	 * Oyunu başlat
	 */
	initializeGame()
	{

		this.setupPaddles();
	}

	/**
	 * Oyun moduna göre paddle'ları yerleştir
	 */
	setupPaddles()
	{
		this.paddles = [];

		switch(this.gameMode)
		{
			case 'classic':
				this.setupClassicPaddles();
				break;
			case 'multiplayer':
				this.setupMultiplayerPaddles();
				break;
			case 'ai':
				this.setupAIPaddles();
				break;
		}
	}

	/**
	 * Klasik 2 oyunculu paddle düzeni
	 */
	setupClassicPaddles()
	{
		// Sol paddle
		const leftPaddle = new Paddle();
		leftPaddle.position = {
			x: 30,
			y: this.gameArea.height / 2 - this.settings.paddleSize.height / 2
		};
		leftPaddle.size = this.settings.paddleSize;
		leftPaddle.side = 'left';

		// Sağ paddle
		const rightPaddle = new Paddle();
		rightPaddle.position = {
			x: this.gameArea.width - 30 - this.settings.paddleSize.width,
			y: this.gameArea.height / 2 - this.settings.paddleSize.height / 2
		};
		rightPaddle.size = this.settings.paddleSize;
		rightPaddle.side = 'right';

		this.paddles.push(leftPaddle, rightPaddle);
	}

	/**
	 * 4 oyunculu paddle düzeni
	 */
	setupMultiplayerPaddles()
	{
		// Sol paddle
		const leftPaddle = new Paddle();
		leftPaddle.position = {
			x: 30,
			y: this.gameArea.height / 2 - this.settings.paddleSize.height / 2
		};
		leftPaddle.size = this.settings.paddleSize;
		leftPaddle.side = 'left';

		// Sağ paddle
		const rightPaddle = new Paddle();
		rightPaddle.position = {
			x: this.gameArea.width - 30 - this.settings.paddleSize.width,
			y: this.gameArea.height / 2 - this.settings.paddleSize.height / 2
		};
		rightPaddle.size = this.settings.paddleSize;
		rightPaddle.side = 'right';

		// Üst paddle
		const topPaddle = new Paddle();
		topPaddle.position = {
			x: this.gameArea.width / 2 - this.settings.paddleSize.height / 2,
			y: 30
		};
		topPaddle.size = {
			width: this.settings.paddleSize.height, // Rotated
			height: this.settings.paddleSize.width
		};
		topPaddle.side = 'top';
		topPaddle.isHorizontal = true;

		// Alt paddle
		const bottomPaddle = new Paddle();
		bottomPaddle.position = {
			x: this.gameArea.width / 2 - this.settings.paddleSize.height / 2,
			y: this.gameArea.height - 30 - this.settings.paddleSize.width
		};
		bottomPaddle.size = {
			width: this.settings.paddleSize.height, // Rotated
			height: this.settings.paddleSize.width
		};
		bottomPaddle.side = 'bottom';
		bottomPaddle.isHorizontal = true;

		this.paddles.push(leftPaddle, rightPaddle, topPaddle, bottomPaddle);
	}

	/**
	 * AI modlu paddle düzeni
	 */
	setupAIPaddles()
	{
		this.setupClassicPaddles();
		// Sağdaki paddle'ı AI olarak işaretle
		this.paddles[1].isAI = true;
	}

	/**
	 * Ana fizik update döngüsü
	 */
	update(deltaTime)
	{
		if (this.status !== 'playing') return;

		this.deltaTime = deltaTime;
		this.gameTime += deltaTime;

		// Ball güncelle
		this.ball.update(deltaTime);

		// Paddle'ları güncelle
		this.paddles.forEach(paddle => {
			paddle.update(deltaTime);
		});

		// Çarpışmaları kontrol et
		this.checkCollisions();

		// Saha dışı kontrolleri
		this.checkBounds();
	}

	/**
	 * Çarpışma kontrolü
	 */
	checkCollisions()
	{
		// Duvar çarpışmaları
		this.checkWallCollisions();

		// Paddle çarpışmaları
		this.checkPaddleCollisions();
	}

	/**
	 * Duvar çarpışma kontrolü
	 */
	checkWallCollisions()
	{
		const ball = this.ball;
		const bounds = this.gameArea.boundaries;

		// Üst ve alt duvarlar
		if (ball.position.y - ball.radius <= bounds.top ||
			ball.position.y + ball.radius >= bounds.bottom) {
			ball.velocity.y = -ball.velocity.y;
			if (this.onCollision) this.onCollision('wall');
		}
	}

	/**
	 * Paddle çarpışma kontrolü
	 */
	checkPaddleCollisions()
	{
		this.paddles.forEach(paddle => {
			if (this.ball.collidesWith(paddle)) {
				this.ball.handlePaddleCollision(paddle);
				if (this.onCollision) this.onCollision('paddle', paddle);
			}
		});
	}

	/**
	 * Saha dışı kontrolleri - sadece event fırlatır, skor hesaplamaz
	 */
	checkBounds()
	{
		const ball = this.ball;
		const bounds = this.gameArea.boundaries;

		// Sol sınır
		if (ball.position.x <= bounds.left) {
			if (this.onBallOutOfBounds) this.onBallOutOfBounds('left');
		}

		// Sağ sınır
		if (ball.position.x >= bounds.right) {
			if (this.onBallOutOfBounds) this.onBallOutOfBounds('right');
		}

		// Üst sınır (4 oyunculu modda)
		if (ball.position.y <= bounds.top) {
			if (this.onBallOutOfBounds) this.onBallOutOfBounds('top');
		}

		// Alt sınır (4 oyunculu modda)
		if (ball.position.y >= bounds.bottom) {
			if (this.onBallOutOfBounds) this.onBallOutOfBounds('bottom');
		}
	}

	/**
	 * Ball'u sıfırla
	 */
	resetBall()
	{
		this.ball.position = {
			x: this.gameArea.width / 2,
			y: this.gameArea.height / 2
		};

		// Rastgele yön
		this.ball.velocity = {
			x: this.settings.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
			y: this.settings.ballSpeed * (Math.random() - 0.5)
		};
	}

	/**
	 * Paddle input'unu işle - paddle index ile
	 */
	setPaddleVelocity(paddleIndex, velocity)
	{
		if (paddleIndex >= 0 && paddleIndex < this.paddles.length) {
			const paddle = this.paddles[paddleIndex];

			// Hız limitini uygula
			const maxSpeed = this.settings.paddleSpeed;
			paddle.velocity.y = Math.max(-maxSpeed, Math.min(maxSpeed, velocity.y));

			if (paddle.isHorizontal) {
				paddle.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, velocity.x));
			}
		}
	}

	/**
	 * Paddle pozisyonunu al
	 */
	getPaddlePosition(paddleIndex)
	{
		if (paddleIndex >= 0 && paddleIndex < this.paddles.length) {
			return this.paddles[paddleIndex].position;
		}
		return null;
	}

	/**
	 * Paddle'ı belirli pozisyona taşı
	 */
	setPaddlePosition(paddleIndex, position)
	{
		if (paddleIndex >= 0 && paddleIndex < this.paddles.length) {
			this.paddles[paddleIndex].position = { ...position };
		}
	}

	/**
	 * Oyun başlat
	 */
	start()
	{
		this.status = 'playing';
		console.log(`🚀 PingPong game started in ${this.gameMode} mode`);
	}

	/**
	 * Oyun duraklat
	 */
	pause()
	{
		this.status = 'paused';
	}

	/**
	 * Oyun devam ettir
	 */
	resume()
	{
		this.status = 'playing';
	}

	/**
	 * Oyun durdur
	 */
	stop()
	{
		this.status = 'finished';
	}

	/**
	 * Oyun durumunu al - sadece fizik durumu
	 */
	getGameState()
	{
		return {
			status: this.status,
			gameMode: this.gameMode,
			gameTime: this.gameTime,
			ball: {
				position: this.ball.position,
				velocity: this.ball.velocity,
				radius: this.ball.radius
			},
			paddles: this.paddles.map((paddle, index) => ({
				index: index,
				side: paddle.side,
				position: paddle.position,
				velocity: paddle.velocity,
				size: paddle.size,
				isHorizontal: paddle.isHorizontal || false
			})),
			gameArea: this.gameArea,
			settings: this.settings
		};
	}
}

export default PingPongEngine;
