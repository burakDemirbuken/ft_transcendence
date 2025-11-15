import Room from "./Room.js";
import gameSettings from './defaultGameSettings.js';

export default class ClassicRoom extends Room
{
	constructor()
	{
		super(gameSettings);
		this.gameMode = 'classic';
		this.maxPlayers = 2;
	}
}
