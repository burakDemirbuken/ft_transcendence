import Room from "./Room.js";

export default class MultiplayerRoom extends Room
{
	constructor(name, gameSettings)
	{
		super(name, gameSettings);
		this.gameMode = 'multiplayer';
		this.maxPlayers = 4;
		this.createdAt = Date.now();
	}
}
