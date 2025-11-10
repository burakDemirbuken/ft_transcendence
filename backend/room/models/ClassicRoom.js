import Room from "./Room.js";
import gameSettings from './defaultGameSettings.js';

export default class ClassicRoom extends Room
{
	constructor(name)
	{
		super(name, gameSettings);
		this.gameMode = 'classic';
		this.maxPlayers = 2;
	}
}
