import test from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import friendListRoutes from './friendlist.js'

async function buildFastify(overrides = {}) {
    const app = Fastify()
    app.decorate('presence', overrides.presence ?? new Map())
    app.decorate('getFriendList', overrides.getFriendList ?? (async () => ({})))
    app.decorate('notifyFriendChanges', overrides.notifyFriendChanges ?? (async () => {}))
    app.decorate('sequelize', {
        models: {
            Friend: {
                findAll: overrides.findAll ?? (async () => []),
                destroy: overrides.destroy ?? (async () => 0)
            }
        }
    })
    await app.register(friendListRoutes)
    await app.ready()
    return app
}

test('DELETE /internal/list returns 400 when userName missing', async () => {
    const app = await buildFastify()
    const res = await app.inject({ method: 'DELETE', url: '/internal/list', payload: {} })
    assert.equal(res.statusCode, 400)
    await app.close()
})

test('DELETE /internal/list returns 404 when no friendships found', async () => {
    const app = await buildFastify({ findAll: async () => [] })
    const res = await app.inject({
        method: 'DELETE',
        url: '/internal/list',
        payload: { userName: 'alice' }
    })
    assert.equal(res.statusCode, 404)
    await app.close()
})

test('DELETE /internal/list removes friendships and notifies peers', async () => {
    let destroyed = false
    const mockSocket = { readyState: 1, send: () => {} }
    const presence = new Map([['bob', { socket: mockSocket }]])
    const app = await buildFastify({
        presence,
        findAll: async () => [
            { userName: 'alice', peerName: 'bob' },
            { userName: 'charlie', peerName: 'alice' }
        ],
        destroy: async () => {
            destroyed = true
            return 2
        }
    })
    const res = await app.inject({
        method: 'DELETE',
        url: '/internal/list',
        payload: { userName: 'alice' }
    })
    assert.equal(res.statusCode, 200)
    assert.ok(destroyed)
    await app.close()
})

test('POST /internal/notify validates payload and triggers notifier', async () => {
    let notifiedUser = null
    const app = await buildFastify({
        notifyFriendChanges: async (name) => {
            notifiedUser = name
        }
    })
    const bad = await app.inject({ method: 'POST', url: '/internal/notify', payload: {} })
    assert.equal(bad.statusCode, 400)

    const ok = await app.inject({
        method: 'POST',
        url: '/internal/notify',
        payload: { userName: 'alice' }
    })
    assert.equal(ok.statusCode, 200)
    assert.equal(notifiedUser, 'alice')
    await app.close()
})