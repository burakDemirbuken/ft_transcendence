import fp from 'fastify-plugin'

export default fp(async (fastify) => {

    async function checkAchievements(user, t) {
        const { Achievements, Stats } = fastify.sequelize.models
    
        const [stats, achievements] = await Promise.all([
            Stats.findOne({
                where: { userId: user.id },
                transaction: t
            }),
            Achievements.findOne({
                where: { userId: user.id },
                transaction: t
            })
        ])

        if (!stats || !achievements) {
            throw new Error('Stats or Achievements not found for user')
        }

        const updates = {}

        if (!achievements.fiveHundredWins && stats.gamesWon >= 500) {
            updates.fiveHundredWins = new Date()
        }
        else if (!achievements.hundredWins && stats.gamesWon >= 100) {
            updates.hundredWins = new Date()
        }
        else if (!achievements.firstWin && stats.gamesWon >= 1) {
            updates.firstWin = new Date()
        }

        if (!achievements.twentyFiveTenStreak && stats.gameLongestStreak >= 25) {
            updates.twentyFiveTenStreak = new Date()
        }
        else if (!achievements.firstTenStreak && stats.gameLongestStreak >= 10) {
            updates.firstTenStreak = new Date()
        }

        if (!achievements.lessThanThreeMin && stats.gameMinDuration > 0 && stats.gameMinDuration < 180000) {
            updates.lessThanThreeMin = new Date()
        }
    }

    async function getAchievementProgress(user) {
        const { Achievements, Stats } = fastify.sequelize.models
    
        const [stats, achievements] = await Promise.all([
            Stats.findOne({
                where: { userId: user.id }
            }),
            Achievements.findOne({
                where: { userId: user.id }
            })
        ])

        if (!stats || !achievements) {
            throw new Error('Stats or Achievements not found for user')
        }

        return ({
            firstWin: {
                unlocked: !!achievements.firstWin,
                unlockedAt: achievements.firstWin || null,
            },
            hundredWins: {
                unlocked: !!achievements.hundredWins,
                unlockedAt: achievements.hundredWins || null
            },
            fiveHundredWins: {
                unlocked: !!achievements.fiveHundredWins,
                unlockedAt: achievements.fiveHundredWins || null
            },
            firstTenStreak: {
                unlocked: !!achievements.firstTenStreak,
                unlockedAt: achievements.firstTenStreak || null
            },
            twentyFiveTenStreak: {
                unlocked: !!achievements.twentyFiveTenStreak,
                unlockedAt: achievements.twentyFiveTenStreak || null
            },
            lessThanThreeMin: {
                unlocked: !!achievements.lessThanThreeMin,
                unlockedAt: achievements.lessThanThreeMin || null
            }
        })
    }

    fastify.decorate('checkAchievements', checkAchievements)
    fastify.decorate('getAchievementProgress', getAchievementProgress)

    async function levelCalculate(xp, baseXP = 100, growthFactor = 1.25) {
        if (xp < 0)
            return { level: 0, currentXP: 0, xpForNextLevel: baseXP }

        const nReal = Math.log(((xp + 1) * (growthFactor - 1)) / baseXP + 1) / Math.log(growthFactor)
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

    async function statCalculate(user) {
        const { Stats } = fastify.sequelize.models

        const stats = await Stats.findOne({
            where: { userId: user.id }
        })

        if (!stats) {
            throw new Error('Stats not found for user')
        }

        return ({
            ...levelCalculate(stats.xp),
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
