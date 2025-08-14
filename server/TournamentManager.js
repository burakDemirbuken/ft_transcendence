import PingPong from './Pingpong/Pingpong.js';

const exampleTournamentProperty = {
	maxPlayers: 8,
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
		const tournament = new Tournament(property);
		this.tournaments.set(tournamentId, tournament);
		console.log(`🆕 Tournament ${tournamentId} created with properties: ${JSON.stringify(tournamentProperties)}`);
		return tournament;
	}

}

export default TournamentManager;
