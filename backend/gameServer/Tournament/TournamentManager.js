import { TICK_RATE } from '../utils/constants.js';
import PingPong from '../PingPong/PingPong.js';
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
		tournament.on('update', ({data, players}) => this.emit(`tournament_${tournamentId}`, { type: 'update', payload: data, players }));
		tournament.on('finished', ({data, players}) => this.emit(`tournament_${tournamentId}`, { type: 'finished', payload: data, players }));
		tournament.on('matchmaking', ({data, players}) => this.emit(`tournament_${tournamentId}`, { type: 'matchmaking', payload: data, players }));
		tournament.on('nextRound', ({data, players}) => this.emit(`tournament_${tournamentId}`, { type: 'nextRound', payload: data, players }));
		tournament.on('started',
			({data, players}) =>
				{
					console.log(`🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁`, JSON.stringify(data, null ,2));
					this.emit(`tournament_${tournamentId}`, { type: 'started', payload: data, players });
				}
		);
		tournament.on('error', (error) => this.emit('error', new Error(`Tournament ${tournamentId} error: ${error.message}`)));
		this.tournaments.set(tournamentId, tournament);
		return {tournamentId: tournamentId, initialData: tournament.initialData()};
	}

	leaveTournament(tournamentId, player)
	{
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament)
			return this.emit('error', new Error(`Tournament with ID ${tournamentId} does not exist`));
		tournament.removeParticipant(player);
		if (tournament.isEmpty())
		{
			this.tournaments.delete(tournamentId);
			console.log(`🗑️ Tournament ${tournamentId} deleted as it became empty`);
		}
	}

	// TODOO: throwları ele al hangi throw nereye gidecek vs
	joinTournament(tournamentId, player)
	{
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament)
			return this.emit('error', new Error(`Tournament with ID ${tournamentId} does not exist`));
		tournament.addParticipant(player);
	}

	startTournament(tournamentId)
	{
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament)
			return this.emit('error', new Error(`Tournament with ID ${tournamentId} does not exist`));
		tournament.start();
	}

	update()
	{
		const currentTime = Date.now();
		const deltaTime = currentTime - this.lastUpdateTime;
		this.lastUpdateTime = currentTime;

		for (const [tournamentId, tournament] of this.tournaments.entries())
		{
			tournament.update(deltaTime);
			if (tournament.isFinished())
			{
				console.log(`🏁 Tournament ${tournamentId} finished`);
				this.emit(`tournament_${tournamentId}`,{type: 'finished', payload: tournament.getFinishedInfo(), players: tournament.participants});
				this.tournaments.delete(tournamentId);
				continue;
			}

			this.emit(`tournament_${tournamentId}`, {
				type: 'update',
				payload: {
					participants: tournament.participants,
					data:
					{
						matchMakingInfo: tournament.getMatchmakingInfo(),
						tournamentState: tournament.getState()
					}
				}
			});
		}

	}
}

export default TournamentManager;
