import WebSocketServer from './network/WebSocketServer.js';
import GameManager from './GameManager.js';
import Player from './Player.js';
import RoomManager from './Room/RoomManager.js';
import TournamentManager from './Tournament/TournamentManager.js';
/*
exampleWebSocketMessage=
{
	matchId: '12345',
	id: 'user1',
	name: 'Player 1',

*/
// ws://localhost:3000
class GameService
{
	constructor()
	{
		this.gameManager = new GameManager();
		this.websocketServer = new WebSocketServer();
		this.roomManager = new RoomManager();
		this.tournamentManager = new TournamentManager();
		this.connectionId = new Map(); //  playerId -> connectionId
		this.players = new Map(); // playerId -> Player instance

		setInterval(
			() =>
			{
				console.log('--- Connected Players ---');
				console.log('');
				console.log(`Total connected players: ${this.players.size}`);
				this.players.forEach((player) => {
					console.log(`Player:\nname: ${player.name}\nid: ${player.id}\nconnectionId: ${this.connectionId.get(player.id)}`);
					console.log('');
				});
				console.log('-------------------------');
				console.log('--- Active Rooms ---');
				this.roomManager.rooms.forEach((room) => {
					console.log(`Room ${room}:\n\tGame Mode: ${room.gameMode}\n\tHost: ${room.host}\n\tPlayers: ${room.players.length}/${room.maxPlayers}\n\tStatus: ${room.status}`);
					console.log(`Room Settings: ${JSON.stringify(room.gameSettings, null, 2)}`);
					console.log('\tPlayer List:');
					room.players.forEach((p) => {
						console.log(`\t\t- ${p.name} (id: ${p.id}, status: ${p.status}, isHost: ${p.isHost})`);
					});
					console.log('');
				});
				console.log('-------------------------');
				console.log('');
				console.log('--- Active Games ---');
				this.gameManager.games.forEach((game) => {
					console.log(`Game ${game.id}:\n\tMode: ${game.gameMode}\n\tStatus: ${game.status}\n\tPlayers: ${game.players.length}`);
					console.log('\tPlayer List:');
					game.players.forEach((p) => {
						console.log(`\t\t- ${p.name} (id: ${p.id})`);
					});
					console.log('');
				});
				console.log('-------------------------');
				console.log('');
			},
			5000
		);
		this.gameManager.start();
	}

	_getplayerByConnectionId(connectionId)
	{
		for (let [playerId, connId] of this.connectionId.entries())
		{
			if (connId === connectionId)
				return this.players.get(playerId);
		}
		return null;
	}

	async start()
	{
		try
		{
			console.log('Starting Game Server...');

			this.websocketServer.onClientConnect(
				(connectionId, query) =>
				{
					if (!query.id || !query.name)
					{
						console.error('❌ Missing required parameters in query:', query);
						this.websocketServer.send(connectionId, {type: 'error', payload: 'Missing required parameters: id and name'});
						this.websocketServer.disconnectConnection(connectionId);
						return;
					}
					console.log('🟢 New client id:', query.id, 'name:', query.name, 'connectionId:', connectionId);
					const player = new Player(query.id, query.name);
					this.players.set(query.id, player);
					this.connectionId.set(query.id, connectionId);
				}
			);

			this.websocketServer.onMessage(
				(connectionId, message) =>
				{
					try
					{
						const player = this._getplayerByConnectionId(connectionId);
						if (!player)
						{
							console.error('❌ Player not found for connectionId:', connectionId);
							this.websocketServer.send(connectionId, {type: 'error', payload: 'Player not found'});
							this.websocketServer.disconnectConnection(connectionId);
							return;
						}
						this.handleWebSocketMessage(message, player.id);
					}
					catch (error)
					{
						console.error('❌ Error processing message from client:', error);
						this.websocketServer.send(connectionId, {type: 'error', payload: error.message});
					}
				}
			);

			this.websocketServer.onClose(
				(connectionId) =>
				{
					//? bağlantısı koptuğunda yapılacaklar burada
					const player = this._getplayerByConnectionId(connectionId);
					if (!player)
					{
						console.error('❌ Player not found for disconnected connectionId:', connectionId);
						return;
					}
					console.log('🔌 Client disconnected:', connectionId, 'Player ID:', player.id);
					this.roomManager.leaveRoom(player.id);
					this.gameManager.removePlayerFromGame(player.id);
					this.players.delete(player.id);
					this.connectionId.delete(player.id);

				}
			);

			this.websocketServer.onError(
				(connectionId, error) =>
				{
					console.error('❌ WebSocket error from client:', connectionId, error);
				}
			);

			await this.websocketServer.start({ host: '0.0.0.0', port: 3002 });

			console.log('✅ Game Server started successfully!');
		}
		catch (error)
		{
			console.error('❌ Error starting Game Server:', error);
			throw error;
		}
		this.setupRoomEvents();

	}

