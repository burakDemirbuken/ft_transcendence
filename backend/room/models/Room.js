import EventEmitter from './EventEmitter.js';

export default class Room extends EventEmitter
{
	constructor(gameSettings)
	{
		super();
		let errorMessage = "";
		if (gameSettings.paddleWidth <= 0)
			errorMessage += "Paddle Width cannot be negative"
		if (gameSettings.paddleHeight <= 0)
			errorMessage += "Paddle Height cannot be negative"
		if (gameSettings.paddleSpeed <= 0)
			errorMessage += "Paddle Speed cannot be negative"
		if (gameSettings.ballRadius <= 0)
			errorMessage += "Ball Radius cannot be negative"
		if (gameSettings.ballSpeed <= 0)
			errorMessage += "Ball speed cannot be negative"
		if (gameSettings.ballSpeedIncrease <= 0)
			errorMessage += "Ball Speed Increase cannot be negative"
		if (gameSettings.maxScore <= 0)
			errorMessage += "Max score cannot be negative"
		if (errorMessage !== "")
			throw new Error(errorMessage);

		this.gameMode = null;
		this.gameType = 'classic';
		this.status = 'waiting'; // "waiting", "in_game", "completed", "startable"
		this.maxPlayers = null;
		this.host = null;
		this.players = [];
		this.participants = [];
		this.gameSettings = gameSettings;
		this.createdAt = Date.now();
	}

	addPlayer(player)
	{
		if (this.status !== 'waiting')
			throw new Error('Match has already started');
		if (this.players.length >= this.maxPlayers)
			throw new Error('Room is full');
		if (this.players.length === 0)
			this.host = player.id;
		this.players.push(player);
		this.participants.push(player);
		if (this.players.length == this.maxPlayers)
			this.status = "startable";
	}

	removePlayer(playerId)
	{
		this.status = "waiting";
		this.players = this.players.filter(p => p.id !== playerId);
		if (this.status === 'waiting' || this.status == "startable")
			this.participants = this.participants.filter(p => p.id !== playerId);
		if (this.host === playerId)
			this.host = this.players[0]?.id;

	}

	startGame(playerId)
	{
		
		if (this.host !== playerId)
			throw new Error('Only the host can start the game');
		if (this.players.length !== this.maxPlayers)
			throw new Error('Room is not full');

		this.status = 'in_game';
		return {
			gameSettings: this.gameSettings,
			players: this.players.map(p => p.getState(this.host).id),
			gameMode: this.gameMode,
		};
	}

	finishRoom(payload)
	{
		this.status = 'finished';
		const players = [...this.players];
		this.emit('finished', {
			...payload,
			gameSettings: this.gameSettings,
			kickedPlayers: [...this.players.map(p => p.id)],
		});
		return { state: payload, players: players };
	}
1
	getState()
	{
		return {
			gameMode: this.gameMode,
			status: this.status,
			maxPlayers: this.maxPlayers,
			players: this.players.map(p => p.getState(this.host)),
			gameSettings: this.gameSettings,
			createdAt: this.createdAt,
		};
	}

	initData()
	{
		return {
			gameMode: this.gameMode,
			gameSettings: this.gameSettings,
		}
	}
}
