import { Op } from "sequelize"

export default async function onlineOfflineRoutes(fastify) {
    const presence = new Map()

    fastify.get("/ws-friend/presence", { websocket: true }, (socket, req) => {
        const { userName } = req.query
        console.log('New presence connection:', userName)

        if (!userName) {
            socket.close(1008, "Missing parameter: userName")
            return
        }

        const state = { lastseen: Date.now() }
        presence.set(userName, state)
        const [ Friend ] = fastify.sequelize.models

        const friendships = Friend.findAll({
            where: { 
                status: 'accepted',
                [Op.or]: [
                    { userName: userName },
                    { peerName: userName }
                ]
            },
            attributes: ['userName', 'peerName']
        })

        const friends = friendships.map(friend => friend.userName === userName ? friend.peerName : friend.userName)
        const onlineFriends = friends.filter(name => presence.has(name))

        const heartbeat = setInterval(() => {
            if (Date.now() - state.lastseen > 60000) {
                socket.close(1000, "No pong received")
            } else {
                if (socket.readyState === 1) {
                    socket.send(JSON.stringify({
                        type: 'ping',
                        onlineFriends: onlineFriends
                    }))
                }
            }
            fastify.log.info({ userName, situation: 'heartbeat' })
        }, 30000)

        socket.on('message', message => {
            try {
                const { type } = JSON.parse(message.toString())
                if (type === 'pong') {
                    state.lastseen = Date.now()
                }
            } catch (err) {
                fastify.log.error(err)
            }
        })

        const cleanup = async (situation) => {
            clearInterval(heartbeat)
            presence.delete(userName)
            fastify.log.info({ userName, situation })
        }

        socket.on('close', () => cleanup('closed'))
        socket.on('error', (err) => cleanup(err))
    })
    fastify.decorate('presence', presence)
}
