import NetworkManager from './network/NetworkManager.js';
import GameManager from './GameManager.js';
import Player from './Player.js';
import RoomManager from './RoomManager.js';
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
		this.gameManager = new GameManager();
		this.networkManager = new NetworkManager();
		this.roomManager = new RoomManager();
		this.connectionId = new Map(); //  playerId -> connectionId
		this.Players = new Map(); // playerId -> Player instance
	}

	async start()
	{
		try
		{
			console.log('Starting Game Server...');

			this.networkManager.onClientConnect(
				(connectionId, query) =>
				{
					console.log('🟢 New client connecting:', query);
					if (!query.id || !query.name)
					{
						console.error('❌ Missing required parameters in query:', query);
						this.networkManager.send(connectionId, {type: 'error', payload: 'Missing required parameters: id and name'});
						this.networkManager.disconnectConnection(connectionId);
						return;
					}
					const player = new Player(query.id, query.name);
					this.Players.set(query.id, player);
					this.connectionId.set(query.id, connectionId);
				}
			);

			this.networkManager.onMessage(
				(connectionId, message) =>
				{
					this.handleWebSocketMessage(message, this.connectionId.get(connectionId));
				}
			);

			this.networkManager.onClose(
				(connectionId) =>
				{
					//? bağlantısı koptuğunda yapılacaklar burada
					this.connectionId.delete(connectionId);
				}
			);

			this.networkManager.onError(
				(connectionId, error) =>
				{
					console.error('❌ WebSocket error from client:', connectionId, error);
				}
			);

			await this.networkManager.start({ host: '0.0.0.0', port: 3000 });

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
		//! jwt doğrulama burada yapılabilir
		const player = this.Players.get(clientId);
		if (!player)
		{
			console.warn('Player not found for clientId:', clientId);
			return;
		}
		switch (message.type)
		{
			case 'createRoom':
				const roomId = this.roomManager.createRoom(player.id, message.payload.name, message.payload.properties);
				this.roomManager.on(`room${roomId}_Update`, ({roomState}) => {
					roomState.players.forEach(p => {
						const connId = this.connectionId.get(p.id);
						if (connId)
							this.networkManager.send(connId, { type: 'roomUpdate', payload: roomState });
					});
				});
				this.roomManager.on(`room${roomId}_Delete`, () => {
					this.roomManager.close
				});
				this.roomManager.on(`room${roomId}_Started`, ({ gameSettings, players }) => {
					players.forEach(p => {
						const connId = this.connectionId.get(p.id);
						if (connId)
							this.networkManager.send(connId, { type: 'gameStarted', payload: { gameSettings, players } });
					});
					// burada oyun init edilip başlatılacak
				});
				this.roomManager.on(`room${roomId}_Error`, ({ error }) => {});
				break;
			case 'joinRoom':
				this.gameManager.addPlayerToGame(message.payload.roomCode, player);
				break;
			case 'playerAction':
				player.inputsSet(message.payload.key, message.payload.action);
				break;
			default:
				break;
		}
	}

	async stop()
	{
		console.log('Stopping Game Server...');

		this.gameManager.stop();
		this.networkManager.stop();

		console.log('Game Server stopped!');
	}
}

export default GameService;
