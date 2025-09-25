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
		{ id: "player1", name: "Host", status: "ready", isHost: true},
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
/*

TODO:
odaların emitleri ayarlanacak.

*/

import ClassicRoom from "./ClassicRoom.js";
import MultiPlayerRoom from "./MultiPlayerRoom.js";
import TournamentRoom from "./TournamentRoom.js";
import AIRoom from "./AIRoom.js";
import LocalRoom from "./LocalRoom.js";
import EventEmitter from "../utils/EventEmitter.js";

class RoomManager extends EventEmitter
{
	constructor()
	{
		super();
		this.rooms = new Map();
	}

	handleRoomMessage(action, payload, player)
	{
		console.log(`Handling room action: ${action} from player ${player.id}`);
		console.log('Payload:', payload);
		switch (action)
		{
			case 'create':
				this.createRoom(player, payload);
				console.log(`Room created by player ${player.id}`);
				break;
			case 'join':
				this.joinRoom(payload.roomId, player);
				console.log(`Player ${player.id} joined room ${payload.roomId}`);
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

	createRoom(player, payload)
	{
		//this._validateRoomCreation(hostId, properties);

		const roomId = this._generateRoomId();
		let room;
		if (payload.gameMode === 'classic')
			room = new ClassicRoom(payload.name, payload.gameSettings);
		else if (payload.gameMode === 'multiplayer')
			room = new MultiPlayerRoom(payload.name, payload.gameSettings);
		else if (payload.gameMode === 'tournament')
			room = new TournamentRoom(payload.name, payload.gameSettings);
		else if (payload.gameMode === 'ai')
			room = new AIRoom(payload.name, payload.gameSettings, payload.aiSettings);
		else if (payload.gameMode === 'local')
			room = new LocalRoom(payload.name, payload.gameSettings);
		else
			throw new Error(`Invalid game mode: ${payload.gameMode}`);
		room.addPlayer(player);
		this.rooms.set(roomId, room);
		this.emit(`room_Created`, { roomState: room.getState(), roomId: roomId });
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

		room.players.push({ id: player.id, name: player.name, status: 'waiting', isHost: player.id === room.host });
		//this.notifyRoomUpdate(roomId);
	}

	leaveRoom(playerId)
	{
		const {room, roomId} = this._getRoomWithPlayer(playerId);
		if (!room)
			throw new Error(`Player with ID ${playerId} is not in any room`);

		room.removePlayer(playerId);
		if (room.players.length === 0)
			this.deleteRoom(roomId);
		else if (room.host === playerId)
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
				//this.notifyRoomUpdate(roomId);
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
		//this.notifyRoomUpdate(roomId);
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
		const allPlayersReady = room.players.every(player => player.status === 'ready');
		if (!allPlayersReady)
			throw new Error('All players must be ready before starting the game');

		const state = room.startGame(playerId);

		this.emit(`room${roomId}_Started`, state);
		//room.notifyRoomUpdate(room.id);
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

	notifyRoomUpdate(Id)
	{
		if (!room)
			throw new Error(`Room with ID ${room} does not exist`);
		this.emit(`room${room.id}_Update`, {
			roomState: room.getState()
		});

		return room;
	}
}

export default RoomManager;
