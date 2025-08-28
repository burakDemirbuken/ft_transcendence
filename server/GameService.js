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
					try
					{
						this.handleWebSocketMessage(message, this.connectionId.get(connectionId));
					}
					catch (error)
					{
						console.error('❌ Error processing message from client:', error);
						this.networkManager.send(connectionId, {type: 'error', payload: error.message});
					}
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
			throw new Error('Player not found for clientId: ' + clientId);

		try
		{
			const [namespace, action] = message.type.split('/');
			switch (namespace)
			{
				case 'room':
					this._handleRoomMessage(action, message.payload, player);
					break;
				case 'game':
					this._handleGameMessage(action, message.payload, player);
					break;
				default:
					throw new Error(`Unhandled message namespace: ${namespace}`);
			}
		}
		catch (error)
		{
			console.error('❌ Error handling message:', error);
			this._sendErrorToPlayer(player.id, error.message);
		}
	}

	_sendPlayers(players, message)
	{
		players.forEach(p => {
			const connId = this.connectionId.get(p.id);
			if (connId)
				this.networkManager.send(connId, JSON.stringify(message));
		});
	}

	_handleRoomMessage(action, payload, player)
	{
		switch (action)
		{
			case 'create':
				this._handleCreateRoom(payload, player);
				break;
			case 'join':
				this._handleJoinRoom(payload, player);
				break;
			case 'leave':
				this._handleLeaveRoom(payload, player);
				break;
			case 'setReady':
				this._handleSetReady(payload, player);
				break;
			case 'startGame':
				this._handleStartGame(payload, player);
				break;
			default:
				throw new Error(`Unhandled room message type: ${message.type}`);
		}
	}

	_handleGameMessage(action, payload, player)
	{
		switch (action)
		{
			case 'playerAction':
				this._handlePlayerAction(payload, player);
				break;
			default:
				throw new Error(`Unhandled game message type: ${message.type}`);
		}
	}

	_handleCreateRoom(message, player)
	{
		const roomId = this.roomManager.createRoom(player.id, message.payload.name, message.payload.properties);

		this.roomManager.on(`room${roomId}_Update`, ({roomState}) => {
			this._sendPlayers(roomState.players, { type: 'room/update', payload: roomState });
		});

		this.roomManager.on(`room${roomId}_Started`, ({ gameSettings, players }) => {
			this._sendPlayers(players, { type: 'game/started', payload: { gameSettings, players } });
		});

		const connId = this.connectionId.get(player.id);
		if (connId)
			this.networkManager.send(connId, JSON.stringify({ type: 'room/created', payload: { roomId } }));
	}

	_handleJoinRoom(message, player)
	{
		this.roomManager.joinRoom(message.payload.roomId, player);
	}

	_handleLeaveRoom(message, player)
	{
		this.roomManager.leaveRoom(message.payload.roomId, player);
	}

	_handleSetReady(message, player)
	{
		this.roomManager.playerReadyStatus(message.payload.roomId, player.id, message.payload.isReady);
	}

	_handleStartGame(message, player)
	{
		this.roomManager.startGame(message.payload.roomId, player.id);
	}

	_handlePlayerAction(payload, player)
	{
		player.inputsSet(payload.key, payload.action);
	}

	_sendErrorToPlayer(playerId, errorMessage)
	{
		const connId = this.connectionId.get(playerId);
		if (connId)
			this.networkManager.send(connId, JSON.stringify({ type: 'error', payload: { message: errorMessage } }));
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
