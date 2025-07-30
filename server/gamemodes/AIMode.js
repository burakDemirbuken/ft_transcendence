import GameMode from './GameMode.js';
import Game from '../Game.js';
import Player from '../Player.js';

/**
 * AIMode - AI ile oynama modu
 */
class AIMode extends GameMode
{
	constructor(gameId, gameManager, difficulty = 'medium')
	{
		super(gameId, gameManager);
		this.maxPlayers = 1; // Sadece 1 human player
		this.difficulty = difficulty; // 'easy', 'medium', 'hard', 'impossible'
		this.game = new Game();
		this.aiPlayer = null;
		this.aiPaddle = null;
		this.aiUpdateInterval = null;
	}

	addPlayer(player)
	{
		if (this.players.size >= this.maxPlayers)
		{
			throw new Error('AI mode accepts only 1 human player');
		}

		this.players.set(player.id, player);
		this.game.addPlayer(player);

		// AI player oluştur
		this.createAIPlayer();
		
		console.log(`🤖 Player ${player.id} joined AI Mode (difficulty: ${this.difficulty})`);
		
		this.start();
		return this;
	}

	createAIPlayer()
	{
		this.aiPlayer = new Player('ai_player', `AI_${this.difficulty.toUpperCase()}`);
		this.game.addPlayer(this.aiPlayer);
		
		// AI için paddle referansını al
		this.aiPaddle = this.game.playerPaddles.get('ai_player');
		
		// AI update interval'ını başlat
		this.startAIBehavior();
	}

	startAIBehavior()
	{
		// AI'ın reaction time'ı difficulty'e göre değişir
		const reactionTimes = {
			easy: 200,     // 200ms gecikme
			medium: 100,   // 100ms gecikme  
			hard: 50,      // 50ms gecikme
			impossible: 0   // Anlık tepki
		};

		const reactionTime = reactionTimes[this.difficulty] || 100;

		this.aiUpdateInterval = setInterval(() => {
			this.updateAI();
		}, reactionTime);
	}

	updateAI()
	{
		if (!this.game.isRunning || !this.aiPaddle)
			return;

		const ball = this.game.ball;
		const paddle = this.aiPaddle;
		
		// AI stratejileri difficulty'e göre
		switch(this.difficulty)
		{
			case 'easy':
				this.easyAI(ball, paddle);
				break;
			case 'medium':
				this.mediumAI(ball, paddle);
				break;
			case 'hard':
				this.hardAI(ball, paddle);
				break;
			case 'impossible':
				this.impossibleAI(ball, paddle);
				break;
		}
	}

	easyAI(ball, paddle)
	{
		// Basit AI: Sadece topun Y pozisyonunu takip et
		const ballY = ball.position.y;
		const paddleCenterY = paddle.position.y + paddle.size.height / 2;
		
		const tolerance = 50; // Büyük tolerans

		if (ballY < paddleCenterY - tolerance)
		{
			this.aiPlayer.inputs.set('up', true);
			this.aiPlayer.inputs.set('down', false);
		}
		else if (ballY > paddleCenterY + tolerance)
		{
			this.aiPlayer.inputs.set('up', false);
			this.aiPlayer.inputs.set('down', true);
		}
		else
		{
			this.aiPlayer.inputs.set('up', false);
			this.aiPlayer.inputs.set('down', false);
		}
	}

	mediumAI(ball, paddle)
	{
		// Orta AI: Topun yönünü de hesaba kat
		const ballY = ball.position.y;
		const paddleCenterY = paddle.position.y + paddle.size.height / 2;
		
		// Top AI'a doğru geliyorsa daha aktif ol
		const ballComingToAI = ball.directionX > 0;
		const tolerance = ballComingToAI ? 30 : 60;

		if (ballY < paddleCenterY - tolerance)
		{
			this.aiPlayer.inputs.set('up', true);
			this.aiPlayer.inputs.set('down', false);
		}
		else if (ballY > paddleCenterY + tolerance)
		{
			this.aiPlayer.inputs.set('up', false);
			this.aiPlayer.inputs.set('down', true);
		}
		else
		{
			this.aiPlayer.inputs.set('up', false);
			this.aiPlayer.inputs.set('down', false);
		}
	}

	hardAI(ball, paddle)
	{
		// Zor AI: Topun geleceği pozisyonu tahmin et
		const ballY = ball.position.y;
		const ballVelY = ball.directionY * ball.speed;
		const paddleCenterY = paddle.position.y + paddle.size.height / 2;
		
		// Topun paddle'a ulaşacağı tahmini Y pozisyonu
		const timeToReach = Math.abs(paddle.position.x - ball.position.x) / (ball.speed * Math.abs(ball.directionX));
		const predictedY = ballY + (ballVelY * timeToReach / 1000);
		
		const tolerance = 20;

		if (predictedY < paddleCenterY - tolerance)
		{
			this.aiPlayer.inputs.set('up', true);
			this.aiPlayer.inputs.set('down', false);
		}
		else if (predictedY > paddleCenterY + tolerance)
		{
			this.aiPlayer.inputs.set('up', false);
			this.aiPlayer.inputs.set('down', true);
		}
		else
		{
			this.aiPlayer.inputs.set('up', false);
			this.aiPlayer.inputs.set('down', false);
		}
	}

	impossibleAI(ball, paddle)
	{
		// İmkansız AI: Mükemmel pozisyon
		const ballY = ball.position.y;
		const paddleCenterY = paddle.position.y + paddle.size.height / 2;

		// Mükemmel merkez hizalama
		if (Math.abs(ballY - paddleCenterY) > 1)
		{
			if (ballY < paddleCenterY)
			{
				this.aiPlayer.inputs.set('up', true);
				this.aiPlayer.inputs.set('down', false);
			}
			else
			{
				this.aiPlayer.inputs.set('up', false);
				this.aiPlayer.inputs.set('down', true);
			}
		}
		else
		{
			this.aiPlayer.inputs.set('up', false);
			this.aiPlayer.inputs.set('down', false);
		}
	}

	update(deltaTime)
	{
		if (this.status === 'playing')
		{
			this.game.update(deltaTime);
		}
	}

	getGameState()
	{
		const gameState = this.game.getState();
		
		return {
			mode: 'ai',
			gameId: this.gameId,
			status: this.status,
			difficulty: this.difficulty,
			players: this.players.size,
			maxPlayers: this.maxPlayers,
			gameData: {
				...gameState.gameData,
				aiPlayer: {
					id: this.aiPlayer?.id,
					name: this.aiPlayer?.name,
					difficulty: this.difficulty
				}
			}
		};
	}

	onGameStart()
	{
		console.log(`🤖 AI Mode started: ${this.gameId} (difficulty: ${this.difficulty})`);
	}

	onGameEnd()
	{
		if (this.aiUpdateInterval)
		{
			clearInterval(this.aiUpdateInterval);
			this.aiUpdateInterval = null;
		}
		console.log(`🏁 AI Mode ended: ${this.gameId}`);
	}

	stop()
	{
		super.stop();
		this.onGameEnd();
	}
}

export default AIMode;
