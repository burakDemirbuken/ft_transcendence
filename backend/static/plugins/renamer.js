import fp from 'fastify-plugin';

export default fp(async (fastify) => {
	async function renamer(originalName) {
		const date = Date.now().toString();
		const randomPart = Math.random().toString(36).substring(2, 15);
		const cleanedName = originalName.replace(/[^\w\s]/gi, '') || 'file';
		const shuffledName = cleanedName.split('').sort(() => 0.5 - Math.random()).join('');
		return `${date}_${randomPart}_${shuffledName}`;
	}

	fastify.decorate('renameFile', renamer);
})