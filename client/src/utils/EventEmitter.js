class EventEmitter
{
	constructor()
	{
		this.eventCallbacks = new Map();
	}

	on(event, callback)
	{
		if (!this.eventCallbacks.has(event))
			this.eventCallbacks.set(event, []);
		this.eventCallbacks.get(event).push(callback);
	}

	emit(event, data)
	{
		if (this.eventCallbacks.has(event))
			this.eventCallbacks.get(event).forEach(callback => callback(data));
	}
}

export default EventEmitter;
