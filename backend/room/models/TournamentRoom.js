import Room from './Room.js';

export default class TournamentRoom extends Room
{
	constructor(name, gameSettings, tournamentSettings)
	{
		super(name, gameSettings);
		this.gameMode = 'tournament';

		this.tournamentSettings = tournamentSettings;
		this.maxPlayers = tournamentSettings.maxPlayers || 8;
		this.spectators = [];

		this.matches = new Map(); // Round -> Matchs array

		this.currentMatches = [];
		this.currentRound = 0;
		this.maxRounds = Math.log2(this.maxPlayers);

		for (let i = 0; i < this.maxRounds; i++)
		{
			const matchs = [];
			const matchCount = Math.pow(2, this.maxRounds - i - 1);

			for (let j = 0; j < matchCount; j++)
			{
				matchs.push({
						round: i,
						matchNumber: j,
						player1: null,
						player2: null,
						player1Score: null,
						player2Score: null,
						winner: null,
						loser: null,
					}
				);
			}
			this.matches.set(i, matchs);
		}
		this.status = 'waiting'; // 'waiting', 'running', 'finished', "ready2start"
	}

	initData()
	{
		let playingPlayers = [];
		this.currentMatches.forEach(match => {
			if (match.player1) playingPlayers.push(match.player1);
			if (match.player2) playingPlayers.push(match.player2);
		});
		return {
			tournament:
			{
				name: this.tournamentName,
				maxPlayers: this.maxPlayers,
			},
			gameCount: this.currentMatches.length,
			playersCount: this.players.length,
			games: this.currentMatches.map(match => ({
				matchNumber: match.matchNumber,
				players: [match.player1?.id, match.player2?.id],
			})),
			gameSettings: this.gameSettings,
			gameMode: this.gameMode,
			players: playingPlayers.map(p => ({
				id: p.id,
				name: p.name,
				gameNumber: this.currentMatches.findIndex(m => m.player1?.id === p.id || m.player2?.id === p.id) + 1
			})),
		}
	}





	// ---------------------------------------------------------------------




	finishRoom(matches)
	{
		if (this.currentRound === this.maxRounds - 1)
		{
			this.status = 'finished';
		}
		else
		{
			this.nextRound(matches);
		}
	}

	startGame(playerId)
	{
		if (this.host !== playerId)
			throw new Error('Only the host can start the game');
		if (this.allPlayersReady() === false)
			throw new Error('Cannot start game, not all players are ready or room is not full');
		if (this.players.length < 2)
			throw new Error('At least 2 players are required to start a tournament');

		this.status = 'in_game';

		const matches = this.currentMatches;
		let playingPlayers = [];
		matches.forEach(match => {
			if (match.player1) playingPlayers.push(match.player1.id);
			if (match.player2) playingPlayers.push(match.player2.id);
		});
		return {
			players: playingPlayers,
			gameMode: this.gameMode,
			maxPlayers: this.maxPlayers,
			matches: matches
		};
	}

	matchMake()
	{
		if (this.status !== 'waiting')
			return this.emit('error', new Error(`Tournament is not in waiting state, current status: ${this.status}`));
		//	if (this.players.length < this.playerCount)
		//		return this.emit('error', new Error(`Not enough players to start matchmaking, current count: ${this.players.length}, required: ${this.playerCount}`));

		function shuffle(array)
		{
			const arr = [...array];
			for (let i = arr.length - 1; i > 0; i--)
			{
				const j = Math.floor(Math.random() * (i + 1));
				[arr[i], arr[j]] = [arr[j], arr[i]];
			}
			return arr;
		}
		this.players = shuffle(this.players);
		let matchs = this.matches.get(this.currentRound);
		for (let i = 0; i < this.players.length; i += 2)
		{
			const match = matchs[i / 2];
			match.player1 = this.players[i].getState();
			match.player2 = this.players[i + 1].getState();
			match.player1Score = 0;
			match.player2Score = 0;
			match.winner = null;
			match.loser = null;
			this.currentMatches.push(match);
		}
		return this.getMatchmakingInfo();
	}

	getMatchmakingInfo()
	{
		const rounds = [];

		this.matches.forEach((matchsArray, roundIndex) => {
			rounds.push({
				round: roundIndex,
				matchs: matchsArray.map(match => ({
					matchId: match.matchId,
					matchNumber: match.matchNumber,
					matchStatus: match.matchStatus,
					player1: match.player1,
					player2: match.player2,
					score: match.score,
					winner: match.winner,
					loser: match.loser,
				}))
			});
		});

		return {
			currentRound: this.currentRound,
			rounds: rounds
		};
	}

	nextRound(matches)
	{
		this.currentMatches = [];
		const previousRoundMatches = this.matches.get(this.currentRound);
		previousRoundMatches.forEach(
			(match, index) =>
			{
				if (matches[index]) {
					match.player1Score = matches[index].score?.team1 || 0;
					match.player2Score = matches[index].score?.team2 || 0;
					match.winner = matches[index].winner;
					match.loser = matches[index].loser;
				}
			}
		);
		this.currentRound++;
		const nextRoundMatches = this.matches.get(this.currentRound);
		for (let i = 0; i < nextRoundMatches.length; i++)
		{
			const match = nextRoundMatches[i];
			const prevMatch1 = previousRoundMatches[i * 2];
			const prevMatch2 = previousRoundMatches[i * 2 + 1];

			if (prevMatch1.winner) {
				const player1 = this.players.find(p => p.id === prevMatch1.winner);
				match.player1 = player1 ? player1.getState() : null;
			}
			if (prevMatch2.winner) {
				const player2 = this.players.find(p => p.id === prevMatch2.winner);
				match.player2 = player2 ? player2.getState() : null;
			}

			match.player1Score = 0;
			match.player2Score = 0;
			match.winner = null;
			match.loser = null;
			this.currentMatches.push(match);
		}
		this.status = 'waiting';
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
