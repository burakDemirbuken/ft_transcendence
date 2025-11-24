import ClassicRoom from "./ClassicRoom.js";
import MultiPlayerRoom from "./MultiPlayerRoom.js";
import TournamentRoom from "./TournamentRoom.js";
import AIRoom from "./AIRoom.js";
import LocalRoom from "./LocalRoom.js";
import EventEmitter from "./EventEmitter.js";

class RoomManager extends EventEmitter
{
	constructor()
	{
		super();
		this.waitingPlayers = [];
		this.rooms = new Map();
		setInterval(() => {
 			console.log(`Current rooms: ${this.rooms.size}`);
			this.rooms.forEach((room, roomId) => {
				console.log(`Room ID: ${roomId}, Name: ${room.name}, Players: ${room.players.length}/${room.maxPlayers}, Status: ${room.status}`);
				console.log('Players:', room.players.map(p => ({ id: p.id, name: p.name })));
			});
		}, 5000); // Log every 1 second

	}

	async handleClientRoomMessage(action, payload, player)
	{
		try
		{
			switch (action)
			{
				case 'create':
					const state = this.createRoom(player, payload);
					player.clientSocket.send(JSON.stringify({ type: 'created', payload: { ...state } }));
					break;
				case 'join':
					this.joinRoom(payload, player);
					player.clientSocket.send(JSON.stringify({ type: 'joined', payload: { roomId: payload.roomId, ...this.getRoom(payload.roomId).getState() } }));
					break;
				case 'leave':
					this.leaveRoom(player.id);
					break;
				case 'matchTournament':
					const room = this._getRoomWithPlayer(player.id).room;
					if (!room)
						throw new Error(`Room with ID ${payload.roomId} does not exist`);
					if (room.gameMode !== 'tournament')
						throw new Error(`Room with ID ${payload.roomId} is not a tournament room`);
					room.matchMake();
					this.notifyRoomUpdate(payload.roomId);
					break;
				case 'start':
					this.startGame(player.id);
					break;
				case 'quickMatch':
					this.quickMatch(player);
					break;
				case 'cancelQuickMatch':
					this.removePlayerFromWaitingList(player.id);
					break;
				default:
					throw new Error(`Unhandled room message type: 11 ${action}`);
			}
		}
		catch (error)
		{
			player.clientSocket.send(JSON.stringify({ type: 'error', payload: { message: error.message } }));
			console.error(`Error handling client room message: ${action}`, error);
		}
	}

	quickMatch(player)
	{
		if (this.waitingPlayers.find(p => p.id === player.id))
			throw new Error('Player is already in the quick match waiting list');
		if (this._getRoomWithPlayer(player.id).room !== null)
			throw new Error('Player is already in a room');

		this.waitingPlayers.push(player);
		if (this.waitingPlayers.length >= 2)
		{
			const [player1, player2] = this.waitingPlayers.splice(0, 2);
			const roomState = this.createRoom(player1, { gameMode: 'classic' });
			const room = this.getRoom(roomState.roomId);
			room.addPlayer(player2);
			this.startGame(player1.id);
		}
	}

	removePlayerFromWaitingList(playerId)
	{
		this.waitingPlayers = this.waitingPlayers.filter(p => p.id !== playerId);
	}

	handleServerRoomMessage(action, payload)
	{
		let room;
		switch (action)
		{
			case 'created':
				room = this.getRoom(payload.roomId);
				const initData = room.initData();
				room.players.forEach(player => {
					player.clientSocket.send(JSON.stringify({ type: 'started', payload: { roomId: payload.roomId, ...initData } }));
				});
				break;
			case "matchReady":
				room = this.getRoom(payload.roomId);
				room.players.forEach(player => {
					player.clientSocket.send(JSON.stringify({ type: 'matchReady', payload: payload }));
				});
				break;
			case 'finished':
				room = this.getRoom(payload.roomId);
				if (!room)
				{
					console.warn(`Room with ID ${payload.roomId} does not exist`);
					return;
				}
				const {state, players} = room.finishRoom(payload);
				players.forEach(player => {
					console.log(`Notifying player ${player.id} of finished room ${payload.roomId}`);
					player.clientSocket.send(JSON.stringify({ type: 'finished', payload: state }));
				});
				this.notifyRoomUpdate(payload.roomId);
				break;
			default:
				console.error(`Unhandled server room message type: ${action}`);
		}
	}

