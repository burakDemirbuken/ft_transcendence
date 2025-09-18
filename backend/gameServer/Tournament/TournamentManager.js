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

	createTournament(property = exampleTournamentProperty)
	{
		const tournamentId = this.createUniqueTournamentId();
		if (this.tournaments.has(tournamentId))
			return (this.emit('error', new Error(`Tournament with ID ${tournamentId} already exists`)));
		if (!property.playerCount || Math.min(property.playerCount) < 2)
			return (this.emit('error', new Error(`Invalid player count: ${property.playerCount}`)));
		if (Math.log2(property.playerCount) % 1 !== 0)
			return (this.emit('error', new Error(`Tournament Count must be a power of 2: ${property.playerCount}`)));
		const tournament = new Tournament(property.name, property);
		tournament.on('update', (data) => this.emit(`tournament_${tournamentId}`, { type: 'update', payload: data }));
		tournament.on('finished', (data) => this.emit(`tournament_${tournamentId}`, { type: 'finished', payload: data }));
		tournament.on('matchmaking', (data) => this.emit(`tournament_${tournamentId}`, { type: 'matchmaking', payload: data }));
		tournament.on('error', (error) =>
		{
			// hata durumlarında kullanıcıya bildirim gönder
		});
		tournament.on('started', (data) => this.emit(`tournament_${tournamentId}`, { type: 'started', payload: data }));
		this.tournaments.set(tournamentId, tournament);
		console.log(`🆕 Tournament ${tournamentId} created with properties: ${JSON.stringify(property)}`);
		return tournamentId;
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

	startTournament(tournamentId, playerId)
	{
		// TODOO: sadece admin başlatabilmeli
		// TODOO: Herkes hazır mı kontrolü
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament)
			return this.emit('error', new Error(`Tournament with ID ${tournamentId} does not exist`));
		tournament.start();
	}

	stop()
	{
		if (this.updateInterval)
		{
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
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
				this.emit(`tournament_${tournamentId}`,{type: 'finished', payload: tournament.getFinishedInfo()});
				this.tournaments.delete(tournamentId);
				continue;
			}

			this.emit(`tournament_${tournamentId}`, {
				type: 'update',
				payload: {
					participants: tournament.participants,
					matchMakingInfo: tournament.getMatchmakingInfo(),
					tournamentState: tournament.getState()
				}
			});
		}

	}
}

export default TournamentManager;
