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
		this.isReady = false;
		this.clientSocket = socket;
	}

	getState()
	{
		return {
			id: this.id,
			name: this.name,
			isReady: this.isReady,
			lastActivity: this.lastActivity
		};
	}
}

export default Player;
