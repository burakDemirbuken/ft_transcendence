import EventEmitter from '../utils/EventEmitter.js';

export default class Room extends EventEmitter
{
	constructor(name, gameSettings)
	{
		super();
		this.name = name;
		this.gameMode = null;
		this.status = 'waiting'; // "waiting", "in_game", "completed", "startable"
		this.maxPlayers = null;
		this.host = null;
		this.players = [];
		//? izleyiciler eklenebilir mi?
		// spectators: [];
		this.gameSettings = gameSettings;
		this.createdAt = Date.now();
	}

	addPlayer(player)
	{
		if (this.players.length >= this.maxPlayers)
			throw new Error('Room is full');
		if (this.players.length === 0)
			this.host = player.id;
		this.players.push({ ...player, isReady: false });
	}

	removePlayer(playerId)
	{
		this.players = this.players.filter(p => p.id !== playerId);
		if (this.players.length < this.maxPlayers)
			this.status = 'waiting';
		if (this.players.length === 0)
			this.status = 'completed';
	}

	setPlayerReady(playerId, isReady)
	{
		const player = this.players.find(p => p.id === playerId);
		if (player)
			player.isReady = isReady;
		if (this.players.every(p => p.isReady) && this.players.length === this.maxPlayers)
			this.status = 'startable';
		else
			this.status = 'waiting';
	}

	startGame(playerId)
	{
		if (this.status !== 'startable')
			throw new Error('Cannot start game, not all players are ready or room is not full');
		if (this.host !== playerId)
			throw new Error('Only the host can start the game');
		if (this.players.length !== this.maxPlayers)
			throw new Error('Room is not full');

		this.status = 'in_game';
		return {
			gameSettings: this.gameSettings,
			players: this.players,
			gameMode: this.gameMode,
		};
	}

	getState()
	{
		return {
			name: this.name,
			gameMode: this.gameMode,
			status: this.status,
			maxPlayers: this.maxPlayers,
			host: this.host,
			players: this.players,
			gameSettings: this.gameSettings,
			createdAt: this.createdAt,
		};
	}
}
