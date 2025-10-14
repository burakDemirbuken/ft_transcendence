import EventEmitter from './EventEmitter.js';

export default class Room extends EventEmitter
{
	constructor(name, gameSettings)
	{
		super();
		this.name = name;
		this.gameMode = null;
		this.status = 'startable'; // "waiting", "in_game", "completed", "startable"
		this.maxPlayers = null;
		this.host = null;
		this.players = [];
		this.gameSettings = gameSettings;
		this.createdAt = Date.now();
	}

	addPlayer(player)
	{
		if (this.players.length >= this.maxPlayers)
			throw new Error('Room is full');
		if (this.players.length === 0)
			this.host = player.id;
		this.players.push(player);
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
		if (this.host !== playerId)
			throw new Error('Only the host can start the game');
		if (this.allPlayersReady() === false)
			throw new Error('Cannot start game, not all players are ready or room is not full');
		if (this.players.length !== this.maxPlayers)
			throw new Error('Room is not full');

		this.status = 'in_game';
		return {
			gameSettings: this.gameSettings,
			players: this.players.map(p => p.getState(this.host)),
			gameMode: this.gameMode,
		};
	}

	allPlayersReady()
	{
		return this.players.every(p => p.isReady);
	}

	finishRoom(payload)
	{
		this.status = 'finished';
		this.emit('finished', { ...payload });
	}

	getState()
	{
		return {
			name: this.name,
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
