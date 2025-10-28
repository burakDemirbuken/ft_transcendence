import { Op } from 'sequelize'

export default async function gamedataRoute(fastify) {
	fastify.post('/internal/match', async (request, reply) => {
		const {
			team1,
			team2,
			winner,
			matchType,
			state,
			time
		} = request.body ?? {}
		const { Profile, Stat, MatchHistory, Team } = fastify.sequelize.models
		const t = await fastify.sequelize.transaction()
		console.log('Processing match data:', { team1, team2, winner, matchType, state, time })
		try {
			const [teamOnePlayers, teamTwoPlayers] = await Promise.all([
				Profile.findAll({
					where: { userName: team1.playersId },
					include: [{ model: Stat }],
					transaction: t
				}),
				Profile.findAll({
					where: { userName: team2.playersId },
					include: [{ model: Stat }],
					transaction: t
				})
			])
			console.log('Retrieved team players:', {
				teamOnePlayers: teamOnePlayers.map(p => p.userName),
				teamTwoPlayers: teamTwoPlayers.map(p => p.userName)
			})
			const winnerTeam = winner?.team ?
				(winner.team.playersId[0] === team1.playersId[0] ? teamOnePlayers : teamTwoPlayers)
				: null
			const loserTeam = winner?.team ?
				(winner.team.playersId[0] === team1.playersId[0] ? teamTwoPlayers : teamOnePlayers)
				: null
			console.log('Identified winner and loser teams:', { winnerTeam, loserTeam })
			if (winnerTeam) {
				await Promise.all([
					...winnerTeam.map(async (player) => {
						const playerState = state.players.find(p => p.id === player.userName)
						await player.Stat.increment({
							gamesPlayed: 1,
							gamesWon: 1,
							gameCurrentStreak: 1,
							xp: 70,
							ballHitCount: playerState?.kickBall ?? 0,
							ballMissCount: playerState?.missedBall ?? 0,
							gameTotalDuration: time.duration
						}, { transaction: t })
						await player.Stat.update({
							gameMinDuration: time.duration < player.Stat.gameMinDuration ? time.duration : player.Stat.gameMinDuration
						}, { transaction: t })
					}),
					...loserTeam.map(async (player) => {
						const playerState = state.players.find(p => p.id === player.userName)
						await player.Stat.increment({
							gamesPlayed: 1,
							gamesLost: 1,
							xp: 10,
							gameTotalDuration: time.duration,
							ballHitCount: playerState?.kickBall ?? 0,
							ballMissCount: playerState?.missedBall ?? 0
						}, { transaction: t })
						await player.Stat.update({
							gameCurrentStreak: 0,
							gameMinDuration: time.duration < player.Stat.gameMinDuration ? time.duration : player.Stat.gameMinDuration
						}, { transaction: t })
					})
				])
			}
			console.log('Updated player statistics for both teams')
			const [teamOne, teamTwo] = await Promise.all([
				Team.create({
					playerOneId: teamOnePlayers?.[0]?.id ?? null,
					playerTwoId: teamOnePlayers?.[1]?.id ?? null
				}, { transaction: t }),
				Team.create({
					playerOneId: teamTwoPlayers?.[0]?.id ?? null,
					playerTwoId: teamTwoPlayers?.[1]?.id ?? null
				}, { transaction: t })
			])
			console.log('Created team records:', { teamOneId: teamOne.id, teamTwoId: teamTwo.id })
			await MatchHistory.create({
				teamOneId: teamOne.id,
				teamTwoId: teamTwo.id,
				winnerTeamId: winner?.team ? (winner.team.playersId[0] === team1.playersId[0] ? teamOne.id : teamTwo.id) : null,
				teamOneScore: team1.score,
				teamTwoScore: team2.score,
				matchType: matchType,
				matchStartDate: time.start ? new Date(time.start) : null,
				matchEndDate: time.finish ? new Date(time.finish) : null
			}, { transaction: t })
			console.log('Match history recorded successfully')
			await Promise.all([
				...teamOnePlayers.map(async (player) => {
					if (player && player.id) {
						console.log('Checking achievements for player:', player.userName)
						await fastify.checkAchievements(player.id, t)
					}
				}),
				...teamTwoPlayers.map(async (player) => {
					if (player && player.id) {
						console.log('Checking achievements for player:', player.userName)
						await fastify.checkAchievements(player.id, t)
					}
				})
			])
			console.log('Achievement checks completed for all players')
			await t.commit()
			return reply.status(200).send({ message: 'Match data processed successfully' })
		} catch (error) {
			await t.rollback()
			fastify.log.error('Error saving match data:', { message: error.message,
				details: error.toString() })
			return reply.status(500).send({ error: 'Internal Server Error', details: error && error.message ? error.message : error })
		}
	})

	fastify.post('/internal/tournament', async (request, reply) => {
		const {

			/*
			 {
   "name": "asdasd",
   "winner": "test2",
   "rounds": [
     {
       "round": 0,
       "matchs": [
         {
           "matchNumber": 0,
           "player1": "test2",
           "player2": "test0",
           "player1Score": 1,
           "player2Score": 0,
           "winner": "test2",
           "loser": "test0",
           "state": {
             "players": [
               {
                 "id": "test2",
                 "kickBall": 0,
                 "missedBall": 0
               },
               {
                 "id": "test0",
                 "kickBall": 0,
                 "missedBall": 1
               }
             ]
           },
           "time": {
             "start": 1761413543844,
             "finish": 1761413547123,
             "duration": 1287
           }
         },
         {
           "matchNumber": 1,
           "player1": "test3",
           "player2": "test1",
           "player1Score": 1,
           "player2Score": 0,
           "winner": "test3",
           "loser": "test1",
           "state": {
             "players": [
               {
                 "id": "test3",
                 "kickBall": 0,
                 "missedBall": 0
               },
               {
                 "id": "test1",
                 "kickBall": 0,
                 "missedBall": 1
               }
             ]
           },
           "time": {
             "start": 1761413543844,
             "finish": 1761413547123,
             "duration": 1287
           }
         }
       ]
     },
     {
       "round": 1,
       "matchs": [
         {
           "matchNumber": 0,
           "player1": "test2",
           "player2": "test3",
           "player1Score": 1,
           "player2Score": 0,
           "winner": "test2",
           "loser": "test3",
           "state": {
             "players": [
               {
                 "id": "test2",
                 "kickBall": 0,
                 "missedBall": 0
               },
               {
                 "id": "test3",
                 "kickBall": 0,
                 "missedBall": 1
               }
             ]
           },
           "time": {
             "start": 1761413553317,
             "finish": 1761413556612,
             "duration": 1302
           }
         }
       ]
     }
   ],
   "matchType": "tournament"
 }
			*/
			name,
			winner,
			rounds
		} = request.body ?? {}
		const { Profile, Stat, RoundMatch, Round, TournamentHistory } = fastify.sequelize.models
		const t = await fastify.sequelize.transaction()

		console.log(JSON.stringify(request.body, null, 2))
		try {
			console.log('Creating tournament record for:', name)
			const tournament = await TournamentHistory.create({
				name: name,
				winnerPlayer: (await Profile.findOne({
					where: { userName: winner },
					attributes: ['id']
				}))?.id ?? null
			}, { transaction: t })
			console.log('Created tournament record with ID:', tournament.id)

			for (const [roundIndex, roundData] of rounds.entries()) {
				const round = await Round.create({
					roundNumber: roundIndex + 1,
					tournamentId: tournament.id
				}, { transaction: t })
				console.log(' Created round record with ID:', round.id, 'for tournament ID:', tournament.id, 'round number:', roundIndex + 1)

				for (const [matchIndex, matchData] of roundData.matchs.entries()) {
					const [playerOneProfile, playerTwoProfile] = await Promise.all([
						Profile.findOne({
							where: { userName: matchData.player1 },
							include: [{ model: Stat }],
							attributes: ['id', 'userName']
						}),
						Profile.findOne({
							where: { userName: matchData.player2 },
							include: [{ model: Stat }],
							attributes: ['id', 'userName']
						})
					])
					
					const [winnerPlayer, loserPlayer] = await Promise.all([
						matchData.winner === playerOneProfile?.userName ? playerOneProfile :
							(matchData.winner === playerTwoProfile?.userName ? playerTwoProfile : null),
						matchData.loser === playerOneProfile?.userName ? playerOneProfile :
							(matchData.loser === playerTwoProfile?.userName ? playerTwoProfile : null)
					])

					const match = await RoundMatch.create({
						roundNumber: matchData.round,
						matchNumber: matchData.matchNumber,
						playerOneID: playerOneProfile ? playerOneProfile.id : null,
						playerTwoID: playerTwoProfile ? playerTwoProfile.id : null,
						playerOneScore: matchData.player1Score,
						playerTwoScore: matchData.player2Score,
						winnerPlayerID: winnerPlayer ? winnerPlayer.id : null,
					}, { transaction: t })
					console.log('  Created match record with ID:', match.id, 'for round ID:', round.id)

					console.log('   Retrieved players for match:', {
						winner: winnerPlayer ? winnerPlayer.userName : null,
						loser: loserPlayer ? loserPlayer.userName : null
					})

					if (winnerPlayer && loserPlayer) {
						const winnerState = matchData.state.players.find(p => p.id === winnerPlayer.userName)
						const loserState = matchData.state.players.find(p => p.id === loserPlayer.userName)

						await Promise.all([
							winnerPlayer.Stat.increment({
								gamesPlayed: 1,
								gamesWon: 1,
								gameCurrentStreak: 1,
								xp: 70,
								ballHitCount: winnerState?.kickBall ?? 0,
								ballMissCount: winnerState?.missedBall ?? 0,
								gameTotalDuration: matchData.time.duration
							}, { transaction: t }),
							winnerPlayer.Stat.update({
								gameMinDuration: matchData.time.duration < winnerPlayer.Stat.gameMinDuration ? matchData.time.duration : winnerPlayer.Stat.gameMinDuration
							}, { transaction: t }),
							loserPlayer.Stat.increment({
								gamesPlayed: 1,
								gamesLost: 1,
								xp: 10,
								ballHitCount: loserState?.kickBall ?? 0,
								ballMissCount: loserState?.missedBall ?? 0,
								gameTotalDuration: matchData.time.duration
							}, { transaction: t }),
							loserPlayer.Stat.update({
								gameCurrentStreak: 0,
								gameMinDuration: matchData.time.duration < loserPlayer.Stat.gameMinDuration ? matchData.time.duration : loserPlayer.Stat.gameMinDuration
							}, { transaction: t })
						])
					}
					console.log('   Updated statistics for players in match number:', matchIndex + 1)
				}
				console.log(' Completed processing matches for round number:', roundIndex + 1)
			}

			await t.commit()
			return reply.status(200).send({ message: 'Tournament data processed successfully' })
		} catch (error) {
			await t.rollback()
			fastify.log.error('Error saving tournament data:', { message: error.message,
				details: error.toString() })
			return reply.status(500).send({ error: 'Internal Server Error' })
		}
	})

	fastify.get('/match-history', async (request, reply) => {
		const { userName } = request.query ?? {}
		if (!userName) {
			return reply.code(400).send({ error: 'Username is required' })
		}

		const userProfile = await fastify.sequelize.models.Profile.findOne({
			where: { userName: userName },
			attributes: ['id']
		})
		if (!userProfile) {
			return reply.code(404).send({ error: 'User profile not found' })
		}

		const matchHistory = await fastify.sequelize.models.MatchHistory.findAll({
			include: [
				{
					model: fastify.sequelize.models.Team,
					as: 'teamOne',
					required: false
				},
				{
					model: fastify.sequelize.models.Team,
					as: 'teamTwo',
					required: false
				}
			],
		})

		return reply.send({
			success: true,
			matches: JSON.parse(JSON.stringify(matchHistory))
		})
	})

	fastify.get('/tournament-history', async (request, reply) => {
		const { userName } = request.query ?? {}
		if (!userName) {
			return reply.code(400).send({ error: 'Username is required' })
		}

		const userProfile = await fastify.sequelize.models.Profile.findOne({
			where: { userName: userName },
			attributes: ['id']
		})
		if (!userProfile) {
			return reply.code(404).send({ error: 'User profile not found' })
		}

		// Fetch all round matches where the user participated and include round -> tournament and player info
		const roundMatches = await fastify.sequelize.models.RoundMatch.findAll({
			include: [
				{
					model: fastify.sequelize.models.Round,
					include: [
						{
							model: fastify.sequelize.models.TournamentHistory
						}
					]
				},
				{
					model: fastify.sequelize.models.Profile,
					as: 'playerOne'
				},
				{
					model: fastify.sequelize.models.Profile,
					as: 'playerTwo'
				}
			],
			where: {
				[Op.or]: [
					{ playerOneID: userProfile.id },
					{ playerTwoID: userProfile.id }
				]
			},
			order: [[{ model: fastify.sequelize.models.Round }, 'roundNumber', 'ASC'], ['matchNumber', 'ASC']]
		})

		// Convert to plain objects
		const matchesJSON = roundMatches.map(m => m.toJSON())

		// Group matches by tournament -> round
		const tournamentsMap = new Map()
		for (const m of matchesJSON) {
			const round = m.Round
			const tournament = round?.TournamentHistory
			if (!tournament) continue

			const tId = tournament.id
			if (!tournamentsMap.has(tId)) {
				tournamentsMap.set(tId, {
					id: tId,
					name: tournament.name ?? null,
					winnerPlayer: tournament.winnerPlayer ?? null,
					rounds: new Map()
				})
			}

			const tObj = tournamentsMap.get(tId)
			const roundNumber = round.roundNumber ?? m.roundNumber ?? 0
			if (!tObj.rounds.has(roundNumber)) {
				tObj.rounds.set(roundNumber, { roundNumber: roundNumber, matches: [] })
			}

			const rObj = tObj.rounds.get(roundNumber)
			rObj.matches.push({
				id: m.id,
				matchNumber: m.matchNumber,
				roundNumber: m.roundNumber,
				playerOneID: m.playerOneID,
				playerTwoID: m.playerTwoID,
				playerOne: m.playerOne ? m.playerOne.userName : null,
				playerTwo: m.playerTwo ? m.playerTwo.userName : null,
				playerOneScore: m.playerOneScore,
				playerTwoScore: m.playerTwoScore,
				winnerPlayerID: m.winnerPlayerID
			})
		}

		// Convert map structure to array and sort rounds
		const tournaments = Array.from(tournamentsMap.values()).map(t => ({
			id: t.id,
			name: t.name,
			winnerPlayer: t.winnerPlayer,
			rounds: Array.from(t.rounds.values()).sort((a, b) => a.roundNumber - b.roundNumber)
		}))

		fastify.log.debug('Tournaments found for user:', { userName, count: tournaments.length })

		return reply.send({ success: true, tournaments })
	})
 }
