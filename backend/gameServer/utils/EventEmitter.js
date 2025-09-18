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

	off(event, callback)
	{
		if (this.eventCallbacks.has(event))
		{
			const callbacks = this.eventCallbacks.get(event);
			this.eventCallbacks.set(event, callbacks.filter(cb => cb !== callback));
		}
	}

	emit(event, data)
	{
		if (this.eventCallbacks.has(event))
			this.eventCallbacks.get(event).forEach(callback => callback(data));
	}
}

export default EventEmitter;
