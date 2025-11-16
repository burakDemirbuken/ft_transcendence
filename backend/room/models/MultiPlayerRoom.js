import Room from "./Room.js";

export default class MultiplayerRoom extends Room
{
	constructor(gameSettings)
	{
		super(gameSettings);
		this.gameMode = 'multiplayer';
		this.maxPlayers = 4;
		this.createdAt = Date.now();
	}

	getState()
	{
		return {
			id: this.id,
			gameMode: this.gameMode,
			status: this.status,
			maxPlayers: this.maxPlayers,
			host: this.host,
			team: {
				1: [this.players[0]?.getState(this.host) || { id: null, name: "empty"}, this.players[2]?.getState(this.host) || { id: null, name: "empty"}],
				2: [this.players[1]?.getState(this.host) || { id: null, name: "empty"}, this.players[3]?.getState(this.host) || { id: null, name: "empty"}],
			},
			players: this.players.map(p => p.getState(this.host)),
			spectators: this.spectators,
			gameSettings: this.gameSettings,
			createdAt: this.createdAt
		};
	}
}

