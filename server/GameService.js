import GameEngine from './GameEngine.js';

class GameService
{
	constructor()
	{
		this.gameEngine = new GameEngine();
		this.webSocketManager = new WebSocketManager(this.gameEngine);
		this.apiServer = new APIServer(this.gameEngine);
	}

	async start()
	{
		console.log('Starting Game Server...');

		this.gameEngine.start();

		this.webSocketManager.start();

		await this.apiServer.start();

		console.log('Game Server fully started!');
		console.log(`HTTP API: http://localhost:${CONFIG.PORT}`);
		console.log(`WebSocket: ws://localhost:${CONFIG.WS_PORT}`);
	}

	async stop()
	{
		console.log('Stopping Game Server...');

		this.gameEngine.stop();
		this.webSocketManager.stop();
		await this.apiServer.stop();

		console.log('Game Server stopped!');
	}
}
