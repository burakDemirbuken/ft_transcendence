import { TICK_RATE } from '../utils/constants.js';
import Tournament from './Tournament.js';
import EventEmitter from '../utils/EventEmitter.js';

const exampleTournamentProperty = {
	name: "Example Tournament",
	playerCount: 8,
};

class TournamentManager extends EventEmitter
{
	constructor()
	{
		super();
		this.tournaments = new Map(); // tournamentId -> Tournament instance
		this.settings = null;
		this.updateInterval = null;
		this.lastUpdateTime = Date.now();
	}

	start()
	{
		this.updateInterval = setInterval(() => this.update(), TICK_RATE);
	}

	createUniqueTournamentId()
	{
		return `tournament-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
	}

	createTournament(gameSettings, tournamentSettings)
	{
		const tournamentId = this.createUniqueTournamentId();
		if (this.tournaments.has(tournamentId))
			throw new Error(`Tournament with ID ${tournamentId} already exists`);
		if (!tournamentSettings.maxPlayers || Math.min(tournamentSettings.maxPlayers) < 2)
			throw new Error(`Invalid player count: ${tournamentSettings.maxPlayers}`);
		if (Math.log2(tournamentSettings.maxPlayers) % 1 !== 0)
			throw new Error(`Tournament Count must be a power of 2: ${tournamentSettings.maxPlayers}`);
		const tournament = new Tournament(tournamentSettings, gameSettings);
		tournament.on('update', ({data, players}) => this.emit(`tournament_${tournamentId}`, { type: 'update', payload: data, players: players }));
		tournament.on('finished', ({data, players}) => this.emit(`tournament_${tournamentId}`, { type: 'finished', payload: data, players: players }));
		tournament.on('matchmaking', ({data, players}) => this.emit(`tournament_${tournamentId}`, { type: 'matchmaking', payload: data, players: players }));
		tournament.on('nextRound', ({data, players}) => this.emit(`tournament_${tournamentId}`, { type: 'nextRound', payload: data, players: players }));
		tournament.on('started',
			({data, players}) =>
				{
					console.log(`🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁`, JSON.stringify(data, null ,2));
					this.emit(`tournament_${tournamentId}`, { type: 'started', payload: data, players: players });
				}
		);
		tournament.on('error', (error) => this.emit('error', new Error(`Tournament ${tournamentId} error: ${error.message}`)));
		this.tournaments.set(tournamentId, tournament);
		return tournamentId;
	}

	initTournament(TournamentId)
	{
		const tournament = this.tournaments.get(TournamentId);
		if (!tournament)
			throw new Error(`Tournament with ID ${TournamentId} does not exist`);
		return tournament.init();
	}

	leaveTournament(playerId)
	{
		for (const [tournamentId, tournament] of this.tournaments.entries())
		{
			if (tournament.players.find(p => p.id === playerId))
			{
				this.removePlayerFromTournament(tournamentId, playerId);
				return;
			}
		}
	}

	removePlayerFromTournament(tournamentId, playerId)
	{
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament)
			return this.emit('error', new Error(`Tournament with ID ${tournamentId} does not exist`));
		tournament.removePlayer(playerId);
		console.log(`👤 Player ${playerId} removed from tournament ${tournamentId}`);
		if (tournament.isEmpty())
		{
			this.tournaments.get(tournamentId).destroy();
			this.tournaments.delete(tournamentId);
			console.log(`🗑️ Tournament ${tournamentId} deleted as it became empty`);
		}
	}

	// TODOO: throwları ele al hangi throw nereye gidecek vs
	joinTournament(tournamentId, player)
	{
		console.log(`Player ${player.id} joining tournament ${tournamentId}`);
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament)
			return this.emit('error', new Error(`Tournament with ID ${tournamentId} does not exist`));

		tournament.addPlayer(player);
		console.log(`Player ${player.id} joined tournament ${tournamentId}`);
	}

	update()
	{
		const currentTime = Date.now();
		const deltaTime = currentTime - this.lastUpdateTime;
		this.lastUpdateTime = currentTime;

		for (const [tournamentId, tournament] of this.tournaments.entries())
		{
			if (tournament.isRunning())
			{
				tournament.update(deltaTime);
			}
			else if (tournament.status === `waiting`)
			{
				if (tournament.players.every(p => p.initialized))
					tournament.start();
			}
			if (tournament.isFinished())
			{
				console.log(`🏁 Tournament ${tournamentId} finished`);
				this.emit(`tournament_${tournamentId}`,{type: 'finished', payload: tournament.getFinishedInfo(), players: tournament.participants});
				this.tournaments.delete(tournamentId);
				continue;
			}
		}

	}
}

export default TournamentManager;
