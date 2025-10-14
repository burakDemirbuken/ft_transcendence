import Room from "./Room.js";

export default class LocalRoom extends Room
{
	constructor(name, gameSettings)
	{
		super(name, gameSettings);
		this.gameMode = 'local';
		this.maxPlayers = 1;
	}
}
