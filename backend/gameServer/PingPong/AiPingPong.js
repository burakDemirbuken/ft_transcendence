import PingPong from './PingPong.js';
import AiNetwork from '../network/AiNetworkManager.js';

class AIPingPong extends PingPong
{
	constructor(parameters)
	{
		super(parameters);
		this.gameMode = "ai";
		this.maxPlayers = 1;
		this.targetPaddlePosition = { x: 0, y: 0 };
		this.aiSettings = parameters.aiSettings || { difficulty: 'medium' };
		this._aiSendInterval = null;
		this._lastTargetY = null;
		this._aiDir = 0; // -1 up, 1 down, 0 none

		// DEBUG: ID'yi kontrol et
		console.log('🎮 AIPingPong created with ID:', this.id);
	}

	addPlayer(player)
	{
		if (this.players.length !== 0)
			throw new Error("AIPingPong can only have one player");
		this.players.push(player);
		this.team.set(1, { playersId: [player.id], score: 0 });
		this.team.set(2, { playersId: ["AI"], score: 0 });
		this.paddles.set(player.id, this.createPaddle(2));
		this.paddles.set("AI", this.createPaddle(1));
		this.status = 'ready to start';
	}

	paddleControls()
	{
		const player = this.players[0];
		const localPaddle = this.paddles.get(this.players[0].id);
	
		localPaddle.up = player.inputGet('ArrowUp') || player.inputGet('w');
		localPaddle.down = player.inputGet('ArrowDown') || player.inputGet('s');
	
		const aiPaddle = this.paddles.get("AI");
		if (aiPaddle)
		{
			// AI target_y üst kenar olarak geliyor; merkeze çevir
			const targetCenterY = (this._lastTargetY != null)
				? (this._lastTargetY + aiPaddle.height / 2)
				: (aiPaddle.pos.y + aiPaddle.height / 2);
			const paddleCenterY = aiPaddle.pos.y + aiPaddle.height / 2;
			const diff = targetCenterY - paddleCenterY;
			
			// Daha hassas threshold'lar
			const threshold = 4; // Tek bir eşik değeri
		
			// Basit ve net mantık
			if (diff > threshold)
			{
				// Hedef aşağıda -> aşağı git
				aiPaddle.up = false;
				aiPaddle.down = true;
				this._aiDir = 1;
			}
			else if (diff < -threshold)
			{
				// Hedef yukarıda -> yukarı git
				aiPaddle.up = true;
				aiPaddle.down = false;
				this._aiDir = -1;
			}
			else
			{
				// Hedefe ulaştık -> dur
				aiPaddle.up = false;
				aiPaddle.down = false;
				this._aiDir = 0;
			}
		}
	}


	getGameState()
	{
		const playerStates = [
			{
				id: this.players[0].id,
				name: this.players[0].name,
				...this.paddles.get(this.players[0].id).getState(),
			},
			{
				id: "AI",
				name: "AI",
				...this.paddles.get("AI").getState(),
			}
		];

		if (this.status === 'finished')
		{
			return {
				currentState: this.status, // 'waiting', 'running', 'finished'
				gameData:
				{
					players: playerStates,
					score: {
						team1: this.team.get(1).score,
						team2: this.team.get(2).score
					},
					winner:
					{
						names: this.team.get(1).score > this.team.get(2).score ? [playerStates[0].name] : [playerStates[1].name],
					},
				},
			}
		}

		return {
			currentState: this.status, // 'waiting', 'running', 'finished'
			gameData:
			{
				players: playerStates,
				ball: {
					...this.ball.getState(),
				},
				score: {
					team1: this.team.get(1).score,
					team2: this.team.get(2).score
				}
			},
		};
	}

	start()
	{
		this.startTime = Date.now();
		
		// ✅ ID kontrolü ekle
		if (!this.id)
		{
			console.error('❌ Game ID is not defined! Cannot initialize AI.');
			return;
		}

		console.log('🎮 Starting AI game with ID:', this.id); // DEBUG

		// AI sunucusunda bu oyun için AI instance'ını başlat
		try
		{
			const difficulty = this.aiSettings?.difficulty || 'medium';
			console.log('📤 Calling AiNetwork.initGame with:', { difficulty, gameId: this.id }); // DEBUG
			AiNetwork.initGame(difficulty, this.id, this.aiSettings?.custom_settings || {});
		}
		catch (e)
		{
			console.error('❌ Failed to init AI game on AI server:', e);
		}
		this.status = 'countdown';
		setTimeout(
			() =>
			{
				this.status = 'playing';
				this.emit('gameStarted');
				this._aiSendInterval = setInterval(
					() =>
					{
						if (this.status !== 'playing')
							return;
						if (!this.team.get(1) || !this.team.get(2))
							return;

						const dataToSend = {
							ball:
							{
								x: this.ball.pos.x,
								y: this.ball.pos.y,
								speed_x: this.ball.direction.x * this.ball.speed,
								speed_y: this.ball.direction.y * this.ball.speed,
							},
							paddle:
							{
								ai_y: this.paddles.get("AI").pos.y,
							},
							game_area:
							{
								width: this.settings.canvasWidth,
								height: this.settings.canvasHeight,
							},
							score:
							{
								ai_score: this.team.get(1).score,
								human_score: this.team.get(2).score,
								ai_scored: this.lastGoal === 'left',
								human_scored: this.lastGoal === 'right',
							},
						};

						console.log('📤 AI\'ya gönderilen veri:', dataToSend);
						AiNetwork.sendData(this.id, dataToSend);
					}, 1000);
			}, 1000
		);

		// AI kararlarını dinle ve hedef Y'yi kaydet
		AiNetwork.on(`aiGame${this.id}_target`, (targetY) =>
		{
			console.log('🎯 AI target received for game', this.id, ':', targetY); // DEBUG
			if (typeof targetY === 'number')
				this._lastTargetY = targetY;
		});
	}

	stop()
	{
		this.status = 'stopped';
		if (this._aiSendInterval)
		{
			clearInterval(this._aiSendInterval);
			this._aiSendInterval = null;
		}
		console.log(`⏸️ Game stopped`);
	}
}

export default AIPingPong;
