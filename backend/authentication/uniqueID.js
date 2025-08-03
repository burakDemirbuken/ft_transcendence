import fp from 'fastify-plugin'
import crypto from 'crypto' 

async function uniqueIDPlugin(fastify) {
	fastify.decorate('generateUniqueID', function() {
		const date = new Date();
		const timestamp = date.getTime().toString(36);
		const randomPart = Math.random().toString(36).substring(2, 10);

		const ip = fastify.request.ip;
		const fingerprint = `${ip}-${randomPart}-${timestamp}`;

		const uniqueID = crypto.createHash('sha256').update(fingerprint).digest('hex');
		return uniqueID;
	});
} // fingerprinte ekstradan tabledaki ID falanda eklenebilir. ID -> eklenme sırası indexi gibi ama databaseden index çekmek gerek sürekli.

export default fp(uniqueIDPlugin, {
	name: 'uniqueIDPlugin',
	fastify: true,
});