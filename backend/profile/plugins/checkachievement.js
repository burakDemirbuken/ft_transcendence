 import fp from 'fastify-plugin'
import { getUserMatchHistory, getLastSevenDaysMatches } from '../routes/gamedata.js'

export default fp(async (fastify) => {
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

	async function statCalculate(userId, profile = null) {
		const { Stat, Profile } = fastify.sequelize.models
		console.log('Calculating stats for userId:', profile)
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
				'gameMinDuration',
				'ballHitCount',
				'ballMissCount'
			]
		})

		if (!stats) {
			throw new Error('Stats not found for user')
		}

		// userId'den userName'i al
		const userProfile = await Profile.findOne({
			where: { id: userId },
			attributes: ['userName']
		})

		if (!userProfile) {
			throw new Error('User profile not found')
		}

		// Match history'yi al
		const matchData = await getUserMatchHistory(fastify, userProfile.userName)

		if (matchData.error) {
			throw new Error(matchData.error)
		}

		let lastSevenDaysData = { matchesByDay: {}, totalMatchesLastSevenDays: 0 }

		try {
			lastSevenDaysData = await getLastSevenDaysMatches(fastify, userProfile.userName)
		} catch (error) {
			fastify.log.warn('Error getting last seven days matches:', error.message)
		}

		const totalDurationSeconds = profile.Stat.gameTotalDuration || 0
		const fastestWinDuration = profile.Stat.fastestWinDuration || 0
		const longestMatchDuration = profile.Stat.longestMatchDuration || 0

		return ({
			...stats.toJSON(),
			...levelCalculate(profile.Stat.xp),
			gameTotalDuration: totalDurationSeconds,
			gameAverageDuration: stats.gamesPlayed > 0 ? (totalDurationSeconds / stats.gamesPlayed) : 0,
			winRate: stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0,
			speed: (stats.gamesPlayed > 0 && totalDurationSeconds > 0) ? (stats.ballHitCount / (totalDurationSeconds)) * 100 : 0,
			attack: stats.gamesPlayed > 0 ? (stats.gamesWon / stats.gamesPlayed) * 100 : 0,
			endurance: (stats.gamesPlayed > 0 && totalDurationSeconds > 0) ? (totalDurationSeconds / (totalDurationSeconds + stats.gamesPlayed)) * 100 : 0,
			defence: (stats.ballHitCount > 0 && stats.gamesLost > 0) ? (stats.ballHitCount / (stats.ballHitCount + stats.gamesLost + 1)) * 100 : 0,
			accuracy: (stats.ballHitCount > 0 && stats.ballMissCount > 0) ? (stats.ballHitCount / (stats.ballHitCount + stats.ballMissCount)) * 100 : 0,
			lastSevenDaysMatches: lastSevenDaysData.matchesByDay,
			totalMatchesLastSevenDays: lastSevenDaysData.totalMatchesLastSevenDays,
			hitRate: (stats.ballHitCount > 0 && stats.ballMissCount > 0) ?((stats.ballHitCount / (stats.ballHitCount + stats.ballMissCount)) * 100) : 0,
			fastestWinDuration: fastestWinDuration,
			longestMatchDuration: longestMatchDuration
		})
	}

	fastify.decorate('statCalculate', statCalculate)

}, {
	name: 'checkachievement',
	fastify: '4.x'
})
