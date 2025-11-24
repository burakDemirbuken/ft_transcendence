import PingPong from './PingPong.js';

class LocalPingPong extends PingPong
{
	constructor(property)
	{
		super(property);
		this.gameMode = "local";
		this.maxPlayers = 1;
		console.log(`🎮 LocalPingPong created with mode: ${this.gameMode}`);
	}

	addRegisteredPlayer(playerId)
	{
		this.registeredPlayers.add(playerId);
		this.team.set(2, { playersId: [playerId], score: 0 });
		this.team.set(1, { playersId: ["Player2"], score: 0 });
		this.paddles.set(playerId, this.createPaddle(1));
		this.paddles.set("Player2", this.createPaddle(2));
	}

	paddleControls()
	{
		const player = this.players[0];
		if (!player) return;
		const localPlayer = this.paddles.get(player.id);
		const localPaddle = this.paddles.get("Player2");

		localPaddle.up = player.inputGet('ArrowUp');
		localPaddle.down = player.inputGet('ArrowDown');

		localPlayer.up = player.inputGet('w');
		localPlayer.down = player.inputGet('s');
	}

	getGameState()
	{
		const player = this.players[0];

		const playerStates = [
			{
				id: player?.id,
				name: player?.name,
				...this.paddles.get(player?.id)?.getState(),
			},
			{
				id: "Player2",
				name: "Player2",
				...this.paddles.get("Player2").getState(),
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
				},
			}
		};
	}

}

export default LocalPingPong;
