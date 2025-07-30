import GameMode from './GameMode.js';
import ClassicMode from './ClassicMode.js';

/**
 * TournamentMode - Turnuva sistemi
 */
class TournamentMode extends GameMode
{
	constructor(gameId, gameManager)
	{
		super(gameId, gameManager);
		this.maxPlayers = 8; // 8 oyuncu turnuva
		this.minPlayers = 4;  // Minimum 4 oyuncu
		this.matches = new Map(); // matchId -> ClassicMode
		this.bracket = {
			round1: [], // 4 maç
			round2: [], // 2 maç (yarı final)
			final: null, // Final maçı
			winner: null
		};
		this.currentRound = 'waiting';
	}

	addPlayer(player)
	{
		if (this.players.size >= this.maxPlayers)
		{
			throw new Error('Tournament is full (8 players max)');
		}

		this.players.set(player.id, player);
		console.log(`🏆 Player ${player.id} joined Tournament (${this.players.size}/${this.maxPlayers})`);

		if (this.canStart())
		{
			this.start();
		}

		return this;
	}

	canStart()
	{
		return this.players.size >= this.minPlayers;
	}

	start()
	{
		super.start();
		this.createBracket();
		this.startRound1();
	}

	createBracket()
	{
		const playerList = Array.from(this.players.values());
		
		// Oyuncuları karıştır
		for (let i = playerList.length - 1; i > 0; i--)
		{
			const j = Math.floor(Math.random() * (i + 1));
			[playerList[i], playerList[j]] = [playerList[j], playerList[i]];
		}

		// İlk turu oluştur
		for (let i = 0; i < playerList.length; i += 2)
		{
			if (i + 1 < playerList.length)
			{
				const matchId = `${this.gameId}_round1_${i / 2}`;
				const match = {
					id: matchId,
					player1: playerList[i],
					player2: playerList[i + 1],
					winner: null,
					game: null
				};
				this.bracket.round1.push(match);
			}
		}

		console.log(`🏆 Tournament bracket created with ${this.bracket.round1.length} matches`);
	}

	startRound1()
	{
		this.currentRound = 'round1';
		
		// Tüm round1 maçlarını başlat
		for (const match of this.bracket.round1)
		{
			const game = new ClassicMode(match.id, this.gameManager);
			game.addPlayer(match.player1);
			game.addPlayer(match.player2);
			
			this.matches.set(match.id, game);
			match.game = game;
		}

		console.log(`🚀 Round 1 started with ${this.bracket.round1.length} matches`);
	}

	update(deltaTime)
	{
		if (this.status !== 'playing')
			return;

		// Aktif maçları güncelle
		for (const [matchId, game] of this.matches.entries())
		{
			if (game.status === 'playing')
			{
				game.update(deltaTime);
				
				// Maç bitti mi kontrol et
				if (game.game.status === 'finished')
				{
					this.handleMatchEnd(matchId, game);
				}
			}
		}

		// Round kontrolü
		this.checkRoundProgress();
	}

	handleMatchEnd(matchId, game)
	{
		const gameState = game.getGameState();
		const score = gameState.gameData.gameData.score;
		
		// Kazananı bul
		let winner;
		const players = Array.from(game.players.values());
		if (score.team1 > score.team2)
		{
			winner = players[0]; // İlk oyuncu team1
		}
		else
		{
			winner = players[1]; // İkinci oyuncu team2
		}

		// Bracket'ı güncelle
		const match = this.findMatchById(matchId);
		if (match)
		{
			match.winner = winner;
			console.log(`🏆 Match ${matchId} finished. Winner: ${winner.name}`);
		}
	}

	checkRoundProgress()
	{
		if (this.currentRound === 'round1')
		{
			const finishedMatches = this.bracket.round1.filter(m => m.winner !== null);
			if (finishedMatches.length === this.bracket.round1.length)
			{
				this.startRound2();
			}
		}
		else if (this.currentRound === 'round2')
		{
			const finishedMatches = this.bracket.round2.filter(m => m.winner !== null);
			if (finishedMatches.length === this.bracket.round2.length)
			{
				this.startFinal();
			}
		}
		else if (this.currentRound === 'final')
		{
			if (this.bracket.final && this.bracket.final.winner)
			{
				this.endTournament();
			}
		}
	}

