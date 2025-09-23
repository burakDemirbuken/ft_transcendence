import Room from './Room.js';

export default class TournamentRoom extends Room
{
	constructor(name, gameSettings)
	{
		super(name, gameSettings);
		this.gameMode = 'tournament';
		this.maxPlayers = gameSettings.tournamentSettings.maxPlayers || 8;
		this.spectators = [];
	}

	addSpectator(spectator)
	{
		if (this.spectators.find(s => s.id === spectator.id))
			throw new Error('Spectator already in room');
		if (this.players.find(p => p.id === spectator.id))
			this.removePlayer(spectator.id);
		this.spectators.push(spectator);
	}

	startGame(playerId)
	{
		if (this.status !== 'startable')
			throw new Error('Cannot start game, not all players are ready or room is not full');
		if (this.host !== playerId)
			throw new Error('Only the host can start the game');
		if (this.players.length < 2)
			throw new Error('At least 2 players are required to start a tournament');

		this.status = 'in_game';
		this.emit('gameStarted', {
			gameSettings: this.gameSettings,
			players: this.players
		});
	}

	nextRound()
	{

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
			// Additional tournament-specific state can be added here
		};
	}
}
