import Room from "./Room.js";

export default class ClassicRoom extends Room
{
	constructor(name, gameSettings)
	{
		super(name, gameSettings);
		this.gameMode = 'classic';
		this.maxPlayers = 2;
	}
}
