import Room from "./Room.js";

export default class ClassicRoom extends Room
{
	constructor(name)
	{
		const gameSettings = {
			paddleWidth: 10,
			paddleHeight: 100,
			paddleSpeed: 700,
			ballRadius: 7,
			ballSpeed: 600,
			ballSpeedIncrease: 100,
			maxScore: 11
		};
		super(name, gameSettings);
		this.gameMode = 'classic';
		this.maxPlayers = 2;
	}
}
