import {Sequelize, DataTypes, Model} from 'sequelize'
import fp from 'fastify-plugin'
import Friend from '../models/Friend.js'

export default fp(async (fastify, opts) => {
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database/friend.sqlite',
        logging: false
    })

    const FriendModel = Friend(sequelize, DataTypes, Model) //?

//    await sequelize.sync({ alter: true })

    fastify.decorate('sequelize', sequelize)

    fastify.addHook('onClose', async (fastifyInstance, done) => {
        await fastifyInstance.sequelize.close()
        done()
    })
}, {
    name: 'friend-db',
    fastify: '4.x'
})
