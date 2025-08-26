/*
const exampleResponseCustomRoom =
{
	id: "ROOM-12345",
	name: "Custom Room",
	type: "custom",
	status: "waiting", // "waiting", "in_game", "completed"
	maxPlayers: 2,
	host: "player1",
	players:
	[
		{ id: "player1", name: "Host", status: "ready", isHost: true },
		{ id: "player2", name: "Player 2", status: "waiting", isHost: false }
	],
	gameSettings:
	{
		gameMode: "custom",
		maxScore: 5,
		ballSpeed: 1.0,
		paddleSpeed: 1.0,
		difficulty: "normal" // "easy", "normal", "hard"
	},
	createdAt: 1633036800000 // Timestamp
};
*/

import { DEFAULT_GAME_PROPERTIES } from "./utils/constants";

class RoomManager extends EventEmitter
{
	constructor()
	{
		super();
		this.rooms = new Map();
	}

	createRoom(hostId, name, properties = {type: 'classic', gameSettings: { ...DEFAULT_GAME_PROPERTIES }})
	{
		const roomId = this._generateRoomId();
		const room = {
			id: roomId,
			name: name || `Room-${roomId}`,
			type: properties.type,
			status: 'waiting',
			maxPlayers: properties.gameSettings.maxPlayers || 2,
			host: hostId,
			players: [],
			//? izleyiciler eklenebilir mi?
			spectators: [],
			gameSettings: properties.gameSettings || {},
			createdAt: Date.now()
		};
		this.rooms.set(roomId, room);
		return roomId;
	}

	getRoom(roomId)
	{
		return this.rooms.get(roomId) || null;
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

	addPlayerToRoom(roomId, player)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);
		if (room.players.length >= room.maxPlayers)
			throw new Error(`Room with ID ${roomId} is full`);
		if (room.players.find(p => p.id === player.id))
			throw new Error(`Player with ID ${player.id} is already in room ${roomId}`);

		room.players.push({ id: player.id, name: player.name, status: 'waiting', isHost: player.id === room.host });
	}

	removePlayerFromRoom(roomId, playerId)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);
		const playerIndex = room.players.findIndex(p => p.id === playerId);
		if (playerIndex === -1)
			throw new Error(`Player with ID ${playerId} is not in room ${roomId}`);

		room.players.splice(playerIndex, 1);
		if (room.players.length === 0)
			this.deleteRoom(roomId);
		else if (room.host === playerId)
			room.host = room.players[0].id; // Assign new host
		room.status = 'waiting';
		return room;
	}

	_generateRoomId()
	{
		let roomId;
		do {
			roomId = `ROOM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
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
			type: room.type,
			status: room.status,
			maxPlayers: room.maxPlayers,
			host: room.host,
			players: room.players,
			spectators: room.spectators,
			gameSettings: room.gameSettings,
			createdAt: room.createdAt
		};
	}

	updateRoomStatus(roomId, status)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);
		if (!['waiting', 'in_game', 'completed'].includes(status))
			throw new Error(`Invalid room status: ${status}`);
		room.status = status;
		this.emit('roomStatusChange', { roomId: room.id, status: room.status });
		return room;
	}
}

export default RoomManager;
