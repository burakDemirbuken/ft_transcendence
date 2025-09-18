/*
const examplGameState:
{
	currentState: 'waiting', // 'waiting', 'playing', 'finished'
	gameMode: 'single', // 'single', 'tournament', 'Ai', 'multiplayer'
	gameId: 'game_12345',
	gameData:
	{
		player1:
		{
			id: 'player1',
			name: 'Player 1',
			score: 0,
			position:
			{
				x: 0,
				y: 0
			}
		},
		player2:
		{
			id: 'player2',
			name: 'Player 2',
			score: 0,
			position:
			{
				x: 0,
				y: 0
			}
		},
		ball:
		{
			position:
			{
				x: 0,
				y: 0
			},
			direction:
			{
				x: 1,
				y: 1
			},
			speed: 5
		},
		score: { player1: 0, player2: 0 },
		turn: 'player1',
	}
}
*/

/*

const exampleGameConfig = {
	type: "config",

	payload:
	{
		gameMode: "multiple", // "local", "online", "tournament", "ai"

		arcade:
		{
			position:
			{
				x: 0,
				y: 0,
				z: 0
			},
			type: "classic", // "classic", "modern", "pong1971"
			machine:
			{
				path: "../models/arcade/classic/",
				model: "arcade.obj",
				colors:
				{
					body: "#FF0000",
					sides: "#00FF00",
					joystick: "#0000FF",
					buttons: "#FFFF00"
				}
			}
		},
		gameRender:
		{
			colors:
			{
				background: "#000000",
				paddle: "#FFFFFF",
				ball: "#FFFFFF",
				text: "#FFFFFF",
				accent: "#00FF00"
			},
			paddleSize:
			{
				width: 10,
			}
		},
	}
};


*/


export class GameStateManager
{
	constructor()
	{
		this.gameState = null;
		this.gameMode = null;
		this.currentState = 'waiting'; // 'waiting', 'playing', 'finished'
		this.callbacks = new Map();
	}

	setState(newState)
	{
		const oldState = this.currentState;
		this.currentState = newState;
		this.triggerCallback('stateChanged', { oldState, newState });
	}

	on(event, callback)
	{
		if (!this.callbacks.has(event))
			this.callbacks.set(event, []);
		this.callbacks.get(event).push(callback);
	}

	triggerCallback(event, data)
	{
		if (this.callbacks.has(event))
			this.callbacks.get(event).forEach(callback => callback(data));
	}
}

export default GameStateManager;
