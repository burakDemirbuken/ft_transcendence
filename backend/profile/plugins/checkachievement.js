import fp from 'fastify-plugin'

export default fp(async (fastify, opts) => {

    async function checkAchievements(user) {
        
    }

    async function getAchievementProgress(user) {

    }

    /* fastify.decorate('checkAchievements', checkAchievements)
    fastify.decorate('getAchievementProgress', getAchievementProgress) */

}, {
    name: 'checkachievement',
    dependencies: ['sequelize']
})
