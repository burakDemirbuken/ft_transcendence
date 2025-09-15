import PingPong from './PingPong.js';
import AiNetwork from '../network/AiNetworkManager.js';

class AIPingPong extends PingPong
{
	constructor(parameters)
	{
		super(parameters);
		this.gameMode = "ai";
		this.settings.maxPlayers = 1;
		console.log(`🎮 AIPingPong created with mode: ${this.gameMode}`);
		this.targetPaddlePosition = { x: 0, y: 0 };
		this.aiSettings = parameters.aiSettings || { difficulty: 'medium' };
		this._aiSendInterval = null;
		this._lastTargetY = null;
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
			// AI hedefini her frame takip et (decisions 1s'de bir gelir)
			const targetCenterY = (this._lastTargetY != null) ? this._lastTargetY : aiPaddle.pos.y;
			const paddleCenterY = aiPaddle.pos.y + aiPaddle.height / 2;
			const deadzone = 3;
			aiPaddle.up = false;
			aiPaddle.down = false;
			if (paddleCenterY > targetCenterY + deadzone)
				aiPaddle.up = true;
			else if (paddleCenterY < targetCenterY - deadzone)
				aiPaddle.down = true;
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

		return {
			currentState: this.status, // 'waiting', 'running', 'finished'
			gameData:
			{
				players: playerStates,
				ball: {
					...this.ball.getState(),
				},
				score: {
					left: this.team.get(1).score,
					right: this.team.get(2).score
				}
			},
		};
	}

	start()
	{
		this.status = 'countdown';
		// AI sunucusunda bu oyun için AI instance'ını başlat
		try
		{
			const difficulty = this.aiSettings?.difficulty || 'medium';
			AiNetwork.initGame(difficulty, this.id, this.aiSettings?.custom_settings || {});
		}
		catch (e)
		{
			console.error('❌ Failed to init AI game on AI server:', e);
		}
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
						AiNetwork.sendData(this.id,
							{
								ball:
								{
									x: this.ball.pos.x,
									y: this.ball.pos.y,
									speed_x: this.ball.directionX * this.ball.speed,
									speed_y: this.ball.directionY * this.ball.speed,
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
							}
						);
					}, 1000);
			}, 1000
		);

		// AI kararlarını dinle ve hedef Y'yi kaydet
		AiNetwork.on(`aiGame${this.id}_target`, (targetY) =>
		{
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