	startRound2()
	{
		this.currentRound = 'round2';
		const round1Winners = this.bracket.round1.map(m => m.winner);

		for (let i = 0; i < round1Winners.length; i += 2)
		{
			if (i + 1 < round1Winners.length)
			{
				const matchId = `${this.gameId}_round2_${i / 2}`;
				const match = {
					id: matchId,
					player1: round1Winners[i],
					player2: round1Winners[i + 1],
					winner: null,
					game: null
				};
				
				const game = new ClassicMode(match.id, this.gameManager);
				game.addPlayer(match.player1);
				game.addPlayer(match.player2);
				
				this.matches.set(match.id, game);
				match.game = game;
				this.bracket.round2.push(match);
			}
		}

		console.log(`🚀 Round 2 (Semi-Final) started`);
	}

	startFinal()
	{
		this.currentRound = 'final';
		const round2Winners = this.bracket.round2.map(m => m.winner);

		if (round2Winners.length >= 2)
		{
			const matchId = `${this.gameId}_final`;
			this.bracket.final = {
				id: matchId,
				player1: round2Winners[0],
				player2: round2Winners[1],
				winner: null,
				game: null
			};

			const game = new ClassicMode(matchId, this.gameManager);
			game.addPlayer(round2Winners[0]);
			game.addPlayer(round2Winners[1]);
			
			this.matches.set(matchId, game);
			this.bracket.final.game = game;

			console.log(`🏆 FINAL started: ${round2Winners[0].name} vs ${round2Winners[1].name}`);
		}
	}

	endTournament()
	{
		this.bracket.winner = this.bracket.final.winner;
		this.stop();
		console.log(`🏆 TOURNAMENT WINNER: ${this.bracket.winner.name}!`);
	}

	findMatchById(matchId)
	{
		for (const match of this.bracket.round1)
		{
			if (match.id === matchId) return match;
		}
		for (const match of this.bracket.round2)
		{
			if (match.id === matchId) return match;
		}
		if (this.bracket.final && this.bracket.final.id === matchId)
		{
			return this.bracket.final;
		}
		return null;
	}

	getGameState()
	{
		return {
			mode: 'tournament',
			gameId: this.gameId,
			status: this.status,
			players: this.players.size,
			maxPlayers: this.maxPlayers,
			currentRound: this.currentRound,
			bracket: {
				round1: this.bracket.round1.map(m => ({
					id: m.id,
					player1: { id: m.player1.id, name: m.player1.name },
					player2: { id: m.player2.id, name: m.player2.name },
					winner: m.winner ? { id: m.winner.id, name: m.winner.name } : null
				})),
				round2: this.bracket.round2.map(m => ({
					id: m.id,
					player1: { id: m.player1.id, name: m.player1.name },
					player2: { id: m.player2.id, name: m.player2.name },
					winner: m.winner ? { id: m.winner.id, name: m.winner.name } : null
				})),
				final: this.bracket.final ? {
					id: this.bracket.final.id,
					player1: { id: this.bracket.final.player1.id, name: this.bracket.final.player1.name },
					player2: { id: this.bracket.final.player2.id, name: this.bracket.final.player2.name },
					winner: this.bracket.final.winner ? { id: this.bracket.final.winner.id, name: this.bracket.final.winner.name } : null
				} : null,
				winner: this.bracket.winner ? { id: this.bracket.winner.id, name: this.bracket.winner.name } : null
			}
		};
	}

	onGameStart()
	{
		console.log(`🏆 Tournament started: ${this.gameId}`);
	}

	onGameEnd()
	{
		console.log(`🏁 Tournament ended: ${this.gameId}`);
	}
}

export default TournamentMode;
