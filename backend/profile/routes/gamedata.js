export default async function gamedataRoute(fastify) {

	fastify.post('/internal/match', async (request, reply) => {
		const {
			r_playerOne,
			r_playerTwo,
			r_winner,
			r_teamonescore,
			r_teamtwoscore,
			r_matchtype,
			r_duration
		} = request.body ?? {}

		const { Profile, Stats, MatchHistory } = fastify.sequelize.models
		const t = await fastify.sequelize.transaction()

		try {
			const [playerOne, playerTwo] = await Promise.all([
				Profile.findOne({ 
					where: { username: r_playerOne }, 
					include: [{ model: Stats }], 
					transaction: t
				}),
				Profile.findOne({
					where: { username: r_playerTwo }, 
					include: [{ model: Stats }],
					transaction: t
				})
				]) //statları kontrol edip oluşturmaya gerek var mı yoksa, başlangıçta default oluşur mu nasıl?

			if (!playerOne || !playerTwo) {
				await t.rollback()
				return reply.status(400).send({ error: 'One or both players not found' })
			}

			const baseUpdates = {
				gamesPlayed: 1,
				gameTotalDuration: r_duration
			}

			if (r_winner === r_playerOne) {
				await Promise.all([
					playerOne.Stats.increment({
						...baseUpdates,
						gamesWon: 1,
						gameCurrentStreak: 1,
						xp: 10
					}, { transaction: t }),
					playerTwo.Stats.increment({
						...baseUpdates,
						gamesLost: 1
					}, { transaction: t }),
					playerTwo.Stats.update({
						gameCurrentStreak: 0
					}, { transaction: t })
				])
			} else if (r_winner === r_playerTwo) {
				await Promise.all([
					playerTwo.Stats.increment({
						...baseUpdates,
						gamesWon: 1,
						gameCurrentStreak: 1,
						xp: 10
					}, { transaction: t }),
					playerOne.Stats.increment({
						...baseUpdates,
						gamesLost: 1
					}, { transaction: t }),
					playerOne.Stats.update({
						gameCurrentStreak: 0
					}, { transaction: t })
				])
			} else {
				await Promise.all([
					playerOne.Stats.increment({
						...baseUpdates,
						xp: 5
					}, { transaction: t }),
					playerTwo.Stats.increment({
						...baseUpdates,
						xp: 5
					}, { transaction: t })
				])
			}

			const [teamOne, teamTwo] = await Promise.all([
				fastify.sequelize.models.Team.create({
					playerOneId: playerOne.id,
					playerTwoId: null
				}, {
					transaction: t
				}),
				fastify.sequelize.models.Team.create({
					playerOneId: playerTwo.id,
					playerTwoId: null
				}, {
					transaction: t
				})
			])

			await MatchHistory.create({
				teamOneId: teamOne.id,
				teamTwoId: teamTwo.id,
				winnerTeamId: r_winner === r_playerOne ? teamOne.id : r_winner === r_playerTwo ? teamTwo.id : null,
				teamOneScore: r_teamonescore,
				teamTwoScore: r_teamtwoscore,
				matchType: r_matchtype,
				duration: r_duration
			}, {
				transaction: t
			})

			await t.commit()
			return reply.status(200).send({ message: 'Match data processed successfully' })
		} catch (error) {
			await t.rollback()
			fastify.log.error('Error processing match data:', error)
			return reply.status(500).send({ error: 'Internal Server Error' })
		}
	})
	
	fastify.post('/internal/tournament', async (request, reply) => {
		
	})
}
