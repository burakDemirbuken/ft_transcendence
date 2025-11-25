import fp from 'fastify-plugin'
import { Op } from 'sequelize'

export default fp(async (fastify) => {
	async function getLastSevenDaysMatches(userId = null) {
		const { MatchHistory } = fastify.sequelize.models

		if (!userId) {
			throw new Error("userId is required.")
		}

		const sevenDaysAgo = new Date()
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
		sevenDaysAgo.setHours(0, 0, 0, 0)

		const matchHistory = await MatchHistory.findAll({
			include: [
				{
					model: fastify.sequelize.models.Team,
					as: 'teamOne',
					required: false,
					attributes: ['playerOneId', 'playerTwoId']
				},
				{
					model: fastify.sequelize.models.Team,
					as: 'teamTwo',
					required: false,
					attributes: ['playerOneId', 'playerTwoId']
				}
			],
			where: {
				matchStartDate: {
					[Op.gte]: sevenDaysAgo
				},
				[Op.or]: [
					{ '$teamOne.playerOneId$': userId },
					{ '$teamOne.playerTwoId$': userId },
					{ '$teamTwo.playerOneId$': userId },
					{ '$teamTwo.playerTwoId$': userId },
				]
			},
			attributes: ['matchStartDate']
		})

		const matchesByDay = {}

		for (let i = 6; i >= 0; i--) {
			const date = new Date()
			date.setDate(date.getDate() - i)
			const dateKey = date.toISOString().split('T')[0]
			matchesByDay[dateKey] = 0
		}

		matchHistory.forEach(match => {
			const matchDate = new Date(match.matchStartDate)
			const dateKey = matchDate.toISOString().split('T')[0]

			if (matchesByDay.hasOwnProperty(dateKey)) {
				matchesByDay[dateKey]++
			}
		})

		return {
			matchesByDay: matchesByDay,
			totalMatchesLastSevenDays: matchHistory.length
		}
	}

	async function checkAchievements(player = null) {
		if (!player) {
			throw new Error('Profile not found for user')
		}

		const updates = {}
		if (!player.Achievement.fiveHundredWins && player.Stat.gamesWon >= 500) {
			updates.fiveHundredWins = new Date()
		}
		else if (!player.Achievement.hundredWins && player.Stat.gamesWon >= 100) {
			updates.hundredWins = new Date()
		}
		else if (!player.Achievement.firstWin && player.Stat.gamesWon >= 1) {
			updates.firstWin = new Date()
		}

		if (!player.Achievement.twentyFiveTenStreak && player.Stat.gameLongestStreak >= 25) {
			updates.twentyFiveTenStreak = new Date()
		}
		else if (!player.Achievement.firstTenStreak && player.Stat.gameLongestStreak >= 10) {
			updates.firstTenStreak = new Date()
		}

		if (!player.Achievement.lessThanThreeMin && player.Stat.gameMinDuration > 0 && player.Stat.gameMinDuration < 180000) {
			updates.lessThanThreeMin = new Date()
		}

		if (Object.keys(updates).length > 0) {
			return updates
		}
	}

	async function getAchievementProgress(achievements = null) {
		if (!achievements) {
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
		const A = (xp * (growthFactor - 1)) / baseXP + 1
		const level = Math.floor(Math.log(A) / Math.log(growthFactor)) + 1

		return level
	}

	function levelCalculate(xp, baseXP = 100, growthFactor = 1.25) {
		if (xp <= 0)
			return { level: 0, currentXP: 0, xpForNextLevel: baseXP }

		const nReal = nRealcalculate(xp, baseXP, growthFactor)
		const level = Math.max(1, Math.floor(nReal))

		const coefficient = baseXP / (growthFactor - 1)
		const S = (level) => Math.floor(coefficient * (Math.pow(growthFactor, level) - 1))
		const minXp = S(level - 1)
		const maxXp = S(level) - 1
		const progressRatio = ((xp - minXp) / (maxXp - minXp)) * 100 || 0

		return {
			level: level,
			progressRatio: progressRatio
		}
	}

	async function statCalculate(profile = null) {
		console.log('Calculating stats for userId:', profile)

		let lastSevenDaysData = { matchesByDay: {}, totalMatchesLastSevenDays: 0 }

		try {
			lastSevenDaysData = await getLastSevenDaysMatches(profile.id)
		} catch (error) {
			fastify.log.warn(`Error fetching last seven days matches: ${error.message}`)
		}

		const totalDurationSeconds = profile.Stat.gameTotalDuration || 0

		return ({
			...JSON.parse(JSON.stringify(profile.Stat)),
			...levelCalculate(profile.Stat.xp),
			gameTotalDuration: totalDurationSeconds,
			gameAverageDuration: profile.Stat.gamesPlayed > 0 ? (totalDurationSeconds / profile.Stat.gamesPlayed) : 0,
			winRate: profile.Stat.gamesPlayed > 0 ? (profile.Stat.gamesWon / profile.Stat.gamesPlayed) * 100 : 0,
			speed: (profile.Stat.gamesPlayed > 0 && totalDurationSeconds > 0) ? (profile.Stat.ballHitCount / (totalDurationSeconds)) * 100 : 0,
			attack: profile.Stat.gamesPlayed > 0 ? (profile.Stat.gamesWon / profile.Stat.gamesPlayed) * 100 : 0,
			endurance: (profile.Stat.gamesPlayed > 0 && totalDurationSeconds > 0) ? (totalDurationSeconds / (totalDurationSeconds + profile.Stat.gamesPlayed)) * 100 : 0,
			defence: (profile.Stat.ballHitCount > 0 && profile.Stat.gamesLost > 0) ? (profile.Stat.ballHitCount / (profile.Stat.ballHitCount + profile.Stat.gamesLost + 1)) * 100 : 0,
			accuracy: (profile.Stat.ballHitCount > 0 && profile.Stat.ballMissCount > 0) ? (profile.Stat.ballHitCount / (profile.Stat.ballHitCount + profile.Stat.ballMissCount)) * 100 : 0,
			lastSevenDaysMatches: lastSevenDaysData.matchesByDay,
			totalMatchesLastSevenDays: lastSevenDaysData.totalMatchesLastSevenDays,
			hitRate: (profile.Stat.ballHitCount > 0 && profile.Stat.ballMissCount > 0) ?((profile.Stat.ballHitCount / (profile.Stat.ballHitCount + profile.Stat.ballMissCount)) * 100) : 0,
		})
	}

	fastify.decorate('statCalculate', statCalculate)

}, {
	name: 'checkachievement',
	fastify: '4.x'
})
