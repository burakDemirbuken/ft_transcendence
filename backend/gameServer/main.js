import GameService from "./GameService.js";

const gameService = new GameService();

async function startServer() {
	try {
		console.log('🚀 Starting server...');
		await gameService.start();
		console.log('✅ Server started successfully!');
	} catch (error) {
		console.error('❌ Server start failed:', error);
		process.exit(1);
	}
}

startServer();
