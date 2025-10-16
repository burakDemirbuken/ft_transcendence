import Room from "./Room.js";

export default class LocalRoom extends Room
{
	constructor(name, gameSettings)
	{
		super(name, gameSettings);
		this.gameMode = 'local';
		this.maxPlayers = 1;
	}

	getState()
	{
		return {
			id: this.id,
			name: this.name,
			gameMode: this.gameMode,
			status: this.status,
			maxPlayers: this.maxPlayers,
			host: this.host,
			players: [this.players[0]?.getState(this.host) || { id: "Player2", name: "empty" }],
			spectators: this.spectators,
			gameSettings: this.gameSettings,
			createdAt: this.createdAt
		};
	}
}
