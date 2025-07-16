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

// TODOO: veriler düzenlenecek, oyun durumu ve oyun verileri ayrı olacak
class GameStateManager
{
	constructor()
	{
		this.gameData = null;
		this.gameMode = null;
		this.currentState = 'waiting'; // 'waiting', 'playing', 'finished', 'countDown', 'paused'
		this.callbacks = new Map();
	}

	setState(newState)
	{
		const oldState = this.currentState;
		this.currentState = newState;
		this.triggerCallback('stateChanged', { oldState, newState });
	}

	updateGameData(data)
	{
		this.gameData = data;
		this.triggerCallback('gameDataUpdated', data);
	}

	getGameData()
	{
		return this.gameData;
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
