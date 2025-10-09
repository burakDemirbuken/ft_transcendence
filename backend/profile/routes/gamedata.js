export default async function gamedataRoute(fastify) {

	fastify.post('/internal/match', async (request, reply) => {
		const {
			r_playerOne,
			r_playerTwo,
			r_winner,
			r_score,
			r_matchtype,
			r_duration
		} = request.body ?? {}

		const { Profile, Stats, MatchHistory } = fastify.sequelize.models
		const transaction = await fastify.sequelize.transaction()

		try {
			const [playerOne, playerTwo] = await Promise.all([
				Profile.findOne({ 
					where: { username: r_playerOne }, 
					include: [{ model: Stats, as: 'Stat' }], 
					transaction }),
				Profile.findOne({
					where: { username: r_playerTwo }, 
					include: [{ model: Stats, as: 'Stat' }],
					transaction })
				]) //statları kontrol edip oluşturmaya gerek var mı yoksa, başlangıçta default oluşur mu nasıl?

			if (!playerOne || !playerTwo) {
				await transaction.rollback()
				return reply.status(400).send({ error: 'One or both players not found' })
			}

			playerOne.Stat.gamePlayed += 1
			playerTwo.Stat.gamePlayed += 1
			playerOne.Stat.gameTotalDuration += r_duration
			playerTwo.Stat.gameTotalDuration += r_duration

			if (r_winner === r_playerOne) {
				playerOne.Stat.gamesWon += 1
				playerOne.Stat.gameCurrentStreak += 1
				playerOne.Stat.xp += 10 //xp ayarı
				playerTwo.Stat.gamesLost += 1
				playerTwo.Stat.gameCurrentStreak = 0
			}
			else if (r_winner === r_playerTwo) {
				playerTwo.Stat.gamesWon += 1
				playerTwo.Stat.gameCurrentStreak += 1
				playerTwo.Stat.xp += 10 //xp ayarı
				playerOne.Stat.gamesLost += 1
				playerOne.Stat.gameCurrentStreak = 0
			}
			else { //beraberlik durumu
				playerOne.Stat.xp += 5
				playerTwo.Stat.xp += 5
			}
			
			await MatchHistory.create({
				
			}, { transaction})

			await transaction.commit()
			return reply.status(200).send({ message: 'Match data processed successfully' })
		} catch (error) {
			await transaction.rollback()
			fastify.log.error('Error processing match data:', error)
			return reply.status(500).send({ error: 'Internal Server Error' })
		}
	})
	
	fastify.post('/internal/tournament', async (request, reply) => {
		
	})
}
