import { TOURNAMENT_GAME_PROPERTIES } from '../utils/constants.js';
import PingPong from '../PingPong/PingPong.js';
import EventEmitter from '../utils/EventEmitter.js';


// TODOO: Host playerId eklen
// TODOO: Herkes hazır mı kontrolü
// TODOO: Oyuncu çıkarsa ne olacak?

class Tournament extends EventEmitter
{
	constructor(tournamentSettings, gameSettings)
	{
		super();
		this.tournamentName = tournamentSettings.name;
		this.maxPlayers = tournamentSettings.maxPlayers;
		this.tournamentSettings = tournamentSettings;
		this.gameSettings = gameSettings;
		this.players = [];
		this.registeredPlayers = new Set();
		this.spectators = [];
		this.matches = new Map(); // Round -> Matchs array

		this.winner = null;

		this.startTime = null;
		this.endTime = null;

		this.currentMatches = [];
		this.currentRound = 0;
		this.maxRounds = Math.log2(this.maxPlayers);
		this.finishedMatchesCount = 0;
		for (let i = 0; i < this.maxRounds; i++)
		{
			const matchs = [];
			const matchCount = Math.pow(2, this.maxRounds - i - 1);

			for (let j = 0; j < matchCount; j++)
			{
				matchs.push({
						round: i,
						matchNumber: j,
						state: null,
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

			this.matches.set(i, matchs);
		}
		this.status = 'waiting'; // 'waiting', 'running', 'finished', "ready2start"
	}

	matchMaking()
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
			this.setupMatch(match, this.players[i], this.players[i + 1]);
			this.currentMatches.push(match);
		}
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
			maxRounds: this.maxRounds,
			rounds: rounds,
			status: this.status,
			participants: this.players.map(p => ({ id: p.id, name: p.name })),
		};
	}

	init()
	{
		this.matchMaking();
		return this.getMatchmakingInfo();
	}

