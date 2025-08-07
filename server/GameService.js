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
					try
					{
						console.log('🟢 New client connecting:', query);
						const player = new Player(query.id, query.name);
						this.Players.set(query.id, player);
						console.log("query: ", query);
						this.gameManager.addPlayerToGame('default-game', player);
					}
					catch (error)
					{
						console.error('❌ Error in client connect:', error);
					}
				},
				(clientId, message) =>
				{
					try
					{
						this.handleWebSocketMessage(message, clientId);
					}
					catch (error)
					{
						console.error('❌ Error handling message:', error);
					}
				},
				(clientId) =>
				{
					try
					{
						console.log('WebSocket client disconnected:', clientId);
						this.gameManager.removeGame('default-game');
						this.Players.delete(clientId);
					}
					catch (error)
					{
						console.error('❌ Error in client disconnect:', error);
					}
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

	handleWebSocketMessage(message, clientId)
	{

		const player = this.Players.get(clientId);
		if (!player)
		{
			console.warn('Player not found for clientId:', clientId);
			return;
		}
		console.log(`Handling message of type: ${message.type}`);
		switch (message.type)
		{
			case "move":
				player.move(message.payload);
				break;
			case "pause":
				this.gameManager.pause(this.gameManager.getPlayerGameId(player));
				break;
			case "resetBurak":
				this.gameManager.resetGame(this.gameManager.getPlayerGameId(player));
				break;
			default:
				break;
		}
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
