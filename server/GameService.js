import WebSocketManager from './network/WebSocketManager.js';
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
		console.log('Starting Game Server...');


		this.webSocketManager.start(
			(query) =>
			{
				const player = new Player(query.id, query.name);
				this.Players.set(query.id, player);
				console.log('New player connected:', player);
				this.gameManager.addPlayerToGame('default-game', player);
			},
			(clientId, message) =>
			{
				this.handleWebSocketMessage(message, clientId);
			},
			(clientId) =>
			{
				console.log('WebSocket client disconnected:', clientId);
				this.gameManager.removeGame('default-game');
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
	}

	handleWebSocketMessage(message, clientId)
	{

		const player = this.Players.get(clientId);
		if (!player)
		{
			console.warn('Player not found for clientId:', clientId);
			return;
		}
		switch (message.type)
		{
			case "move":
				player.move(message.payload);
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
