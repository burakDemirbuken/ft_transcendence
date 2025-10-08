import WebSocketServer from './network/WebSocketServer.js';
import WebSocketClient from './network/WebSocketClient.js';
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
		this.roomSocket = new WebSocketClient('ws://room-service:3001');
		this.roomManager = new RoomManager();
		this.tournamentManager = new TournamentManager();
		this.connectionId = new Map(); //  playerId ->
		this.players = new Map(); // playerId -> Player instance

		this.gameManager.start();
		this.tournamentManager.start();
		this.setupRoomEvents();
/* 		setInterval(
			() =>
			{
				console.log('--- Connected Players ---');
				console.log('');
				console.log(`Total connected players: ${this.players.size}`);
				this.players.forEach((player) => {
					console.log(`Player:\nname: ${player.name}\nid: ${player.id}\nconnectionId: ${this.connectionId.get(player.id)}\n`);
					console.log('');
				});
				console.log('-------------------------');
				console.log('');
				console.log('--- Active Games ---');
				this.gameManager.games.forEach((game) => {
					console.log(`Game ${game.id}:\n\tMode: ${game.gameMode}\n\tStatus: ${game.status}\n\tPlayers: ${game.players.length}`);
					console.log('\tPlayer List:');
					game.players.forEach((p) => {
						console.log(`\t\t- ${p.name} (id: ${p.id}) initialized: ${p.initialized}`);
					});
					console.log('');
				});
				console.log('-------------------------');
				console.log('');
				console.log('--- Active Tournaments ---');
				this.tournamentManager.tournaments.forEach((tournament, id) => {
					console.log(`Tournament ${id}:\n\tStatus: ${tournament.status}\n\tPlayers: ${tournament.players.length}/${tournament.maxPlayers}`);
					console.log('\tPlayer List:');
					tournament.players.forEach((p) => {
						console.log(`\t\t- ${p.name} (id: ${p.id}) initialized: ${p.initialized}`);
					});
					console.log('');
				});
				console.log('-------------------------');
				console.log('');
			},
			5000
		); */
	}

	setupRoomEvents()
	{
		this.roomSocket.onConnect(() => {
			console.log('🟢 Connected to Room Service');
		});
		this.roomSocket.onError((error) => {
			console.error('❌ Room Service connection error:', error);
		});
		this.roomSocket.onClose(() => {
			console.warn('⚠️ Room Service connection closed, attempting to reconnect in 5 seconds...');
		});
		this.roomSocket.onMessage((message) => {
			console.log('📨 Message from Room Service:', message);
		});

		this.roomSocket.connect('ws/server');
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
					this.tournamentManager.leaveTournament(player.id);
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
		console.log(`Gelen namespace: ${namespace}`);
		console.log(`Gelen action: ${action}`);
		console.log(`Gelen payload: ${JSON.stringify(message.payload, null, 2)}`);
		console.log('-------------------------');
		switch (namespace)
		{
			case 'room':
				this.roomManager.handleRoomMessage(action, message.payload, player);
				break;
			case 'player':
				this.handlePlayerMessage(action, message.payload, player);
				break;
			default:
				throw new Error(`Unhandled message namespace: ${namespace}`);
		}
	}

	handlePlayerMessage(action, payload, player)
	{
		switch (action)
		{
			case 'playerAction':
				player.inputSet(payload.key, payload.action);
				break;
			case 'initialized':
				player.initialized = true;
				break;
			default:
				throw new Error(`Unhandled player message type: ${action}`);
		}
	}

	sendPlayers(players, message)
	{
		players.forEach(p => {
			const connId = this.connectionId.get(p.id);
			if (connId)
			{
				this.websocketServer.send(connId, message);
			}
		});
	}

	setupRoomEvents()
	{
		this.roomManager.on('room_Created',
			({roomState, roomId}) =>
			{
				this.roomManager.on(`room${roomId}_Update`, ({roomState}) => {
					this.sendPlayers(roomState.players, { type: 'tour/update', payload: roomState });
				});

				this.roomManager.on(`room${roomId}_Started`,
					(payload) =>
					{
						const {gameMode, gameSettings, players} = payload;
						const playersInstances = players.map(p => this.players.get(p.id)).filter(p => p);
						try
						{
							if (gameMode === 'tournament')
								this.tournamentMatchCreate(roomId, gameSettings, payload.tournamentSettings, playersInstances);
							else
								this.matchCreate(roomId, gameMode, gameSettings, playersInstances);
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

				this.roomManager.on(`room${roomId}_NextRound`, () => this.tournamentManager.nextRound(roomId));
				const connId = this.connectionId.get(roomState.host);
				if (connId)
					this.websocketServer.send(connId, { type: 'room/created', payload: { roomState: roomState, roomId: roomId } });
			}
		);
	}

	matchCreate(roomId, gameMode, gameSettings, players)
	{
		const gameId = this.gameManager.createGame(roomId, gameMode, gameSettings);
		players.forEach((p) => this.gameManager.addPlayerToGame(gameId, this.players.get(p.id)));

		this.gameManager.on(`game${gameId}`, ({type, payload, players}) =>
			{
				switch (type)
				{
					case 'update':
						this.sendPlayers(players, { type: 'game/update', payload: payload });
						break;
					case 'finished':
						this.sendPlayers(players, { type: 'game/finished', payload: payload });
						//? XMLHTTPREQUEST
						/* fetch('http://user:3006/internal/match', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								gameId: gameId,
								...results
							})
						}); */
						break;
					default:
						console.error('❌ Unhandled game event type:', type);
				}
			}
		);

		this.sendPlayers(players, { type: 'game/initial' , payload: { gameMode: gameMode, ...gameSettings }});
	}

	tournamentMatchCreate(roomId, gameSettings, tournamentSettings, players)
	{
		const tournamentId = this.tournamentManager.createTournament(roomId, gameSettings, tournamentSettings);
		players.forEach((p) => this.tournamentManager.joinTournament(tournamentId, this.players.get(p.id)));
		this.tournamentManager.on(`tournament_${tournamentId}`,
			({type, payload, players}) =>
			{
				switch (type)
				{
					case 'update':
						this.sendPlayers(players, { type: 'tournament/update', payload: payload });
						break;
					case 'roundFinish':
						this.sendPlayers(players, { type: 'tournament/roundFinish', payload: payload });
						break;
					case 'nextRound':
						this.sendPlayers(players, { type: 'tournament/initial', payload: payload });
						break;
					case 'finished':
						console.log('Tournament finished, sending results to players');
						console.log('players: ',JSON.stringify(players, null, 2));
						console.log('payload: ',JSON.stringify(payload, null, 2));
						this.sendPlayers(players, { type: 'tournament/finished', payload: payload });
						break;
					default:
						console.error('❌ Unhandled tournament event type:', type);
				}
			}
		);
		const initData = this.tournamentManager.initTournament(tournamentId);
		this.sendPlayers(players, { type: 'tournament/initial' , payload: { gameMode: 'tournament', ... initData }});
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
