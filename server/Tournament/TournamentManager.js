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
	}
	// example
	createTournament(tournamentId, property = exampleTournamentProperty)
	{
		if (this.tournaments.has(tournamentId))
			throw new Error(`Tournament with ID ${tournamentId} already exists`);
		if (!property.playerCount || Math.min(property.playerCount) < 2)
			throw new Error(`Invalid player count: ${property.playerCount}`);
		if (Math.log2(property.playerCount) % 1 !== 0)
			throw new Error(`Tournament Count must be a power of 2: ${property.playerCount}`);
		const tournament = new Tournament(property.name, property);
		this.tournaments.set(tournamentId, tournament);
		console.log(`🆕 Tournament ${tournamentId} created with properties: ${JSON.stringify(property)}`);
		return tournament;
	}

}

export default TournamentManager;
