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

const exampleCreateRoomPayload =
{
	name: "Custom",
	properties:
	{
		type: "custom",
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
		}
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

	createRoom(hostId, name, properties = {type: 'classic', gameSettings: { ...DEFAULT_GAME_PROPERTIES }})
	{
		this._validateRoomCreation(hostId, properties);

		const roomId = this._generateRoomId();
		const room = {
			id: roomId,
			name: name || `Room-${roomId}`,
			type: properties.type,
			status: 'waiting', // "waiting", "in_game", "completed", "startable"
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
		this.notifyRoomUpdate(roomId);
		return room;
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

		// Oda güncellenmesini bildir
		if (room.players.length > 0) {
			this.notifyRoomUpdate(roomId);
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

	playerReadyStatus(roomId, playerId, isReady)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);
		const player = room.players.find(p => p.id === playerId);
		if (!player)
			throw new Error(`Player with ID ${playerId} is not in room ${roomId}`);
		player.status = isReady ? 'ready' : 'waiting';
		const allPlayersReady = room.players.every(p => p.status === 'ready');
		if (allPlayersReady) {
			room.status = 'startable';
		}
		this.notifyRoomUpdate(roomId);
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

	startGame(roomId, hostId)
	{
		const room = this.getRoom(roomId);
		if (!room)
			throw new Error(`Room with ID ${roomId} does not exist`);

		if (room.host !== hostId)
			throw new Error('Only the host can start the game');

		if (room.status !== 'startable')
			throw new Error('Game can only be started when room status is startable');

		if (room.players.length < 2)
			throw new Error('At least 2 players are required to start the game');

		const allPlayersReady = room.players.every(player => player.status === 'ready');
		if (!allPlayersReady)
			throw new Error('All players must be ready before starting the game');

		room.status = 'in_game';

		this.emit(`room${room.id}_Started`, {
			gameSettings: room.gameSettings,
			players: room.players
		});

		this.notifyRoomUpdate(roomId);

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

	_validateRoomCreation(hostId, properties)
	{
		const basicValidations = [
			{ condition: !hostId, message: 'Host ID is required to create a room' },
			{ condition: !properties || !properties.gameSettings, message: 'Game settings are required to create a room' },
			{ condition: !['classic', 'custom', 'tournament'].includes(properties.type), message: 'Invalid room type. Must be "classic", "custom", or "tournament"' }
		];

		const gameSettingsValidations = [
			{ field: 'paddleWidth', message: 'Invalid paddle width in game settings' },
			{ field: 'paddleHeight', message: 'Invalid paddle height in game settings' },
			{ field: 'paddleSpeed', message: 'Invalid paddle speed in game settings' },
			{ field: 'ballRadius', message: 'Invalid ball radius in game settings' },
			{ field: 'ballSpeed', message: 'Invalid ball speed in game settings' },
			{ field: 'ballSpeedIncrease', message: 'Invalid ball speed increase in game settings' },
			{ field: 'maxScore', message: 'Invalid max score in game settings' }
		];

		for (const validation of basicValidations) {
			if (validation.condition) {
				throw new Error(validation.message);
			}
		}

		const settings = properties.gameSettings;
		for (const validation of gameSettingsValidations) {
			if (!settings[validation.field] || settings[validation.field] <= 0) {
				throw new Error(validation.message);
			}
		}
	}

}

export default RoomManager;
