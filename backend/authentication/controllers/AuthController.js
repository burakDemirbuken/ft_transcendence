import User from '../models/User.js';
import { getTranslations } from '../I18n/I18n.js';
import utils from './utils.js';

async function deleteProfile(request, reply)
{
	const trlt = getTranslations(request.query.lang || "eng");
	try
	{
		console.log('Delete profile request received');
		console.log(request.cookies.accessToken.toString());
		console.log('Verifying JWT token for user authentication');
		let tokenUserId;
		let tokenUsername;
		const cookieToken = request.cookies?.accessToken;
		if (cookieToken) {
			try {
				const decoded = request.server.jwt.verify(cookieToken);
				tokenUserId = decoded.userId;
				tokenUsername = decoded.username;
			} catch (error) {
				console.log('JWT token decode error:', error);
			}
		}

		const { userId, userEmail, username } = request.body ?? {};
		let user;
		if (tokenUsername)
			user = await User.findByUsername(tokenUsername);
		else if (tokenUserId)
			user = await User.findByPk(parseInt(tokenUserId));
		else if (userId)
			user = await User.findByPk(userId);
		else if (username)
			user = await User.findByUsername(username);
		else if (userEmail)
			user = await User.findByEmail(userEmail);
		else
		{
			return (reply.status(400).send({
				success: false,
				error: 'Authentication required or user identifier missing',
				code: 'NO_IDENTIFIER'
			}));
		}
		if (!user)
		{
			return (reply.status(404).send({
				success: false,
				error: trlt.unotFound || 'User not found'
			}));
		}
		if (tokenUserId && parseInt(tokenUserId) !== user.id)
		{
			return (reply.status(403).send({
				success: false,
				error: 'You can only delete your own account',
				code: 'PERMISSION_DENIED'
			}));
		}
		console.log("geldi")
		const deletedUserInfo = { username: user.username, email: user.email };
		await User.destroy({ where: { id: user.id } });
		const serviceNotifications = [
			await fetch('http://friend:3007/internal/list', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json', 'X-Auth-Service': 'true' },
				body: JSON.stringify({ userName: deletedUserInfo.username })
			}).catch(err => console.log('Friend service error:', err)),
			fetch('http://profile:3006/internal/profile', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json', 'X-Auth-Service': 'true' },
				body: JSON.stringify({ userName: deletedUserInfo.username })
			}).catch(err => console.log('Profile service error:', err))
		];
		console.log('Notifying other services about account deletion');
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

export default	{	deleteProfile	};
