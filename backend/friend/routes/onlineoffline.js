const presence = new Map()

export default async function onlineOfflineRoutes(fastify) {
    fastify.get("/ws-friend/presence", { websocket: true }, (connection, req) => {
        const socket = connection.socket
        const userName = req.query.userName

        if (!userName) {
            socket.close(1008, "Missing parameter: userName")
            return
        }

        const state = {/*  isAlive: true, */ lastseen: Date.now() }
        presence.set(userName, state)

        const hearbeat = setInterval(() => {
            if (Date.now() - state.lastseen > 60000) {
                socket.close(1000, "No pong received")
            } else {
                socket.send(JSON.stringify({type: 'ping'}))
            }
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
            clearInterval(hearbeat)
            presence.delete(userName)
            fastify.log.info({ userName, situation })
        }

        socket.on('close', () => cleanup('closed'))
        socket.on('error', (err) => cleanup(err))
    })
}
