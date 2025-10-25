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
			profile  | {
profile  |   "name": "asdasd",
profile  |   "winner": "test2",
profile  |   "rounds": [
profile  |     {
profile  |       "round": 0,
profile  |       "matchs": [
profile  |         {
profile  |           "matchNumber": 0,
profile  |           "player1": "test2",
profile  |           "player2": "test0",
profile  |           "player1Score": 1,
profile  |           "player2Score": 0,
profile  |           "winner": "test2",
profile  |           "loser": "test0",
profile  |           "state": {
profile  |             "players": [
profile  |               {
profile  |                 "id": "test2",
profile  |                 "kickBall": 0,
profile  |                 "missedBall": 0
profile  |               },
profile  |               {
profile  |                 "id": "test0",
profile  |                 "kickBall": 0,
profile  |                 "missedBall": 1
profile  |               }
profile  |             ]
profile  |           },
profile  |           "time": {
profile  |             "start": 1761413543844,
profile  |             "finish": 1761413547123,
profile  |             "duration": 1287
profile  |           }
profile  |         },
profile  |         {
profile  |           "matchNumber": 1,
profile  |           "player1": "test3",
profile  |           "player2": "test1",
profile  |           "player1Score": 1,
profile  |           "player2Score": 0,
profile  |           "winner": "test3",
profile  |           "loser": "test1",
profile  |           "state": {
profile  |             "players": [
profile  |               {
profile  |                 "id": "test3",
profile  |                 "kickBall": 0,
profile  |                 "missedBall": 0
profile  |               },
profile  |               {
profile  |                 "id": "test1",
profile  |                 "kickBall": 0,
profile  |                 "missedBall": 1
profile  |               }
profile  |             ]
profile  |           },
profile  |           "time": {
profile  |             "start": 1761413543844,
profile  |             "finish": 1761413547123,
profile  |             "duration": 1287
profile  |           }
profile  |         }
profile  |       ]
profile  |     },
profile  |     {
profile  |       "round": 1,
profile  |       "matchs": [
profile  |         {
profile  |           "matchNumber": 0,
profile  |           "player1": "test2",
profile  |           "player2": "test3",
profile  |           "player1Score": 1,
profile  |           "player2Score": 0,
profile  |           "winner": "test2",
profile  |           "loser": "test3",
profile  |           "state": {
profile  |             "players": [
profile  |               {
profile  |                 "id": "test2",
profile  |                 "kickBall": 0,
profile  |                 "missedBall": 0
profile  |               },
profile  |               {
profile  |                 "id": "test3",
profile  |                 "kickBall": 0,
profile  |                 "missedBall": 1
profile  |               }
profile  |             ]
profile  |           },
profile  |           "time": {
profile  |             "start": 1761413553317,
profile  |             "finish": 1761413556612,
profile  |             "duration": 1302
profile  |           }
profile  |         }
profile  |       ]
profile  |     }
profile  |   ],
profile  |   "matchType": "tournament"
profile  | }


			*/
			/*
				name,
				rounds[
					{
						matchs[
							{
								round: i,
								matchNumber: j,
								player1: null,
								player2: null,
								player1Score: null,
								player2Score: null,
								winner: null,
								loser: null,
								time: {
									start: null,
									end: null,
									duration: null
								},
								state: {
									players: [
										{
											id: null,
											kickBall: null,
											missedBall: null
										}
									]
								}
							},
							{}
						]

					}
				]
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
				winnerPlayer: (await Profile.findOne({ where: { userName: winner } }))?.id ?? null
			}, { transaction: t })
			console.log('Created tournament record with ID:', tournament.id)

			for (const [roundIndex, roundData] of rounds.entries()) {
				const round = await Round.create({
					roundNumber: roundIndex + 1,
					tournamentId: tournament.id
				}, { transaction: t })
				console.log(' Created round record with ID:', round.id, 'for tournament ID:', tournament.id, 'round number:', roundIndex + 1)

				for (const [matchIndex, matchData] of roundData.matchs.entries()) {
					const match = await RoundMatch.create({
						roundNumber: matchData.round,
						matchNumber: matchData.matchNumber,
						playerOneID: ( Profile.findOne({ where: { userName: matchData.player1 } }))?.id ?? null,
						playerTwoID: ( Profile.findOne({ where: { userName: matchData.player2 } }))?.id ?? null,
						playerOneScore: matchData.player1Score,
						playerTwoScore: matchData.player2Score,
						winnerPlayerID: ( Profile.findOne({ where: { userName: matchData.winner } }))?.id ?? null
					}, { transaction: t })
					console.log('  Created match record with ID:', match.id, 'for round ID:', round.id)

					const [winnerPlayer, loserPlayer] = await Promise.all([
						Profile.findOne({
							where: {
								userName: matchData.winner ?? null,
							},
							include: [{ model: Stat }],
							transaction: t
						}),
						Profile.findOne({
							where: {
								userName: matchData.loser ?? null
							},
							include: [{ model: Stat }],
							transaction: t
						})
					])
					console.log('   Retrieved players for match:', {
						winner: winnerPlayer ? winnerPlayer.userName : null,
						loser: loserPlayer ? loserPlayer.userName : null
					})

					if (winnerPlayer && loserPlayer) {
						const winnerState = matchData.state.players.find(p => p.id === matchData.winner)
						const loserState = matchData.state.players.find(p => p.id === matchData.loser)

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

		let RoundMatch = await fastify.sequelize.models.RoundMatch.findAll({
			include: [
				{
					model: fastify.sequelize.models.Round,
					include: [
						{
							model: fastify.sequelize.models.TournamentHistory,
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
		})

		console.log(RoundMatch.toJSON())

		return reply.send({ success: true,
			matches: RoundMatch.toJSON()
		})
	})
 }
