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
		this.rooms = new Map();
/* 		setInterval(() => {
			console.log(`Current rooms: ${this.rooms.size}`);
			this.rooms.forEach((room, roomId) => {
				console.log(`Room ID: ${roomId}, Name: ${room.name}, Players: ${room.players.length}/${room.maxPlayers}, Status: ${room.status}`);
				console.log('Players:', room.players.map(p => ({ id: p.id, name: p.name, isReady: p.isReady })));
			});
		}, 1000); // Log every 1 second */
	}

	handleClientRoomMessage(action, payload, player)
	{
		switch (action)
		{
			case 'create':
				const state = this.createRoom(player, payload);
				player.clientSocket.send(JSON.stringify({ type: 'created', payload: { ...state } }));
				break;
			case 'join':
				this.joinRoom(payload.roomId, player);
				player.clientSocket.send(JSON.stringify({ type: 'joined', payload: { roomId: payload.roomId, ...this.getRoom(payload.roomId).getState() } }));
				break;
			case 'leave':
				this.leaveRoom(payload.roomId, player);
				break;
			case 'setReady':
				player.isReady = payload.isReady;
				break;
			case 'matchTournament':
				const room = this._getRoomWithPlayer(player.id).room;
				if (!room)
					throw new Error(`Room with ID ${payload.roomId} does not exist`);
				if (room.gameMode !== 'tournament')
					throw new Error(`Room with ID ${payload.roomId} is not a tournament room`);
				const matchInfo = room.matchMake();
				room.players.forEach(p => {
					p.clientSocket.send(JSON.stringify({ type: 'matchReady', payload: matchInfo }));
				});
				break;
			case 'start':
				this.startGame(player.id);
				break;
			default:
				throw new Error(`Unhandled room message type: 11 ${action}`);
		}
	}

	handleServerRoomMessage(action, payload)
	{
		let room;
		console.log(`Handling server room message: ${action}`, JSON.stringify(payload, null, 2));
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
				const state = room.finishRoom(payload);
				room.players.forEach(player => {
					player.clientSocket.send(JSON.stringify({ type: 'finished', payload: state }));
				});
				break;
			default:
				console.error(`Unhandled server room message type: ${action}`);
		}
	}

	createRoom(player, payload)
	{
		//this._validateRoomCreation(hostId, properties);

		for (const room of this.rooms.values())
		{
			if (room.players.find(p => p.id === player.id))
				throw new Error(`Player with ID ${player.id} is already in a room`);
		}

		const roomId = this._generateRoomId(player.id);
		console.log(`Creating room with ID: ${roomId} for player ID: ${player.id}`);
		let room;
		if (payload.gameMode === 'classic')
			room = new ClassicRoom(payload.name, payload.gameSettings);
		else if (payload.gameMode === 'multiplayer')
			room = new MultiPlayerRoom(payload.name, payload.gameSettings);
		else if (payload.gameMode === 'tournament')
			room = new TournamentRoom(payload.name, payload.gameSettings, payload.tournamentSettings);
		else if (payload.gameMode === 'ai')
			room = new AIRoom(payload.name, payload.gameSettings, payload.aiSettings);
		else if (payload.gameMode === 'local')
			room = new LocalRoom(payload.name, payload.gameSettings);
		else
			throw new Error(`Invalid game mode: ${payload.gameMode}`);
		room.addPlayer(player);

		room.on('finished', (data) =>
			{
				// ulas: data base buradan kayıt edilecek
			}
		);
		this.rooms.set(roomId, room);
		return {roomId: roomId, ...room.getState()};
	}

	getRoom(roomId)
	{
		return this.rooms.get(roomId);
	}

	deleteRoom(roomId)
	{
		if (this.rooms.has(roomId))
		{
			this.rooms.delete(roomId);
			return true;
		}
		return false;
	}

	joinRoom(roomId, player)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);
		if (room.players.length >= room.maxPlayers)
			throw new Error(`Room with ID ${roomId} is full`);
		if (room.players.find(p => p.id === player.id))
			throw new Error(`Player with ID ${player.id} is already in room ${roomId}`);

		room.addPlayer(player);
		console.log(`Player with ID ${player.id} joined room ${roomId}`);
		this.notifyRoomUpdate(roomId);
	}

	leaveRoom(player)
	{
		const {room, roomId} = this._getRoomWithPlayer(player.id);
		if (!room)
		{
			console.log(`Player with ID ${player.id} is not in any room`);
			return null;
		}
		room.removePlayer(player.id);
		if (room.players.length === 0)
			this.deleteRoom(roomId);
		else if (room.host === player.id)
			room.host = room.players[0].id; // Assign new host

		if (room.players.length > 0) {
			//this.notifyRoomUpdate(room.id);
		}
		else {
			this.emit(`room${roomId}_Deleted`);
		}
		
		return room;
	}

	updateRoomSettings(roomId, settings)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);
		room.gameSettings = { ...room.gameSettings, ...settings };
		//this.notifyRoomUpdate(roomId);
		return room;
	}


	updateRoomStatus(roomId, status)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);
		if (!['waiting', 'in_game', 'completed'].includes(status))
			throw new Error(`Invalid room status: ${status}`);

		room.status = status;
		this.notifyRoomUpdate(roomId);
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
		if (!room.allPlayersReady())
			throw new Error('All players must be ready before starting the game');

		const state = {...room.startGame(playerId), roomId: roomId};
		this.emit(`create`, state);
		this.notifyRoomUpdate(roomId);
	}

	_generateRoomId()
	{
		let roomId;
		do {
			//! TEST
			//roomId = "Naber";
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
			name: room.name,
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
			throw new Error(`Room with ID ${roomId} does not exist`);
		room.players.forEach(player => {
			player.clientSocket.send(JSON.stringify({ type: 'update', payload: { roomId: roomId, ...room.getState() } }));
		});

		return room;
	}
}

export default RoomManager;
