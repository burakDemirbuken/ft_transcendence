import fp from 'fastify-plugin'

export default fp(async (fastify) => {
	async function checkAchievements(userId, t) {
		const { Achievement, Stat } = fastify.sequelize.models

		const [userStat, userAchievement] = await Promise.all([
			Stat.findOne({
				where: { userId: userId },
				transaction: t
			}),
			Achievement.findOne({
				where: { userId: userId },
				transaction: t
			})
		])
		if (!userStat || !userAchievement) {
			throw new Error('userStat or userAchievement not found for user')
		}

		const updates = {}
		if (!userAchievement.fiveHundredWins && userStat.gamesWon >= 500) {
			updates.fiveHundredWins = new Date()
		}
		else if (!userAchievement.hundredWins && userStat.gamesWon >= 100) {
			updates.hundredWins = new Date()
		}
		else if (!userAchievement.firstWin && userStat.gamesWon >= 1) {
			updates.firstWin = new Date()
		}

		if (!userAchievement.twentyFiveTenStreak && userStat.gameLongestStreak >= 25) {
			updates.twentyFiveTenStreak = new Date()
		}
		else if (!userAchievement.firstTenStreak && userStat.gameLongestStreak >= 10) {
			updates.firstTenStreak = new Date()
		}

		if (!userAchievement.lessThanThreeMin && userStat.gameMinDuration > 0 && userStat.gameMinDuration < 180000) {
			updates.lessThanThreeMin = new Date()
		}

		if (Object.keys(updates).length > 0) {
			await userAchievement.update(updates, { transaction: t })
		}

	}
	async function getAchievementProgress(userId) {
		const { Achievement, Stat } = fastify.sequelize.models

		const [stats, achievements] = await Promise.all([
			Stat.findOne({
				where: { userId: userId }
			}),
			Achievement.findOne({
				where: { userId: userId }
			})
		])

		if (!stats || !achievements) {
			throw new Error('Stats or Achievements not found for user')
		}

		return ({
			firstWin: {
				unlockedAt: achievements.firstWin || null,
			},
			hundredWins: {
				unlockedAt: achievements.hundredWins || null
			},
			fiveHundredWins: {
				unlockedAt: achievements.fiveHundredWins || null
			},
			firstTenStreak: {
				unlockedAt: achievements.firstTenStreak || null
			},
			twentyFiveTenStreak: {
				unlockedAt: achievements.twentyFiveTenStreak || null
			},
			lessThanThreeMin: {
				unlockedAt: achievements.lessThanThreeMin || null
			}
		})
	}

	fastify.decorate('checkAchievements', checkAchievements)
	fastify.decorate('getAchievementProgress', getAchievementProgress)

	function nRealcalculate(xp, baseXP = 100, growthFactor = 1.25) {
		if (xp < 0)
			return 0;

		let level = 0;
		let currentXP = 0;

		while (currentXP <= xp) {
			level++;
			currentXP += baseXP * Math.pow(growthFactor, level - 1);
		}

		return level;
	}

	function levelCalculate(xp, baseXP = 100, growthFactor = 1.25) {
		if (xp < 0)
			return { level: 0, currentXP: 0, xpForNextLevel: baseXP }

		const nReal = nRealcalculate(xp, baseXP, growthFactor)
		const level = Math.max(1, Math.floor(nReal))

		const S = (level) => Math.floor(baseXP * (Math.pow(growthFactor, level) - 1) / (growthFactor - 1))
		const minXp = S(level - 1)
		const maxXp = S(level) - 1
		const progressRatio = ((xp - minXp) / (maxXp - minXp)) * 100 || 0

		return {
			level: level,
			progressRatio: progressRatio
		}
	}

	async function statCalculate(userId) {
		const { Stat } = fastify.sequelize.models

		const stats = await Stat.findOne({
			where: { userId: userId },
			attributes: [
				'xp',
				'gamesPlayed',
				'gamesWon',
				'gamesLost',
				'gameTotalDuration',
				'gameCurrentStreak',
				'gameLongestStreak',
				'gameMinDuration'
			]
		})

		if (!stats) {
			throw new Error('Stats not found for user')
		}

		return ({
			...stats.toJSON(),
			...levelCalculate(stats.xp),
			gameAverageDuration: (stats.gameTotalDuration / stats.gamesPlayed) || 0,
			winRate: stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0,
			speed: (stats.gamesPlayed > 0 && stats.gameTotalDuration > 0) ? (stats.ballHitCount / (stats.gameTotalDuration * stats.gamesPlayed)) * 100 : 0,
			endurance: (stats.gamesPlayed > 0 && stats.gameTotalDuration > 0) ? (stats.gameTotalDuration / (stats.gameTotalDuration + stats.gamesPlayed)) * 100 : 0,
			defence: (stats.ballHitCount > 0 && stats.gamesLost > 0) ? (stats.ballHitCount / (stats.ballHitCount + stats.gamesLost + 1)) * 100 : 0,
			accuracy: (stats.ballHitCount > 0 && stats.ballMissCount > 0) ? (stats.ballHitCount / (stats.ballHitCount + stats.ballMissCount)) * 100 : 0
		})
	}

	fastify.decorate('statCalculate', statCalculate)

}, {
	name: 'checkachievement',
	fastify: '4.x'
})