	initData()
	{
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
				players: [match.player1 ? match.player1.id : null, match.player2 ? match.player2.id : null],
			})),
			gameSettings: this.gameSettings,
			players: this.players.map(p => ({
				id: p.id,
				name: p.name,
				gameNumber: this.currentMatches.findIndex(m => m.player1?.id === p.id || m.player2?.id === p.id) + 1
			})),
		}
	}

	nextRound()
	{
		this.currentRound++;
		this.currentMatches = [];
		const prevmatches = this.matches.get(this.currentRound - 1);
		const matchs = this.matches.get(this.currentRound);
		for (let i = 0; i < matchs.length; i++)
		{
			const match = matchs[i];
			this.setupMatch(match, prevmatches[i * 2].winner, prevmatches[i * 2 + 1].winner);
			this.currentMatches.push(match);
			//? spector
			this.moveSpector(prevmatches[i * 2].loser);
			this.moveSpector(prevmatches[i * 2 + 1].loser);
		}

		this.status = 'waiting';

		let emitPlayers = [];
		this.players.forEach(player => emitPlayers.push(player));
		this.spectators.forEach(spector => emitPlayers.push(spector));
		this.emit('roundFinish', {
			players: emitPlayers,
			data:
			{
				matchMakingInfo: this.getMatchmakingInfo()
			}
		});

	}

	moveSpector(player)
	{
		const index = this.players.findIndex(p => p.id === player.id);
		if (index !== -1)
			this.players.splice(index, 1);
		this.spectators.push(player);
	}

	setupMatch(match, player1, player2)
	{
		match.matchId = `${this.tournamentName}-match-${Date.now()}`;
		match.player1 = player1;
		match.player2 = player2;
		match.winner = null;
		match.loser = null;
		match.game = new PingPong({
			...TOURNAMENT_GAME_PROPERTIES,
			gameMode: 'tournament',
		});
		match.game.on('finished', ({ players, results }) =>
		{
			this.finishedMatchesCount++;
			match.winner = players.find(p => p.id === results.winner.ids[0]);
			match.loser = players.find(p => p.id === results.loser.ids[0]);
			match.matchStatus = 'finished';
			match.game.off('finished');
		});
		match.game.initializeGame();
		match.game.addPlayer(player1);
		match.game.addPlayer(player2);
		match.state = match.game.getGameState();
	}

	update(deltaTime)
	{
		if (this.status !== 'running')
			return;

		this.currentMatches.forEach(
			(match) =>
			{
				if (match.game.isFinished())
					return;
				match.game.update(deltaTime);
				match.state = match.game.getGameState();
				match.score = match.game.getScore();
				match.status = 'in_progress';
			}
		);

		if (this.finishedMatchesCount === this.currentMatches.length)
		{
			if (this.currentRound === this.maxRounds - 1)
			{
				this.status = 'finished';
				this.endTime = Date.now();
				this.winner = this.currentMatches[0].winner;
				let currentPlayers = [];
				this.players.forEach(player => currentPlayers.push(player));
				this.spectators.forEach(spector => currentPlayers.push(spector));
				this.emit('finished',
					{
						players: currentPlayers,
						data:
						{
							finishState: this.getFinishedInfo(),
							tournamentDuration: this.endTime - this.startTime,
						}
					}
				);
			}
			else
				this.nextRound();
			this.finishedMatchesCount = 0;
			return;
		}
		this.emit("update", {
			players: this.players,
			data:
			{
				...this.getState()
			}
		});
	}

	registerPlayer(player)
	{
		if (this.isFull())
			return this.emit('error', new Error(`Cannot register player ${player.id}, tournament is full`));
		if (this.players.some(p => p.id === player.id))
			return this.emit('error', new Error(`Player with ID ${player.id} is already registered in the tournament`));
		this.registeredPlayers.add(player);
		console.log(`👤 Player ${player} registered for tournament`);
	}

	addPlayer(player)
	{
		if (!this.registeredPlayers.has(player.id))
			return this.emit('error', new Error(`Player with ID ${player.id} is already in the tournament`));
		this.players.push(player);
		console.log(`👤 Player ${player.id} added to tournament`);
	}

	removePlayer(playerId)
	{
		const index = this.players.findIndex(p => p.id === playerId);
		if (index !== -1)
			this.players.splice(index, 1);
		else
			this.emit('error', new Error(`Player with ID ${playerId} is not in the tournament`));
	}

	isFull()
	{
		return this.players.length === this.maxPlayers;
	}

	isFinished()
	{
		return this.status === 'finished' || this.currentRound >= this.maxRounds;
	}

	isEmpty()
	{
		return this.players.length === 0;
	}

	isRunning()
	{
		return this.status === 'running';
	}

	start()
	{
		if (this.startTime !== null)
			this.startTime = Date.now();
		this.status = 'running';
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
				player1:
				{
					name: match.player1.name,
				},
				player2:
				{
					name: match.player2.name,
				},
				gameState: match.state,
			})),
		};
	}

	getFinishedInfo()
	{
		const rounds = [];

		this.matches.forEach((matchsArray, roundIndex) => {
			rounds.push({
				round: roundIndex,
				matchs: matchsArray.map(match => ({
					matchId: match.matchId,
					matchNumber: match.matchNumber,
					matchStatus: match.matchStatus,
					player1: match.player1 ? { id: match.player1.id, name: match.player1.name } : null,
					player2: match.player2 ? { id: match.player2.id, name: match.player2.name } : null,
					score: match.score,
					winner: match.winner ? { id: match.winner.id, name: match.winner.name } : null,
					loser: match.loser ? { id: match.loser.id, name: match.loser.name } : null,
				}))
			});
		});

		return {
			tournamentName: this.tournamentName,
			winner: this.winner,
			matches: rounds
		};
	}

	destroy()
	{
		this.currentMatches.forEach(
			(match) =>
			{
				if (match.game)
				{
					match.game.dispose();
					match.game = null;
				}
			}
		);
		this.players = [];
		this.matches.clear();
		this.currentMatches = [];
		this.status = 'finished';
	}
}

export default Tournament;
