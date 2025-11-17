import Room from "./Room.js";

export default class LocalRoom extends Room
{
	constructor(gameSettings)
	{
		super(gameSettings);
		this.gameMode = 'local';
		this.maxPlayers = 1;
	}

	getState()
	{
		return {
			id: this.id,
			gameMode: this.gameMode,
			status: this.status,
			maxPlayers: 2,
			host: this.host,
			players: [this.players[0]?.getState(this.host), { id: "Player2", name: "Player2" }],
			spectators: this.spectators,
			gameSettings: this.gameSettings,
			createdAt: this.createdAt
		};
	}
}
