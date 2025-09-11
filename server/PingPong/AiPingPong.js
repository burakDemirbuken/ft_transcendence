import PingPong from './PingPong.js';

class AIPingPong extends PingPong
{
	constructor(parameters)
	{
		super(parameters);
		this.gameMode = "ai";
		this.settings.maxPlayers = 1;
		console.log(`🎮 AIPingPong created with mode: ${this.gameMode}`);
		this.targetPosition = { x: 0, y: 0 };

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

		localPaddle.up = player.inputsGet('ArrowUp') || player.inputsGet('w');
		localPaddle.down = player.inputsGet('ArrowDown') || player.inputsGet('s');

		const aiPaddle = this.paddles.get("AI");
	}

	initializeGame()
	{
		super.initializeGame();
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
			}
		};
	}

	start()
	{
		if (this.status === 'not initialized')
			this.initializeGame();
		this.status = 'countdown';
		setTimeout(
			() =>
			{
				this.status = 'playing';
				this.emit('gameStarted');
				clearInterval(interval);
				const interval = setInterval(
					() =>
					{
						this.emit('ai_state',
							{
								type: "game_state",
								ball:
								{
									x: this.ball.position.x,
									y: this.ball.position.y,
									speed_x: this.ball.speed,
									speed_y: this.ball.speed,
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
								}
							}
						);
					}, 1000);
			}, 1000
		);
	}

	stop()
	{
		this.status = 'stopped';
		// interval stop
		console.log(`⏸️ Game stopped`);
	}
}

export default AIPingPong;
