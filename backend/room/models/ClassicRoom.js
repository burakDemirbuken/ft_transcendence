import Room from "./Room.js";

export default class ClassicRoom extends Room
{
	constructor(gameSettings)
	{
		super(gameSettings);
		this.gameMode = 'classic';
		this.maxPlayers = 2;
	}
}
