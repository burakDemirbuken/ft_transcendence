import User from '../models/User.js';
import { getTranslations } from '../I18n/I18n.js';
import utils from './utils.js';

async function confirmDeleteAccount(request, reply)
{
    const trlt = getTranslations(request.query.lang || "eng");
    try
    {
        const { code } = request.body;

        if (!code) {
            return reply.status(400).send({
                success: false,
                error: 'Verification code is required'
            });
        }

        const userData = await request.server.getDataFromToken(request);

        if (!userData?.userId) {
            return reply.status(401).send({
                success: false,
                error: 'Authentication required'
            });
        }

        const user = await User.findByPk(userData.userId);

        if (!user) {
            return reply.status(404).send({
                success: false,
                error: 'User not found'
            });
        }

        const storedData = utils.tempStorage.get(user.email);
        
        if (!storedData || storedData.type !== 'delete_account') {
            return reply.status(400).send({
                success: false,
                error: 'No pending account deletion request'
            });
        }

        if (storedData.code !== code) {
            return reply.status(400).send({
                success: false,
                error: 'Invalid verification code'
            });
        }

        if (storedData.expires < new Date()) {
            utils.tempStorage.delete(user.email);
            return reply.status(400).send({
                success: false,
                error: 'Verification code has expired'
            });
        }

        // Temp storage'ı temizle
        utils.tempStorage.delete(user.email);

		const deletedUserInfo = { username: user.username, email: user.email };
		
		// Hesabı sil
		await User.destroy({ where: { id: user.id } });
		const serviceNotifications = [
			await fetch('http://friend:3007/internal/list', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json', 'X-Auth-Service': 'true' },
				body: JSON.stringify({ userName: deletedUserInfo.username })
			}).catch(() => {}),
			await fetch('http://profile:3006/internal/profile', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json', 'X-Auth-Service': 'true' },
				body: JSON.stringify({ userName: deletedUserInfo.username })
			}).catch(() => {})
		];
		Promise.all(serviceNotifications);
		if (utils.tempStorage.has(deletedUserInfo.email))
			utils.tempStorage.delete(deletedUserInfo.email);
		const accessToken = request.cookies?.accessToken;
		const refreshToken = request.cookies?.refreshToken;
		if (accessToken) utils.blacklistToken(accessToken);
		if (refreshToken) utils.blacklistToken(refreshToken);
		reply.clearCookie('accessToken',
		{
			httpOnly: true, secure: true, sameSite: 'strict', path: '/'
		});
		reply.clearCookie('refreshToken',
		{
			httpOnly: true, secure: true, sameSite: 'strict', path: '/'
		});
		reply.clearCookie('authStatus', {
			httpOnly: true, secure: true, sameSite: 'strict', path: '/'
		});
		reply.send(
		{
			success: true,
			message: trlt.delete?.success || 'Account successfully deleted',
			deleted_user: deletedUserInfo
		});
	}
	catch (error)
	{
		reply.status(500).send(
		{
			success: false,
			error: trlt.delete?.fail || 'Failed to delete account'
		});
	}
}

export default { confirmDeleteAccount };
