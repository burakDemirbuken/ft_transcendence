import PingPong from './PingPong.js';

class LocalPingPong extends PingPong
{
	constructor(property)
	{
		super(property);
		this.gameMode = "local";
		this.settings.maxPlayers = 1;
		console.log(`🎮 LocalPingPong created with mode: ${this.gameMode}`);
	}

	addPlayer(player)
	{
		if (this.players.length !== 0)
			throw new Error("LocalPingPong can only have one player");
		this.players.push(player);
		this.team.set(1, { playersId: [player.id], score: 0 });
		this.team.set(2, { playersId: ["Player2"], score: 0 });
		this.paddles.set(player.id, this.createPaddle(2));
		this.paddles.set("Player2", this.createPaddle(1));
	}

	paddleControls()
	{
		const player = this.players[0];
		const localPlayer = this.paddles.get(this.players[0].id);
		const localPaddle = this.paddles.get("Player2");

		localPaddle.up = player.inputsGet('ArrowUp');
		localPaddle.down = player.inputsGet('ArrowDown');

		localPlayer.up = player.inputsGet('w');
		localPlayer.down = player.inputsGet('s');
	}

	// değişicek
	getGameState()
	{
		const playerStates = [
			{
				id: this.players[0].id,
				name: this.players[0].name,
				...this.paddles.get(this.players[0].id).getState(),
			},
			{
				id: "Player2",
				name: "Player2",
				...this.paddles.get("Player2").getState(),
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
				},
			}
		};
	}

}

export default LocalPingPong;
