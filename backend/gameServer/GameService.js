import WebSocketServer from './network/WebSocketServer.js';
import WebSocketClient from './network/WebSocketClient.js';
import GameManager from './GameManager.js';
import Player from './Player.js';
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
		this.roomSocket = new WebSocketClient("room", 3004);
		this.tournamentManager = new TournamentManager();
		this.connectionId = new Map(); //  playerId -> connectionId
		this.players = new Map(); // playerId -> Player instance

		this.gameManager.start();
		this.tournamentManager.start();
		this.setupRoomNetwork();

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

	setupRoomNetwork()
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
			this.roomMessageHandler(message);
			console.log('📨 Message from Room Service:', message);
		});

		this.roomSocket.connect('ws-room/server');
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
			this.websocketServer.onClientConnect(
				(connectionId, query) =>
				{
					if (!query.userID || !query.userName || !query.gameMode || !query.gameId)
					{
						console.error('❌ Missing required parameters in query:', query);
						this.websocketServer.send(connectionId, {type: 'error', payload: 'Missing required parameters: userID and userName'});
						this.websocketServer.disconnectConnection(connectionId);
						return;
					}
					console.log('🟢 New client id:', query.userID, 'name:', query.userName, 'connectionId:', connectionId);
					const player = new Player(query.userID, query.userName);
					this.players.set(query.userID, player);
					this.connectionId.set(query.userID, connectionId);
					this.addPlayerToGame(query.gameMode, query.gameId, player);
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
	}

	addPlayerToGame(gameMode, gameId, player)
	{
		if (gameMode !== 'tournament')
			this.gameManager.addPlayerToGame(gameId, player);
		else
			this.tournamentManager.addPlayerToTournament(gameId, player);
	}

	handleWebSocketMessage(message, clientId)
	{
		const player = this.players.get(clientId);

		if (typeof(player) === "undefined")
			throw new Error('Player not found for clientId: ' + clientId);
		const [namespace, action] = message.type.split('/');
		const payload = message.payload;
		switch (namespace)
		{
			case 'player':
				this.handlePlayerMessage(action, payload, player);
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

	async roomMessageHandler(message)
	{
		const { type, payload } = message;
		const { roomId, gameMode, gameSettings, players } = payload;
		console.log('--- Incoming Room Message ---');
		console.log('Payload:', payload);

		switch (type) {
			case 'create':
				if (gameMode !== 'tournament')
					await this.matchCreate(roomId, gameMode, gameSettings, players);
				else
					this.tournamentMatchCreate(roomId, payload);
				break;
			default:
				console.error(`❌ Unhandled room message type: ${type}`);
				break;
		}
	}

	async matchCreate(roomId, gameMode, gameSettings, players)
	{
		const gameId = await this.gameManager.createGame(roomId, gameMode, gameSettings, players);

		this.gameManager.on(`game${gameId}`, ({type, payload, players}) =>
			{
				switch (type)
				{
					case 'update':
						this.sendPlayers(players, { type: 'game/update', payload: payload });
						break;
					case 'finished':
						this.roomSocket.send('finished', { roomId: roomId, ...payload });

						// winnerı kaçıncı takımsa ait olduğunu ve idlerini gönder
						// winner: 1
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
		this.roomSocket.send('created', { roomId: roomId });
	}

	async tournamentMatchCreate(roomId, payload)
	{
		const {maxPlayers, matches} = payload;
		const tournamentId = await this.tournamentManager.createTournament(roomId, maxPlayers, matches);
		this.tournamentManager.on(`tournament_${tournamentId}`,
			({type, payload, players}) =>
			{
				switch (type)
				{
					case 'update':
						this.sendPlayers(players, { type: 'tournament/update', payload: payload });
						break;
					case 'finished':
						this.roomSocket.send('finished', { roomId: roomId, ...payload.payload });
						break;
					default:
						console.error('❌ Unhandled tournament event type:', type);
				}
			}
		);
		this.roomSocket.send('created', { roomId: roomId });
		//this.sendPlayers(players, { type: 'tournament/initial' , payload: { gameMode: 'tournament', ... initData }});
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

}


export default GameService;

