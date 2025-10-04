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
		this.matches = new Map(); // Round -> Matchs array

		this.startTime = null;
		this.endTime = null;

		this.currentMatches = [];
		this.currentRound = 0;
		this.maxRounds = Math.ceil(Math.log2(this.maxPlayers));

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

			this.matches.set(i, {
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
	// ? BYE olucak mı
	//	if (this.players.length < this.properties.playerCount)
	//		return this.emit('error', new Error(`Not enough players to start matchmaking, current count: ${this.players.length}, required: ${this.properties.playerCount}`));

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
				match.state = match.game.getGameState();
				match.game.on('finished', ({ players, results }) =>
				{
					this.finishedMatchesCount++;
					match.winner = match.game.getWinnerPlayers();
					match.loser = match.game.getLoserPlayers();
					match.matchStatus = 'finished';
					match.game.off('finished');
				});
				this.currentMatches.push(match);
			}
		}
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
			participants: this.players.map(p => ({ id: p.id, name: p.name })),
		};
	}

	init()
	{
		this.matchMaking();
		return this.initData();
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
		if (this.currentRound >= this.maxRounds)
			return this.emit('tournamentFinished',
				{
					players: this.players,
					data:
					{
						matchMakingInfo: this.getMatchmakingInfo()
					}
				}
			);

		this.currentRound++;
		this.currentMatches = [];
		const prevmatches = this.matches.get(this.currentRound - 1).matchs;
		const matchs = this.matches.get(this.currentRound).matchs;
		for (let i = 0; i < matchs.length; i++)
		{
			const match = matchs[i];
/* 			if (!match.player1 || !match.player2)
				continue;*/
			// HATALI MATCHLAR

			match.matchId = `${this.tournamentName}-match-${Date.now()}`;
			match.winner = null;
			match.loser = null;
			match.game = new PingPong({
				...TOURNAMENT_GAME_PROPERTIES,
				gameMode: 'tournament',
			});
			match.game.on('finished', ({ players, results }) =>
			{
				this.finishedMatchesCount++;
				match.winner = results.winner;
				match.loser = results.loser;
				match.matchStatus = 'finished';
				match.game.off('finished');
			});
			match.game.initializeGame();
			console.log('PREVMATCHES Match 1 winner:', JSON.stringify(prevmatches[i * 2].winner, null, 2));
			console.log('PREVMATCHES Match 2 winner:', JSON.stringify(prevmatches[i * 2 + 1].winner, null, 2));
			match.game.addPlayer(prevmatches[i * 2].winner[0]);
			match.game.addPlayer(prevmatches[i * 2 + 1].winner[0] || null);
			match.state = match.game.getGameState();
			this.currentMatches.push(match);
		}

		this.status = 'ready2start';
		this.emit('roundFinish', {
			players: this.players,
			data:
			{
				matchMakingInfo: this.getMatchmakingInfo()
			}
		});
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
			if (this.currentRound + 1 >= this.maxRounds)
			{
				this.status = 'finished';
				this.endTime = Date.now();
				this.emit('finished',
					{
						players: this.players,
						data:
						{
							matchMakingInfo: this.getMatchmakingInfo(),
							tournamentDuration: this.endTime - this.startTime,
						}
					}
				);
			}
			else
				this.nextRound();
			return
		}
		this.emit("update", {
			players: this.players,
			data:
			{
				...this.getState()
			}
		});
	}

	addPlayer(player)
	{
		if (this.players.length < this.maxPlayers)
		{
			if (this.players.some(p => p.id === player.id))
				return this.emit('error', new Error(`Player with ID ${player.id} is already in the tournament`));
			this.players.push(player);
			console.log(`👤 Player ${player.id} added to tournament`);
		}
		else
			this.emit('error', new Error(`Tournament is full, cannot add player ${player.id}`));
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
		return this.players.length === this.properties.maxPlayers;
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
		this.startTime = Date.now();
		this.status = 'running';
		this.emit('started', {
			players: this.players,
			data:
			{

			}
		});
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
		return {
			// finish state
		}
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
