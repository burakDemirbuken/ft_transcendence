import Room from './Room.js';
import gameSettings from './defaultGameSettings.js';

export default class TournamentRoom extends Room
{

	constructor(name, tournamentSettings)
	{
		super(name, gameSettings);
		this.gameType = 'tournament';
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
						state: null,
						time: null,
					}
				);
			}
			this.matches.set(i, matchs);
		}
		this.status = 'waiting'; // 'waiting', 'running', 'finished', "ready2start"
	}

	addPlayer(player)
	{
		super.addPlayer(player);
		if (this.players.length === this.maxPlayers)
			this.status = 'ready2match';
	}

	removePlayer(playerId)
	{
		if (this.spectators.find(s => s.id === playerId))
			this.spectators = this.spectators.filter(s => s.id !== playerId);
		else
			super.removePlayer(playerId);
		if ((this.status === "waiting" || this.status === "ready2match") && this.players.length < this.maxPlayers)
			this.status = 'waiting';
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
			games: this.currentMatches.map(match => ({
				matchNumber: match.matchNumber,
				players: [match.player1, match.player2],
			})),
			gameSettings: this.gameSettings,
			gameMode: this.gameMode,
			players: playingPlayers.map(p => ({
				id: p.id,
				name: p.name,
				gameNumber: this.currentMatches.findIndex(m => m.player1 === p || m.player2 === p) + 1
			})),
			spectators: this.spectators.map(s => ({ id: s.id, name: s.name })),
		}
	}

	finishRoom(payload)
	{
		const players = [...this.players, ...this.spectators];
		const matches = payload.matches;

		const previousRoundMatches = this.matches.get(this.currentRound);
		previousRoundMatches.forEach(
			(match, index) =>
			{
				if (matches[index]) {
					match.player1Score = matches[index].player1Score || 0;
					match.player2Score = matches[index].player2Score || 0;
					match.winner = matches[index].winner;
					match.loser = matches[index].loser;
					match.state = matches[index].state || null;
					match.time = matches[index].time || null;
					if (match.winner === null || match.winner === undefined)
						match.winner = null;

					if (match.loser)
					{
						const loserPlayer = this.players.find(p => p.id === match.loser);
						if (loserPlayer)
						{
							if (loserPlayer.id === this.host)
								this.host = this.players.find(p => p.id !== match.loser)?.id || null;
							this.players = this.players.filter(p => p.id !== match.loser);
							this.spectators.push(loserPlayer);
						}
					}
				}
			}
		);
		this.currentRound++;
		if (this.currentRound === this.maxRounds)
		{
			this.status = 'finished';
			this.emit('finished', { ...this.finishData() });
		}
		else
			this.nextRound();
		return { state: this.getState(), players: players };
	}

	finishData()
	{
		const rounds = [];

		this.matches.forEach((matchsArray, roundIndex) => {
			rounds.push({
				round: roundIndex + 1,
				matchs: matchsArray.map(match => ({
					matchId: match.matchId,
					matchNumber: match.matchNumber + 1,
					matchStatus: match.matchStatus,
					player1: match.player1,
					player2: match.player2,
					player1Score: match.player1Score,
					player2Score: match.player2Score,
					winner: match.winner,
					loser: match.loser,
					state: match.state,
					time: match.time,
				}))
			});
		});

		return {
			name: this.name,
			winner: this.players[0].id,
			rounds: rounds,
			participants: this.players.map(p => ({ id: p.id})),
			matchType: 'tournament'
		};
	}

	startGame(playerId)
	{
		if (this.host !== playerId)
			throw new Error('Only the host can start the game');
		if (this.allPlayersReady() === false)
			throw new Error('Cannot start game, not all players are ready or room is not full');

		this.status = 'in_game';

		const matches = this.currentMatches;
		return {
			gameMode: this.gameMode,
			maxPlayers: this.maxPlayers,
			matches: matches
		};
	}

	matchMake()
	{
		if (this.status !== 'ready2match')
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
			match.player1 = this.players[i].id;
			match.player2 = this.players[i + 1].id;
			match.player1Score = 0;
			match.player2Score = 0;
			match.winner = null;
			match.loser = null;
			this.currentMatches.push(match);
		}
		this.status = 'ready2start';
		return { ...this.getMatchmakingInfo()};
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
			maxRound: this.maxRounds,
			rounds: rounds,
			matchType: 'tournament'
		};
	}

	nextRound()
	{
		this.currentMatches = [];
		const previousRoundMatches = this.matches.get(this.currentRound - 1);
		const nextRoundMatches = this.matches.get(this.currentRound);
		for (let i = 0; i < nextRoundMatches.length; i++)
		{
			const match = nextRoundMatches[i];
			const prevMatch1 = previousRoundMatches[i * 2];
			const prevMatch2 = previousRoundMatches[i * 2 + 1];

			let winner1 = null;
			let winner2 = null;

			if (prevMatch1.winner !== null)
				winner1 = prevMatch1.winner;
			else if (prevMatch1.player1 && !prevMatch1.player2)
				winner1 = prevMatch1.player1.id;
			else if (!prevMatch1.player1 && prevMatch1.player2)
				winner1 = prevMatch1.player2.id;

			if (prevMatch2.winner !== null)
				winner2 = prevMatch2.winner;
			else if (prevMatch2.player1 && !prevMatch2.player2)
				winner2 = prevMatch2.player1.id;
			else if (!prevMatch2.player1 && prevMatch2.player2)
				winner2 = prevMatch2.player2.id;

			match.player1 = winner1;
			match.player2 = winner2;

			if (match.player1 && !match.player2)
			{
				match.winner = match.player1.id;
				match.loser = null;
				match.player1Score = 0;
				match.player2Score = 0;
			}
			else if (!match.player1 && match.player2)
			{
				match.winner = match.player2.id;
				match.loser = null;
				match.player1Score = 0;
				match.player2Score = 0;
			}
			else
			{
				match.player1Score = 0;
				match.player2Score = 0;
				match.winner = null;
				match.loser = null;
			}

			this.currentMatches.push(match);
		}
		this.status = 'next_round';
	}

	getState()
	{
		const rounds = [];
		this.currentMatches.forEach((match) => {
			rounds.push({
				matchId: match.matchId,
				matchNumber: match.matchNumber,
				matchStatus: match.matchStatus,
				player1: this.participants.find(p => p.id === match.player1)?.getState() || { name: null, id: null },
				player2: this.participants.find(p => p.id === match.player2)?.getState() || { name: null, id: null },
				player1Score: match.player1Score,
				player2Score: match.player2Score,
				winner: match.winner,
				loser: match.loser,
			});
		});
		return {
			name: this.name,
			gameMode: this.gameMode,
			status: this.status,
			maxPlayers: this.maxPlayers,
			losers: this.spectators.map(s => s.getState()),
			players: this.players.map(p => p.getState(this.host)),
			gameSettings: this.gameSettings,
			maxRound: this.maxRounds,
			currentRound: this.currentRound,
			match: rounds
			// Additional tournament-specific state can be added here
		};
	}

}
