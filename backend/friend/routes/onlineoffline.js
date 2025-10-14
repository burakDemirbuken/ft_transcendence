const presence = new Map()

export default async function onlineOfflineRoutes(fastify) {
    fastify.get("/verify", async (request, reply) => {
        return { status: "ok" }
    
    });
    fastify.get("/ws-friend/presence", { websocket: true }, (socket, req) => {

        

        const { userName } = req.query
        console.log('New presence connection:', userName)

        if (!userName) {
            socket.close(1008, "Missing parameter: userName")
            return
        }


        const state = {/*  isAlive: true, */ lastseen: Date.now() }
        presence.set(userName, state)

        const heartbeat = setInterval(() => {
            if (Date.now() - state.lastseen > 60000) {
                socket.close(1000, "No pong received")
            } else {
                if (socket.readyState === 1) { // 1 = OPEN
                    socket.send(JSON.stringify({type: 'ping'}))
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
}
