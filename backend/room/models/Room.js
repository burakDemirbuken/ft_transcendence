import EventEmitter from './EventEmitter.js';

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
		this.participants = [];
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
		this.participants.push(player);
	}

	removePlayer(playerId)
	{
		this.players = this.players.filter(p => p.id !== playerId);
		if (this.status === 'waiting')
			this.participants = this.participants.filter(p => p.id !== playerId);
		if (this.host === playerId)
			this.host = this.players[0]?.id;
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
			players: this.players.map(p => p.getState(this.host).id),
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
		this.emit('finished', { state: payload, players: this.players });
		return { state: payload, players: this.players };
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
