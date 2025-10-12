/**
 * Player class - Pure business logic, no WebSocket dependency
 * WebSocket connections are managed separately by WebSocketManager
 *
 *
 */
class Player
{
	constructor(id, socket = null, name = 'Anonymous')
	{
		this.id = id;
		this.name = name;
		// testing için her zaman true
		this.isReady = true;
		this.clientSocket = socket;
	}

	getState(hostId)
	{
		return {
			id: this.id,
			name: this.name,
			isHost: this.id === hostId
		};
	}
}

export default Player;
