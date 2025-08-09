import WebSocketManager from './network/WebSocketManager.js';
import GameManager from './GameManager.js';
import Player from './Player.js';
import Fastify from 'fastify';

/*
exampleWebSocketMessage=
{
	matchId: '12345',
	id: 'user1',
	name: 'Player 1',

*/

class GameService
{
	constructor()
	{
		this.fastify = Fastify({ logger: false });
		this.gameManager = new GameManager();
		this.webSocketManager = new WebSocketManager(this.fastify);
		this.Players = new Map(); // playerId -> Player instance
	}

	async start()
	{
		try
		{
			console.log('Starting Game Server...');

			this.webSocketManager.start(
				(query) =>
				{
					console.log('🟢 New client connecting:', query);
					if (!query.id || !query.name || !query.matchId || !query.gameMode)
					{
						console.error('❌ Missing required parameters in query:', query);
						return;
					}

					try
					{
						//? gameId serverda oluşup gitse daha sağlıklı olmaz mı?
						if (!this.gameManager.hasGame(query.matchId))
							this.gameManager.createGame(query.gameMode, query.matchId);

						const player = new Player(query.id, query.name);
						this.Players.set(query.id, player);

						this.gameManager.addPlayerToGame(query.gameMode, query.matchId, player);
					}
					catch (error)
					{
						console.error('❌ Error during client connection setup:', error);
					}
				},
				(clientId, message) =>
				{
					this.handleWebSocketMessage(message, clientId);
				},
				(clientId) =>
				{
					console.log('WebSocket client disconnected:', clientId);
					this.gameManager.removeGame(this.gameManager.getPlayerGameId(clientId));
					this.Players.delete(clientId);
				}
			);

			this.gameManager.start(
				(gameData, players) =>
				{
					players.forEach((player) =>
					{
						this.webSocketManager.sendToClient(player.id, {type: 'stateChange', payload: gameData});
					});
				}
			);

			console.log('✅ Game Server started successfully!');
		}
		catch (error)
		{
			console.error('❌ Error starting Game Server:', error);
			throw error;
		}
	}

	createLocalIdAndName()
	{
		return {
			id: `local-${Math.random().toString(36).substring(2, 15)}`,
			name: `LocalPlayer-${Math.random().toString(36).substring(2, 15)}`
		};
	}

	handleWebSocketMessage(message, clientId)
	{
		const player = this.Players.get(clientId);
		if (!player)
		{
			console.warn('Player not found for clientId:', clientId);
			return;
		}
		player.inputsSet(message.type, message.payload.action);
	}

	async stop()
	{
		console.log('Stopping Game Server...');

		this.gameManager.stop();
		this.webSocketManager.stop();

		console.log('Game Server stopped!');
	}
}

export default GameService;