	handleWebSocketMessage(message, clientId)
	{
		//! jwt doğrulama burada yapılabilir
		const player = this.players.get(clientId);

		if (typeof(player) === "undefined")
			throw new Error('Player not found for clientId: ' + clientId);
		const [namespace, action] = message.type.split('/');
		switch (namespace)
		{
			case 'room':
				this.roomManager.handleRoomMessage(action, message.payload, player);
				break;
			case 'game':
				this.gameManager.handleGameMessage(action, message.payload, player);
				break;
			default:
				throw new Error(`Unhandled message namespace: ${namespace}`);
		}
	}

	_sendPlayers(players, message)
	{
		players.forEach(p => {
			const connId = this.connectionId.get(p.id);
			if (connId)
				this.websocketServer.send(connId, message);
		});
	}

	setupRoomEvents()
	{
		this.roomManager.on('room_Created',
			({roomState, roomId}) =>
			{
				this.roomManager.on(`room${roomId}_Update`, ({roomState}) => {
					this._sendPlayers(roomState.players, { type: 'tour/update', payload: roomState });
				});

				this.roomManager.on(`room${roomId}_Started`,
					({gameMode, gameSettings, players}) =>
					{
						console.log(`🚀 Starting match in room ${roomId} with mode ${gameMode} and settings:`, gameSettings);
						try
						{
							this._sendPlayers(players, { type: 'game/started' , payload: { gameMode: gameMode, ...gameSettings }});
							if (gameMode === 'tournament')
								this.tournamentMatchCreate(gameSettings, players);
							else
								this.matchCreate(gameMode, gameSettings, players);
						}
						catch (error)
						{
							console.error('❌ Error starting match:', error);
						}
					}
				);
				this.roomManager.on(`room${roomId}_Closed`,
					() =>
					{
						//? oda kapandığında yapılacak işlemler
					}
				);
				const connId = this.connectionId.get(roomState.host);
				if (connId)
					this.websocketServer.send(connId, { type: 'room/created', payload: { roomId: roomState.id } });
			}
		);
	}

	matchCreate(gameMode, gameSettings, players)
	{
		const gameId = this.gameManager.createGame(gameMode, gameSettings);
		players.forEach((p) => this.gameManager.addPlayerToGame(gameId, this.players.get(p.id)));
		this.gameManager.on(`game${gameId}_StateUpdate`,
			({gameState, players}) => this._sendPlayers(this.getPlayers(players), { type: 'game/stateUpdate', payload: gameState })
		);
		this.gameManager.on(`game${gameId}_Ended`,
			({results, players}) =>
			{
				this._sendPlayers(this.getPlayers(players), { type: 'game/ended', payload: results });
				//? XMLHTTPREQUEST
				/* fetch('http://user:3006/internal/match', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						gameId: gameId,
						...results
					})
				}); */
			}
		);
		this.gameManager.gameStart(gameId);
	}

	tournamentMatchCreate(gameSettings, players)
	{
		const tournamentId = this.tournamentManager.createTournament(gameSettings);
		players.forEach((p) => this.tournamentManager.joinTournament(tournamentId, this.players.get(p.id)));
		this.tournamentManager.on(`tournament_${tournamentId}`,
			({type, data, players}) =>
			{
				switch (type)
				{

				}
			}
		);
		this.tournamentManager.startTournament(tournamentId, players[0].id); //? şimdilik ilk oyuncu başlatıyor
	}

	getPlayer(playerId)
	{
		return this.players.get(playerId);
	}

	getPlayers(playerIds)
	{
		let players = [];
		playerIds.forEach(id => {
			const player = this.getPlayer(id);
			if (player)
				players.push(player);
		});
		return players;

	}

	_sendErrorToPlayer(playerId, errorMessage)
	{
		const connId = this.connectionId.get(playerId);
		if (connId)
			this.websocketServer.send(connId, { type: 'error', payload: { message: errorMessage } });
	}

	stop()
	{
		console.log('Stopping Game Server...');

		this.gameManager.stop();
		this.websocketServer.stop();

		console.log('Game Server stopped!');
	}
}


export default GameService;
