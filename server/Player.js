/**
 * Player class - Pure business logic, no WebSocket dependency
 * WebSocket connections are managed separately by WebSocketManager
 */
class Player
{
	constructor(id, name = 'Anonymous')
	{
		this.id = id;
		this.name = name;
		this.isReady = false;
		this.lastActivity = Date.now();
		this.status = 'online'; // 'online', 'offline', 'playing'
		this.inputs = new Map();
	}

	move(payload)
	{
		if (!payload || !payload.direction || typeof payload.action !== 'boolean')
		{
			console.warn('Invalid move payload:', payload);
			return;
		}
		this.inputs.set(payload.direction, payload.action);
	}

	getState()
	{
		return {
			id: this.id,
			name: this.name,
			score: this.score,
			isReady: this.isReady,
			status: this.status,
			lastActivity: this.lastActivity
		};
	}

	// Create from serialized data
	static fromState(state)
	{
		const player = new Player(state.id, state.name);
		player.score = state.score || 0;
		player.isReady = state.isReady || false;
		player.status = state.status || 'online';
		player.lastActivity = state.lastActivity || Date.now();
		return player;
	}
}

export default Player;
