/**
 * Player class - Pure business logic, no WebSocket dependency
 * WebSocket connections are managed separately by WebSocketManager
 *
 * 
 */
class Player
{
	constructor(id, name = 'Anonymous')
	{
		this.id = id;
		this.name = name;
		this.isReady = false;
		this.lastActivity = Date.now();
		this.inputs = new Map(); // type -> boolean(true: pressed, false: not pressed)
	}

	inputSet(key, value)
	{
		this.inputs.set(key, value);
		this.lastActivity = Date.now();
	}

	inputGet(key)
	{
		return this.inputs.get(key);
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
