import Sequelize from 'sequelize';
import fp from 'fastify-plugin';

module.exports = fp(async (fastify, opts) => {
    const seq = new Sequelize({
        dialect: 'sqlite',
        storage: 'users.sqlite',
        logging: true, //?
    })

    const models = require('./../models')(seq)
    // table joinlerini hallet
    await seq.sync()

    fastify.decorate('db', {seq, models})
})
