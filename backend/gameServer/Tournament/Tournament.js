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
		matches.forEach((match) =>
		{
			const game = new PingPong({
				...TOURNAMENT_GAME_PROPERTIES,
				gameMode: 'tournament',
			});
			game.on('finished', ({ players, results }) =>
			{
				this.finishedMatchesCount++;
				match.winner = results.winner.ids[0];
				match.loser = results.loser.ids[0];
			});
			game.addRegisteredPlayer(match.player1.id);
			game.addRegisteredPlayer(match.player2.id);
			game.initializeGame();
			match.game = game;
			match.state = game.getGameState();
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
					if (match.game?.status === 'ready to start')
					{
						console.log('Tournament match is ready to start:', match);
						counter++;
					}
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
							score: match.score,
							winner: match.winner,
							loser: match.loser,
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
		if (this.registeredPlayers.has(player.id))
			return this.emit('error', new Error(`Player with ID ${player.id} is already in the tournament`));
		this.players.push(player);
		this.currentMatches.forEach((match) => {
			console.log(`👤👤👤👤👤👤👤👤👤👤 `);
			if (match.game.registeredPlayers.has(player.id))
			{
				console.log(`👤 Player ${player.id} added to match ${match.matchId}`);
				match.game.addPlayer(player);
				console.log(`👤 Player ${player.id} added to tournament`);
				return;
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
