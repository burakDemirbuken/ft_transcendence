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

		const { Profile, Stats, MatchHistory, Team } = fastify.sequelize.models
		const t = await fastify.sequelize.transaction()

		try {
			const [teamOnePlayers, teamTwoPlayers] = await Promise.all([
				Profile.findAll({
					where: { userName: team1.playersId },
					include: [{ model: Stats }],
					transaction: t
				}),
				Profile.findAll({
					where: { userName: team2.playersId },
					include: [{ model: Stats }],
					transaction: t
				})
			])

			const winnerTeam = winner === 1 ? teamOnePlayers : winner === 2 ? teamTwoPlayers : null
			const loserTeam = winner === 1 ? teamTwoPlayers : winner === 2 ? teamOnePlayers : null

			if (winnerTeam) {
				await Promise.all([
					winnerTeam.forEach(async (player) => {
						const playerState = state.players.find(p => p.id === player.id)
						player.Stats.increment({
							gamesPlayed: 1,
							gamesWon: 1,
							gameCurrentStreak: 1,
							xp: 70,
							ballHitCount: playerState?.kickBall ?? 0,
							ballMissCount: playerState?.missedBall ?? 0,
							gameTotalDuration: time.duration
						}, { transaction: t })
						player.Stats.update({
							gameMinDuration: time.duration < player.Stats.gameMinDuration ? time.duration : player.Stats.gameMinDuration
						})
					}),
					loserTeam.forEach(async (player) => {
						const playerState = state.players.find(p => p.id === player.id)
						player.Stats.increment({
							gamesPlayed: 1,
							gamesLost: 1,
							xp: 10,
							gameTotalDuration: time.duration,
							ballHitCount: playerState?.kickBall ?? 0,
							ballMissCount: playerState?.missedBall ?? 0
						}, { transaction: t })
						player.Stats.update({
							gameCurrentStreak: 0,
							gameMinDuration: time.duration < player.Stats.gameMinDuration ? time.duration : player.Stats.gameMinDuration
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

			await Promise.all([
				teamOnePlayers.forEach(async (player) => {
					fastify.checkAchievements(player.id, t)
				}),
				teamTwoPlayers.forEach(async (player) => {
					fastify.checkAchievements(player.id, t)
				})
			])

			await MatchHistory.create({
				teamOneId: teamOne.id,
				teamTwoId: teamTwo.id,
				winnerTeamId: winner === 1 ? teamOne.id : winner === 2 ? teamTwo.id : null,
				teamOneScore: team1.score,
				teamTwoScore: team2.score,
				matchType: matchType,
				duration: time.duration
			}, { transaction: t })

			await t.commit()
			return reply.status(200).send({ message: 'Match data processed successfully' })
		} catch (error) {
			await t.rollback()
			fastify.log.error('Error processing match data:', error)
			return reply.status(500).send({ error: 'Internal Server Error' })
		}
	})

	fastify.post('/internal/tournament', async (request, reply) => {
		const {
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
			winner,
			name,
			rounds
		} = request.body ?? {}

		const { Profile, Stats, RoundMatch, Round, TournamentHistory } = fastify.sequelize.models
		const t = await fastify.sequelize.transaction()

		try {

			const tournament = await TournamentHistory.create({
				name: name,
				winnerPlayer: winner
			}, { transaction: t })

			rounds.forEach(async (roundData, roundIndex) => {
				const round = await Round.create({
					roundNumber: roundIndex + 1,
					tournamentId: tournament.id
				}, { transaction: t })

				roundData.matchs.forEach(async (matchData, matchIndex) => {
					const match = await RoundMatch.create({
						roundId: round.id,
						roundNumber: matchData.round,
						matchNumber: matchData.matchNumber,
						playerOneID: matchData.player1?.id ?? null,
						playerTwoID: matchData.player2?.id ?? null,
						playerOneScore: matchData.player1Score,
						playerTwoScore: matchData.player2Score,
						winnerPlayerID: matchData.winner?.id ?? null
					}, { transaction: t })



					const [winnerPlayer, loserPlayer] = await Promise.all([
						Profile.findOne({
							where: {
								userName: matchData.winner ?? null,
							},
							include: [{ model: Stats }],
							transaction: t
						}),
						Profile.findOne({
							where: {
								userName: matchData.loser ?? null
							},
							include: [{ model: Stats }],
							transaction: t
						})
					])

					Promise.all([
						() => {
							const winnerState = matchData.state.players.find(p => p.id === matchData.winner)
							winnerPlayer?.Stats.increment({
								gamesPlayed: 1,
								gamesWon: 1,
								gameCurrentStreak: 1,
								xp: 70,
								ballHitCount: winnerState?.kickBall ?? 0,
								ballMissCount: winnerState?.missedBall ?? 0,
								gameTotalDuration: matchData.time.duration
							}, { transaction: t })
							winnerPlayer?.Stats.update({
								gameMinDuration: matchData.time.duration < winnerPlayer.Stats.gameMinDuration ? matchData.time.duration : winnerPlayer.Stats.gameMinDuration
							}, { transaction: t })
						},
						() => {
							const loserState = matchData.state.players.find(p => p.id === matchData.loser)
							loserPlayer?.Stats.increment({
								gamesPlayed: 1,
								gamesLost: 1,
								gameCurrentStreak: 0,
								xp: 10,
								ballHitCount: loserState?.kickBall ?? 0,
								ballMissCount: loserState?.missedBall ?? 0,
								gameTotalDuration: matchData.time.duration
							}, { transaction: t })
							loserPlayer?.Stats.update({
								gameMinDuration: matchData.time.duration < loserPlayer.Stats.gameMinDuration ? matchData.time.duration : loserPlayer.Stats.gameMinDuration
							}, { transaction: t })
						}
					])

				})
			})

		} catch (error) {
			await t.rollback()
			fastify.log.error('Error processing tournament data:', error)
			return reply.status(500).send({ error: 'Internal Server Error' })
		}
	})
}
