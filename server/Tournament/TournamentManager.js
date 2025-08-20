import { TICK_RATE } from '../utils/constants.js';
import PingPong from './Pingpong/Pingpong.js';
import Tournament from './Tournament.js';

const exampleTournamentProperty = {
	name: "Example Tournament",
	playerCount: 8,
};

class TournamentManager
{
	constructor()
	{
		this.tournaments = new Map(); // tournamentId -> Tournament instance
		this.settings = null;
		this.updateInterval = null;
		this.lastUpdateTime = Date.now();
		this.updateInterval = null;
	}

	createUniqueTournamentId()
	{
		return `tournament-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
	}

	createTournament(property = exampleTournamentProperty)
	{
		const tournamentId = this.createUniqueTournamentId();
		if (this.tournaments.has(tournamentId))
			throw new Error(`Tournament with ID ${tournamentId} already exists`);
		if (!property.playerCount || Math.min(property.playerCount) < 2)
			throw new Error(`Invalid player count: ${property.playerCount}`);
		if (Math.log2(property.playerCount) % 1 !== 0)
			throw new Error(`Tournament Count must be a power of 2: ${property.playerCount}`);
		const tournament = new Tournament(property.name, property);
		this.tournaments.set(tournamentId, tournament);
		console.log(`🆕 Tournament ${tournamentId} created with properties: ${JSON.stringify(property)}`);
		return { tournamentId, tournament };
	}

	// TODOO: throwları ele al hangi throw nereye gidecek vs
	addPlayerToTournament(tournamentId, player)
	{
		const tournament = this.tournaments.get(tournamentId);
		if (!tournament)
			throw new Error(`Tournament with ID ${tournamentId} does not exist`);
		tournament.addParticipant(player);
	}

	initialize(callback)
	{
		this.updateInterval = setInterval(() => this.update(callback), TICK_RATE);
	}


	update(callback)
	{
		const currentTime = Date.now();
		const deltaTime = currentTime - this.lastUpdateTime;
		this.lastUpdateTime = currentTime;

		for (const tournament of this.tournaments.values())
		{
			callback({
				participants: tournament.participants,
				matchMakingInfo: tournament.getMatchmakingInfo(),
				tournamentState: tournament.getState()
			});
		}

	}
}

export default TournamentManager;
