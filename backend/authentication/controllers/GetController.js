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
        console.error('Check username error:', error);
        return (reply.status(500).send({ success: false, error: trlt.username && trlt.username.fail || 'Username check failed' }));
    }
}
async function checkEmail(request, reply)
{
    const trlt = getTranslations(request.query.lang || "eng");
    try
    {
        const { email } = request.query;
        if (!email)
            return (reply.status(400).send({ success: false, error: trlt.email.empty }));
        const user = await User.findByEmail(email);
        return (reply.send({ exists: !!user, message: user ? trlt.email.taken : trlt.email.availible }));
    }
    catch (error)
    {
        return (reply.status(500).send({ success: false, error: trlt.email.fail }));
    }
}


async function getProfile(request, reply) {
    const trlt = getTranslations(request.query.lang || "eng");
    try {
        let userId;
        
        // Cookie'den JWT token'ı çek ve decode et
        const cookieToken = request.cookies.accessToken ?? {};
        if (cookieToken) {
            try {
                const decoded = request.server.jwt.verify(cookieToken);
                userId = decoded.userId;
            } catch (error) {
                console.log('JWT token decode error:', error);
            }
        }
        
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
        console.log('Get profile error:', error);
        reply.status(500).send({ success: false, error: trlt.profile.fail });
    }
}

export default
{
    checkUsername,
    checkEmail,
    getProfile
};
