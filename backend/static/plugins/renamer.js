import fp from 'fastify-plugin';

export default fp(async (fastify) => {
	async function renamer(originalName) {
		const date = Date.now().toString();
		const randomPart = Math.random().toString(36).substring(2, 15);
		
		// Extract extension first
		const lastDotIndex = originalName.lastIndexOf('.');
		const extension = lastDotIndex > -1 ? originalName.substring(lastDotIndex) : '';
		const nameWithoutExt = lastDotIndex > -1 ? originalName.substring(0, lastDotIndex) : originalName;
		
		// Clean the name part only (keep extension separate)
		const cleanedName = nameWithoutExt.replace(/[^\w\s]/gi, '') || 'file';
		const shuffledName = cleanedName.split('').sort(() => 0.5 - Math.random()).join('');
		
		return `${date}_${randomPart}_${shuffledName}${extension}`;
	}

	fastify.decorate('renameFile', renamer);
})
