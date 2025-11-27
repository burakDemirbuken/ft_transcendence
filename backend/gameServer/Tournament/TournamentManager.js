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

	async createTournament(id, maxPlayers, matches)
	{
		const tournamentId = id;
		const tournament = new Tournament(maxPlayers);
		tournament.setupMatches(matches);
		tournament.on('update', ({data, players}) => this.emit(`tournament_${tournamentId}`, { type: 'update', payload: data, players: players }));
		tournament.on('finished', (data) =>
			{
				setTimeout(() => {
					this.emit(`tournament_${tournamentId}`, { type: 'finished', payload: data });
					this.tournaments?.get(tournamentId)?.destroy();
					this.tournaments?.delete(tournamentId);
					console.log(`🗑️ Tournament ${tournamentId} deleted after finishing`);
				}, 3000);
			}
		);
		tournament.on('error', (error) => this.emit('error', new Error(`Tournament ${tournamentId} error: ${error.message}`)));
		this.tournaments.set(tournamentId, tournament);
		return tournamentId;
	}

	nextRound(TournamentId)
	{
		const tournament = this.tournaments.get(TournamentId);
		if (!tournament)
			throw new Error(`Tournament with ID ${TournamentId} does not exist`);
		this.emit(`tournament_${TournamentId}`, { type: 'nextRound', payload: tournament.initData(), players: tournament.players });
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

	registerPlayer(tournamentId, player)
	{
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament)
			return this.emit('error', new Error(`Tournament with ID ${tournamentId} does not exist`));
		tournament.registerPlayer(player);
		console.log(`👤 Player ${player} registered for tournament ${tournamentId}`);
	}

	addPlayerToTournament(tournamentId, player)
	{
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
			tournament.update(deltaTime);

	}
}

export default TournamentManager;
