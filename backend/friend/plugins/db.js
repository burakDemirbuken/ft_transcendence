import {Sequelize, DataTypes, Model} from 'sequelize'
import fp from 'fastify-plugin'
import Friend from '../models/friend.js'

export default fp(async (fastify, opts) => {
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './friend.sqlite'
    })

    const FriendModel = Friend(sequelize, DataTypes, Model)

    await sequelize.sync({ alter: true })

}, {
    name: 'friend-db',
    fastify: '4.x'
})
