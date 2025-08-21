import { TOURNAMENT_GAME_PROPERTIES } from '../utils/constants.js';
import PingPong from '../PingPong/PingPong.js';
import EventEmitter from '../utils/EventEmitter.js';

class Tournament extends EventEmitter
{
	constructor(tournamentName, properties)
	{
		super();
		this.tournamentName = tournamentName;
		this.properties = properties;
		this.participants = [];
		this.players = null;

		this.matches = new Map(); // Round -> Matchs array

		this.startTime = null;
		this.endTime = null;

		this.currentMatches = [];
		this.currentRound = 0;
		this.maxRounds = Math.ceil(Math.log2(this.properties.playerCount));

		for (let i = 0; i < this.maxRounds; i++)
		{
			const matchs = [];
			const matchCount = Math.pow(2, this.maxRounds - i - 1);

			for (let j = 0; j < matchCount; j++)
			{
				matchs.push({
						round: i,
						matchNumber: j,
						matchId: null,
						player1: null,
						player2: null,
						score: null,
						winner: null,
						matchStatus: 'not_started', // 'not_started', 'in_progress', 'finished'
						loser: null,
						game: null,
					}
				);
			}

			this.matches.set(i,{
					matchs: matchs,
				}
			);
		}

		this.status = 'waiting'; // 'waiting', 'running', 'finished', "ready2start"
	}

	matchMaking()
	{
		if (this.status !== 'waiting')
			return this.emit('error', new Error(`Tournament is not in waiting state, current status: ${this.status}`));
		if (this.participants.length < this.properties.playerCount)
			return this.emit('error', new Error(`Not enough participants to start matchmaking, current count: ${this.participants.length}, required: ${this.properties.playerCount}`));

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

		this.players = shuffle(this.participants);
		let matchs = this.matches.get(this.currentRound).matchs;
		for (let i = 0; i < this.players.length; i += 2)
		{
			if (i + 1 < this.players.length)
			{
				const match = matchs[i / 2];
				match.matchId = `${this.tournamentName}-match-${Date.now()}`;
				match.player1 = this.players[i];
				match.player2 = this.players[i + 1];
				match.matchStatus = 'not_started';
				match.winner = null;
				match.loser = null;
				match.game = new PingPong({
					...TOURNAMENT_GAME_PROPERTIES,
					gameMode: 'tournament',
				});
				match.game.initializeGame();
				match.game.addPlayer(match.player1);
				match.game.addPlayer(match.player2);
				this.currentMatches.push(match);
			}
		}

		this.status = 'ready2start';
	}

	getMatchmakingInfo()
	{
		return {
			currentRound: this.currentRound,
			maxRounds: this.maxRounds,
			matchs: this.matches.forEach((round, index) => ({
				round: index,
				matchs: round.matchs.map(match => ({
					matchId: match.matchId,
					matchNumber: match.matchNumber,
					matchStatus: match.matchStatus,
					player1: match.player1,
					player2: match.player2,
					score: match.score,
					winner: match.winner,
					loser: match.loser,
				}))
			})),
			status: this.status,
			participants: this.participants.map(p => ({ id: p.id, name: p.name })),
		};
	}

	nextRound()
	{
		if (this.currentRound >= this.maxRounds)
			return this.emit('tournamentFinished', this.matchMakingInfo());

		this.currentRound++;
		this.currentMatches = [];
		const matchs = this.matches.get(this.currentRound).matchs;
		for (let i = 0; i < matchs.length; i++)
		{
			const match = matchs[i];
			if (!match.player1 || !match.player2)
				continue;

			match.matchId = `${this.tournamentName}-match-${Date.now()}`;
			match.winner = null;
			match.loser = null;
			match.game = new PingPong({
				...TOURNAMENT_GAME_PROPERTIES,
				gameMode: 'tournament',
			});
			match.game.initializeGame();
			match.game.addPlayer(this.matches.get(this.currentRound - 1).matchs[i].winner);
			match.game.addPlayer(this.matches.get(this.currentRound - 1).matchs[i + 1]?.winner || null);
			this.currentMatches.push(match);
		}

		this.status = 'ready2start';
		this.emit('nextRound', this.getMatchmakingInfo());
	}

	update(deltaTime)
	{
		if (this.status !== 'running')
			return;

		let	finishedMatchesCount = 0;

		this.currentMatches.forEach(
			(match) =>
			{
				if (!match.game)
					return;
				finishedMatchesCount = 0;
				match.game.update(deltaTime);
				match.score = match.game.getScore();
				match.status = 'in_progress';
				if (match.game.isFinished())
				{
					finishedMatchesCount++;
					match.winner = match.game.getWinner();
					match.loser = match.game.getLoser();
					match.matchStatus = 'finished';
					match.game.dispose();
					match.game = null;
					console.log(`🏆 Match ${match.matchId} finished. Winner: ${winner.id}, Loser: ${loser.id}`);
				}
			}
		);

		this.emit("update", {
			participants: this.participants,
			matchMakingInfo: this.getMatchmakingInfo(),
			tournamentState: this.getState()
		});
	}

	addParticipant(player)
	{
		if (this.participants.length < this.properties.maxPlayers)
		{
			if (this.participants.some(p => p.id === player.id))
				return this.emit('error', new Error(`Player with ID ${player.id} is already in the tournament`));
			this.participants.push(player);
			console.log(`👤 Player ${player.id} added to tournament`);
		}
		else
			this.emit('error', new Error(`Tournament is full, cannot add player ${player.id}`));
	}

	removeParticipant(playerId)
	{
		//TODO: eğer kullanıcı çıkarsa mevcut oyunuda mağlup say
		const index = this.participants.findIndex(p => p.id === playerId);
		if (index !== -1)
			this.participants.splice(index, 1);
	}

	isFull()
	{
		return this.participants.length === this.properties.maxPlayers;
	}

	isFinished()
	{
		return this.status === 'finished' || this.currentRound >= this.maxRounds;
	}

	start()
	{
		if (this.status !== 'ready2start')
			return this.emit('error', new Error(`Tournament is not ready to start, current status: ${this.status}`));
		this.startTime = Date.now();
		this.status = 'running';
		this.emit('tournamentStarted', this.getMatchmakingInfo());
		this.currentMatches.forEach(
			(match) =>
			{
				if (match.game)
					match.game.start();
			}
		);
	}

	getState()
	{
		return {
			matches: Array.from(this.currentMatches).map(match => ({
				matchId: match.matchId,
				matchNumber: match.matchNumber,
				player1: match.player1,
				player2: match.player2,
				gameState: match.game.getGameState(),
			})),
		};
	}

	getFinishedInfo()
	{
		return {
			// finish state
		}

	}
}

export default Tournament;
