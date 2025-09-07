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
		paddleWidth: 10,
		paddleHeight: 100,
		paddleSpeed: 700,

		ballRadius: 7,
		ballSpeed: 600,
		ballSpeedIncrease: 100,

		maxPlayers: 2,

		maxScore: 11
	},
	createdAt: 1633036800000 // Timestamp
};

const exampleCreateRoomPayload =
{
	name: "Custom",
	gameMode: "classic", // "classic", "multiplayer", "tournament", "ai", "local"
	gameSettings:
	{
		paddleWidth: 10,
		paddleHeight: 100,
		paddleSpeed: 700,
		ballRadius: 7,
		ballSpeed: 600,
		ballSpeedIncrease: 100,
		maxScore: 11
	}
};
*/

import { DEFAULT_GAME_PROPERTIES } from "./utils/constants.js";
import EventEmitter from "./utils/EventEmitter.js";

class RoomManager extends EventEmitter
{
	constructor()
	{
		super();
		this.rooms = new Map();
	}

	handleRoomMessage(action, payload, player)
	{
		switch (action)
		{
			case 'create':
				this.createRoom(player.id, payload);
				break;
			case 'join':
				this.joinRoom(payload.roomId, player);
				break;
			case 'leave':
				this.leaveRoom(payload.roomId, player.id);
				break;
			case 'setReady':
				this.playerReadyStatus(player.id, payload.isReady);
				break;
			case 'startGame':
				this.startGame(player.id);
				break;
			default:
				throw new Error(`Unhandled room message type: ${message.type}`);
		}
	}

	createRoom(hostId, payload)
	{
		//this._validateRoomCreation(hostId, properties);

		const roomId = this._generateRoomId();
		let maxPlayers = 2;
		if (payload.gameMode === 'classic')
			maxPlayers = 2;
		else if (payload.gameMode === 'multiplayer')
			maxPlayers = 4;
		else if (payload.gameMode === 'ai' || payload.gameMode === 'local')
			maxPlayers = 1;
		else
			throw new Error(`Invalid game mode: ${payload.gameMode}`);
		const room = {
			id: roomId,
			name: payload.name,
			gameMode: payload.gameMode,
			status: 'waiting', // "waiting", "in_game", "completed", "startable"
			maxPlayers: maxPlayers,
			host: hostId,
			players: [],
			//? izleyiciler eklenebilir mi?
			spectators: [],
			gameSettings: payload.gameSettings,
			createdAt: Date.now()
		};
		this.rooms.set(roomId, room);
		this.emit(`room_Created`, { roomState: room });
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

	joinRoom(roomId, player)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);
		if (room.players.length >= room.maxPlayers)
			throw new Error(`Room with ID ${roomId} is full`);
		if (room.players.find(p => p.id === player.id))
			throw new Error(`Player with ID ${player.id} is already in room ${roomId}`);

		room.players.push({ id: player.id, name: player.name, status: 'waiting', isHost: player.id === room.host });
		this.notifyRoomUpdate(roomId);
	}

	leaveRoom(playerId)
	{
		const room = this._getRoomWithPlayer(playerId);
		if (!room)
		{
			console.warn(`Player with ID ${playerId} is not in any room`);
			return;
		}
		const playerIndex = room.players.findIndex(p => p.id === playerId);
		if (playerIndex === -1)
			throw new Error(`Player with ID ${playerId} is not in room ${room.id}`);

		room.players.splice(playerIndex, 1);
		if (room.players.length === 0)
			this.deleteRoom(room.id);
		else if (room.host === playerId)
			room.host = room.players[0].id; // Assign new host
		room.status = 'waiting';

		// Oda güncellenmesini bildir
		if (room.players.length > 0) {
			this.notifyRoomUpdate(room.id);
		}
		else {
			this.emit(`room${room.id}_Deleted`);
		}

		return room;
	}

	updateRoomSettings(roomId, settings)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);
		room.gameSettings = { ...room.gameSettings, ...settings };
		this.notifyRoomUpdate(roomId);
		return room;
	}

	playerReadyStatus(playerId, isReady)
	{
		for (const [roomId, room] of this.rooms.entries())
		{
			const player = room.players.find(p => p.id === playerId);
			if (player)
			{
				player.status = isReady ? 'ready' : 'waiting';
				const allPlayersReady = room.players.every(p => p.status === 'ready');
				if (allPlayersReady)
					room.status = 'startable';
				else
					room.status = 'waiting';
				this.notifyRoomUpdate(roomId);
				return;
			}
		}
		throw new Error(`Player with ID ${playerId} is not in any room`);
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
		for (const room of this.rooms.values())
		{
			if (room.players.find(p => p.id === playerId))
				return room;
		}
		return null;
	}

	startGame(playerId)
	{
		const room = this._getRoomWithPlayer(playerId);
		if (!room)
			throw new Error(`Room with player ID ${playerId} does not exist`);

		if (room.host !== playerId)
			throw new Error('Only the host can start the game');

		if (room.players.length !== room.maxPlayers)
			throw new Error('Room is not full');

		const allPlayersReady = room.players.every(player => player.status === 'ready');
		if (!allPlayersReady)
			throw new Error('All players must be ready before starting the game');

		room.status = 'in_game';

		this.emit(`room${room.id}_Started`, {
			gameSettings: room.gameSettings,
			players: room.players,
			gameMode: room.gameMode
		});

		this.notifyRoomUpdate(room.id);

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
		this.emit(`room${room.id}_Update`, {
			roomState: this.getRoomState(roomId)
		});

		return room;
	}
}

export default RoomManager;