	createRoom(player, payload)
	{
		for (const room of this.rooms.values())
		{
			if (room.players.find(p => p.id === player.id))
				throw new Error(`Player with ID ${player.id} is already in a room`);
		}

		const roomId = this._generateRoomId(player.id);
		let room;
		if (payload.gameMode === 'classic')
			room = new ClassicRoom(payload.gameSettings);
		else if (payload.gameMode === 'multiplayer')
			room = new MultiPlayerRoom(payload.gameSettings);
		else if (payload.gameMode === 'tournament')
			room = new TournamentRoom(payload.tournamentSettings);
		else if (payload.gameMode === 'ai')
			room = new AIRoom(payload.gameSettings, payload.aiSettings, roomId);
		else if (payload.gameMode === 'local')
			room = new LocalRoom(payload.gameSettings);
		else
			throw new Error(`Invalid game mode: ${payload.gameMode}`);
		room.addPlayer(player);

		room.on('finished', this.finishedRoom.bind(this));

		this.rooms.set(roomId, room);
		return {roomId: roomId, ...room.getState()};
	}

	async finishedRoom(data)
	{
		if (!(data.matchType === 'local' || data.matchType === 'ai' || data.matchType === 'multiplayer'))
		{
			let url = 'http://profile:3006/internal/';
			try
			{
				if (data.matchType === 'tournament')
					url += 'tournament';
				else
					url += 'match';
				const response = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(data)
				});

				if (!response.ok)
					console.error('❌ Profile service error:', response.status, await response.text());
				else
					console.log('✅ Data sent to profile service:', data);
			}
			catch (error)
			{
				console.error('❌ Error sending data to profile service:', error);
			}
		}
		data.kickedPlayers.forEach(player => this.leaveRoom(player));
		this.deleteRoom(data.roomId);
	}

	getRoom(roomId)
	{
		return this.rooms.get(roomId);
	}

	deleteRoom(roomId)
	{
		if (this.rooms.has(roomId))
		{
			console.log(`Deleting room with ID ${roomId}`);
			this.rooms.delete(roomId);
		}
	}

	joinRoom(payload, player)
	{
		const room = this.getRoom(payload.roomId);
		if (!room)
			throw new Error(`Room with ID ${payload.roomId} does not exist`);
		if (room.players.length >= room.maxPlayers)
			throw new Error(`Room with ID ${payload.roomId} is full`);
		if (room.players.find(p => p.id === player.id))
			throw new Error(`Player with ID ${player.id} is already in room ${payload.roomId}`);
		if (payload.gameMode !== room.gameType)
			throw new Error(`Player with ID ${player.id} cannot join room ${payload.roomId} with game mode ${payload.gameMode}`);
		room.addPlayer(player);
		this.notifyRoomUpdate(payload.roomId);
	}

	leaveRoom(playerId)
	{
		if (this.waitingPlayers.find(p => p.id === playerId))
		{
			this.removePlayerFromWaitingList(playerId);
			return null;
		}
		const {room, roomId} = this._getRoomWithPlayer(playerId);
		if (!room)
		{
			console.error(`Player with ID ${playerId} is not in any room`);
			return null;
		}
		room.removePlayer(playerId);
		if (room.players.length === 0 && (room.spectators?.length || 0) === 0)
			this.deleteRoom(roomId);
		if (room.players.length > 0 || (room.spectators?.length || 0) > 0)
			this.notifyRoomUpdate(roomId);
		console.log(`Player with ID ${playerId} left room ${roomId}`);
		return room;
	}

	_getRoomWithPlayer(playerId)
	{
		for (const [roomId, room] of this.rooms.entries())
		{
			if (room.players.find(p => p.id === playerId))
				return { room, roomId };
		}
		return { room: null, roomId: null };
	}

	startGame(playerId)
	{
		const {room, roomId} = this._getRoomWithPlayer(playerId);
		if (!room)
			throw new Error(`Room with player ID ${playerId} does not exist`);

		const state = {...room.startGame(playerId), roomId: roomId};
		this.emit(`create`, state);
		this.notifyRoomUpdate(roomId);
	}

	_generateRoomId()
	{
		let roomId;
		do {
			roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
		} while (this.rooms.has(roomId));
		return roomId;
	}

	getRoomState(roomId)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);
		return {
			id: room.id,
			gameMode: room.gameMode,
			status: room.status,
			maxPlayers: room.maxPlayers,
			host: room.host,
			players: room.players,
			spectators: room.spectators,
			gameSettings: room.gameSettings,
			createdAt: room.createdAt
		};
	}

	notifyRoomUpdate(roomId)
	{
		const room = this.getRoom(roomId);
		if (!room)
		{
			console.error(`Cannot notify update for non-existent room ID ${roomId}`);
			return;
		}
		room.players.forEach(player => {
			player.clientSocket.send(JSON.stringify({ type: 'update', payload: { roomId: roomId, ...room.getState() } }));
		});

		return room;
	}
}

export default RoomManager;
