import { TOURNAMENT_GAME_PROPERTIES } from '../utils/constants.js';
import PingPong from '../PingPong/PingPong.js';
import EventEmitter from '../utils/EventEmitter.js';


// TODOO: Host playerId eklen
// TODOO: Herkes hazır mı kontrolü
// TODOO: Oyuncu çıkarsa ne olacak?

class Tournament extends EventEmitter
{
	constructor(maxPlayers)
	{
		super();
		this.maxPlayers = maxPlayers;
		this.players = [];
		this.spectators = [];
		this.currentMatches = [];
		this.finishedMatchesCount = 0;

		this.registeredPlayers = new Set();
	}

	setupMatches(matches)
	{
		this.currentMatches = [];
		this.registeredPlayers.clear();
		matches.forEach((match) =>
		{
			const game = new PingPong({
				...TOURNAMENT_GAME_PROPERTIES,
				gameMode: 'tournament',
			});
			game.on('finished', ({ players, results }) =>
			{
				this.finishedMatchesCount++;
				console.log(`result:`, results);
				match.winner = results.winner?.ids[0] || null;
				match.loser = results.loser?.ids[0] || null;
				match.playersState = results.state || null;
				match.time = results.time || null;
				match.player1Score = results.team1?.score || 0;
				match.player2Score = results.team2?.score || 0;
			});
			game.addRegisteredPlayer(match.player1);
			game.addRegisteredPlayer(match.player2);
			game.initializeGame();
			match.game = game;
			match.state = game.getGameState();
			match.time =  null;
			match.playersState = null;
			match.player1Score = 0;
			match.player2Score = 0;
			match.matchStatus = 'not_started'; // 'not_started', 'in_progress', 'finished'
			this.currentMatches.push(match);
		});
	}

	update(deltaTime)
	{
		if (this.status !== 'running')
		{
			if (this.status === 'finished')
				return;
			let counter = 0;
			this.currentMatches.forEach(
				(match) =>
				{
					if (match.game?.status === 'ready to start' || match.game?.status === 'canceled' || match.game?.status === 'finished')
						counter++;
				}
			);
			if (counter === this.currentMatches.length)
				this.start();
			else
				return;
		}

		if (this.finishedMatchesCount === this.currentMatches.length)
		{
			this.emit('finished',
				{
					payload: {
						matches: this.currentMatches.map(match => ({
							player1: match.player1,
							player2: match.player2,
							player1Score: match.player1Score,
							player2Score: match.player2Score,
							winner: match.winner,
							loser: match.loser,
							state: match.playersState,
							time: match.time,
						})),
					}
				}
			);
			this.status = 'finished';
			return;
		}

		this.currentMatches.forEach(
			(match) =>
			{
				if (match.game.isFinished())
					return;
				match.game.update(deltaTime);
				match.state = match.game.getGameState();
				match.score = match.game.getScore();
			}
		);

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
		this.players.push(player);
		this.currentMatches.forEach((match) => {
			if (match.game.registeredPlayers.has(player.id))
			{
				match.game.addPlayer(player);
			}
		});
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

	reset()
	{
		this.finishedMatchesCount = 0;
		this.currentMatches = [];
		this.registeredPlayers = new Set();
		this.players = [];
		this.spectators = [];
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
		this.currentMatches = [];
		this.status = 'finished';
	}
}

export default Tournament;
