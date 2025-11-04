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

			if (!team1 || !team2 || !state || !time || !matchType || !!winner) {
				throw new Error('Invalid match data provided')
			} else if (!Profile || !Stat || !MatchHistory || !Team) {
				throw new Error('Database models are not properly initialized')
			}

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

			const winnerTeam = winner?.team ?
				(winner.team.playersId[0] === team1.playersId[0] ? teamOnePlayers : teamTwoPlayers)
				: null
			const loserTeam = winner?.team ?
				(winner.team.playersId[0] === team1.playersId[0] ? teamTwoPlayers : teamOnePlayers)
				: null

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

			await Promise.all([
				...teamOnePlayers.map(async (player) => {
					if (player && player.id) {
						await fastify.checkAchievements(player.id, t)
					}
				}),
				...teamTwoPlayers.map(async (player) => {
					if (player && player.id) {
						await fastify.checkAchievements(player.id, t)
					}
				})
			])

			await t.commit()
			return reply.status(200).send({ message: 'Match data processed successfully' })
		} catch (error) {
			await t.rollback()
			fastify.log.error('Error saving match data:', { message: error.message,
				details: error.toString() })
			return reply.status(500).send({ message: 'Error processing match data' })
		}
	})

	fastify.post('/internal/tournament', async (request, reply) => {
		const { name, winner, rounds } = request.body ?? {}
		const { Profile, Stat, RoundMatch, Round, TournamentHistory } = fastify.sequelize.models
		const t = await fastify.sequelize.transaction()

		console.log(JSON.stringify(request.body, null, 2))
		try {

			if (!name || !rounds || !Array.isArray(rounds) || rounds.length === 0) {
				throw new Error('Invalid tournament data provided')
			} else if (!Profile || !Stat || !RoundMatch || !Round || !TournamentHistory) {
				throw new Error('Database models are not properly initialized')
			}

			const tournament = await TournamentHistory.create({
				name: name,
				winnerPlayer: (await Profile.findOne({
					where: { userName: winner },
					attributes: ['id']
				}))?.id ?? null
			}, { transaction: t })

			let allPlayerProfile = []

			for (const [roundIndex, roundData] of rounds.entries()) {
				const round = await Round.create({
					roundNumber: roundData.round,
					tournamentId: tournament.id
				}, { transaction: t })

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

					if (playerOneProfile?.id && !allPlayerProfile.includes(playerOneProfile.id)) {
						allPlayerProfile.push(playerOneProfile.id)
					}
					if (playerTwoProfile?.id && !allPlayerProfile.includes(playerTwoProfile.id)) {
						allPlayerProfile.push(playerTwoProfile.id)
					}

					const [winnerPlayer, loserPlayer] = await Promise.all([
						matchData.winner === playerOneProfile?.userName ? playerOneProfile :
							(matchData.winner === playerTwoProfile?.userName ? playerTwoProfile : null),
						matchData.loser === playerOneProfile?.userName ? playerOneProfile :
							(matchData.loser === playerTwoProfile?.userName ? playerTwoProfile : null)
					])

					const match = await RoundMatch.create({
						roundId: round.id,
						roundNumber: roundData.round,
						matchNumber: matchData.matchNumber,
						playerOneID: playerOneProfile ? playerOneProfile.id : null,
						playerTwoID: playerTwoProfile ? playerTwoProfile.id : null,
						playerOneScore: matchData.player1Score,
						playerTwoScore: matchData.player2Score,
						winnerPlayerID: winnerPlayer ? winnerPlayer.id : null,
					}, { transaction: t })

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
				}
			}

			await Promise.all(
				allPlayerProfile
					.filter(Boolean)
					.map(async (playerId) => fastify.checkAchievements(playerId, t))
			)

			await t.commit()
			return reply.status(200).send({ message: 'Tournament data processed successfully' })
		} catch (error) {
			await t.rollback()
			fastify.log.error('Error saving tournament data:', { message: error.message,
				details: error.toString() })
			return reply.status(500).send({ message: 'Error processing tournament data' })
		}
	})

	fastify.get('/match-history', async (request, reply) => {
		const { userName } = request.query ?? {}

		try {
			if (!userName) {
				throw new Error("userName is required.")
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
						required: false,
						include: [
							{
								model: fastify.sequelize.models.Profile,
								as: 'PlayerOne',
								attributes: ['userName', 'displayName', 'avatarUrl']
							},
							{
								model: fastify.sequelize.models.Profile,
								as: 'PlayerTwo',
								attributes: ['userName', 'displayName', 'avatarUrl']
							}
						]
					},
					{
						model: fastify.sequelize.models.Team,
						as: 'teamTwo',
						required: false,
						include: [
							{
								model: fastify.sequelize.models.Profile,
								as: 'PlayerOne',
								attributes: ['userName', 'displayName', 'avatarUrl'],
							},
							{
								model: fastify.sequelize.models.Profile,
								as: 'PlayerTwo',
								attributes: ['userName', 'displayName', 'avatarUrl']
							}
						]
					},
					{
						model: fastify.sequelize.models.Team,
						as: 'winnerTeam',
						required: false,
						include: [
							{
								model: fastify.sequelize.models.Profile,
								as: 'PlayerOne',
								attributes: ['userName', 'displayName', 'avatarUrl']
							},
							{
								model: fastify.sequelize.models.Profile,
								as: 'PlayerTwo',
								attributes: ['userName', 'displayName', 'avatarUrl']
							}
						]
					}
				],
				where: {
					[Op.or]: [
						{ '$teamOne.playerOneId$': userProfile.id },
						{ '$teamOne.playerTwoId$': userProfile.id },
						{ '$teamTwo.playerOneId$': userProfile.id },
						{ '$teamTwo.playerTwoId$': userProfile.id },
					]
				}
			})

			return reply.send({
				success: true,
				matches: JSON.parse(JSON.stringify(matchHistory))
			})
		} catch (error) {
			fastify.log.error('Error retrieving user match history:', { message: error.message,
				details: error.toString() })
			return reply.code(500).send({message: 'Failed to retrieve match history' })
		}
	})

	fastify.get('/tournament-history', async (request, reply) => {
		const { userName } = request.query ?? {}
		
		try {
			if (!userName) {
				throw new Error("userName is required.")
			}

			const userProfile = await fastify.sequelize.models.Profile.findOne({
				where: { userName: userName },
				as: 'userProfile',
				attributes: ['id']
			})
			if (!userProfile) {
				return reply.code(404).send({ error: 'User profile not found' })
			}

			const usersTournament = await fastify.sequelize.models.TournamentHistory.findAll({
				include: [
					{
						model: fastify.sequelize.models.Round,
						include: [
							{
								model: fastify.sequelize.models.RoundMatch,
								include: [
									{
										model: fastify.sequelize.models.Profile,
										as: 'playerOne',
										attributes: ['userName', 'displayName', 'avatarUrl'],
									},
									{
										model: fastify.sequelize.models.Profile,
										as: 'playerTwo',
										attributes: ['userName', 'displayName', 'avatarUrl'],
									},
									{
										model: fastify.sequelize.models.Profile,
										as: 'winnerPlayer',
										attributes: ['userName', 'displayName', 'avatarUrl']
									}
								],
								attributes: ['matchNumber', 'playerOneID', 'playerTwoID', 'playerOneScore', 'playerTwoScore', 'winnerPlayerID'],
								order: [['matchNumber', 'ASC']],
							}
						],
						attributes: ['roundNumber'],
						order: [['roundNumber', 'ASC']],
					}
				],
				attributes: ['name', 'winnerPlayer'],
				where : {
					[Op.or]: [
						{ '$Rounds.RoundMatches.playerOneID$': userProfile.id },
						{ '$Rounds.RoundMatches.playerTwoID$': userProfile.id }
					]
				}
			})

			return reply.send({ success: true, usersTournament: JSON.parse(JSON.stringify(usersTournament)) })
		} catch (error) {
			fastify.log.error('Error retrieving user tournament history:', { message: error.message,
				details: error.toString() })
			return reply.code(500).send({message: 'Failed to retrieve tournament history' })
		}
	})

	function mockTournamentHistory() {
		// This function can be expanded to create mock tournament data for testing purposes
		// usersTournament: JSON.parse(JSON.stringify(usersTournament))

		return {
			name: "Mock Tournament",
			winnerPlayer: "player1",
			Rounds: [
				{
					roundNumber: 1,
					RoundMatches: [
						{
							matchNumber: 1,
							playerOneID: {
								userName: "player1",
								displayName: "Player One",
								avatarUrl: "http://example.com/avatar1.png"
							},
							playerTwoID: {
								userName: "player2",
								displayName: "Player Two",
								avatarUrl: "http://example.com/avatar2.png"
							},
							playerOneScore: 3,
							playerTwoScore: 2,
							winnerPlayerID: 1 // şaibeli
							
						},
						{
							matchNumber: 2,
							playerOneID: {
								userName: "player1",
								displayName: "Player One",
								avatarUrl: "http://example.com/avatar1.png"
							},
							playerTwoID: {
								userName: "player2",
								displayName: "Player Two",
								avatarUrl: "http://example.com/avatar2.png"
							},
							playerOneScore: 3,
							playerTwoScore: 2,
							winnerPlayerID: 1 // şaibeli
						}
					]
				},
				{
					roundNumber: 2,
					RoundMatches: [
						{
							matchNumber: 1,
							playerOneID: {
								userName: "player1",
								displayName: "Player One",
								avatarUrl: "http://example.com/avatar1.png"
							},
							playerTwoID: {
								userName: "player2",
								displayName: "Player Two",
								avatarUrl: "http://example.com/avatar2.png"
							},
							playerOneScore: 3,
							playerTwoScore: 2,
							winnerPlayerID: 1 // şaibeli
						},
						{
							matchNumber: 2,
							playerOneID: {
								userName: "player1",
								displayName: "Player One",
								avatarUrl: "http://example.com/avatar1.png"
							},
							playerTwoID: {
								userName: "player2",
								displayName: "Player Two",
								avatarUrl: "http://example.com/avatar2.png"
							},
							playerOneScore: 3,
							playerTwoScore: 2,
							winnerPlayerID: 1 // şaibeli
						}
					]
				}
			]
		}
	}

	function mockMatchHistory() {
		// This function can be expanded to create mock match data for testing purposes
		return 
	}
}
