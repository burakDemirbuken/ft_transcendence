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
		this.inputs = new Map(); // type -> boolean(true: pressed, false: not pressed)
		this.initialized = false;
	}

	inputSet(key, value)
	{
		this.inputs.set(key, value);
	}

	inputGet(key)
	{
		return this.inputs.get(key);
	}

	reset()
	{
		this.inputs.clear();
		this.initialized = false;
	}

	getState()
	{
		return {
			id: this.id,
			name: this.name,
		};
	}
}

export default Player;
