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
		setTimeout(
			() =>
			{
				this.status = 'playing';
				this.emit('gameStarted');
				const interval = setInterval(
					() =>
					{
						AiNetwork.sendData(this.id,
							{
								ball:
								{
									x: this.ball.pos.x,
									y: this.ball.pos.y,
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
								},
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
