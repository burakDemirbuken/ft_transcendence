import User from '../models/User.js';
import { getTranslations } from '../I18n/I18n.js';

async function checkUsername(request, reply)
{
    const trlt = getTranslations(request.query.lang || "eng");
    try
    {
        const { username } = request.query;
        if (!username)
            return (reply.status(400).send({ success: false, error: trlt.username && trlt.username.empty || 'Username is required' }));
        
        if (username.length < 1 || username.length > 20) {
            return reply.status(400).send({
                success: false,
                error: trlt.username && trlt.username.length || 'Username must be between 1 and 20 characters'
            });
        }

        if (!/^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+$/u.test(username)) {
            return reply.status(400).send({
                success: false,
                error: trlt.username && trlt.username.invalid || 'Username can only contain letters, numbers, underscore and Turkish characters'
            });
        }

        const user = await User.findByUsername(username);

        return (reply.send({
            exists: !!user,
            username: username,
            available: !user,
            message: user ? (trlt.username && trlt.username.taken || 'Username already taken') : (trlt.username && trlt.username.available || 'Username available')
        }));
    }
    catch (error)
    {
        return (reply.status(500).send({ success: false, error: trlt.username && trlt.username.fail || 'Username check failed' }));
    }
}

async function getProfile(request, reply) {
    const trlt = getTranslations(request.query.lang || "eng");
    try {
        const userData = await request.server.getDataFromToken(request);
        const userId = userData?.userId;

        if (!userId)
        {
            return (reply.status(401).send({
                success: false,
                error: 'User authentication required',
                code: 'NO_USER_INFO'
            }));
        }
        const user = await User.findByPk(userId);
        if (!user)
        {
            return (reply.status(404).send({ success: false, error: trlt.unotFound }));
        }
        reply.send({ success: true, user: user.toSafeObject() });
    }
    catch (error)
    {
        reply.status(500).send({ success: false, error: trlt.profile.fail });
    }
}

async function healthCheck(request, reply) {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
}

export default
{
    checkUsername,
    getProfile,
    healthCheck
};
