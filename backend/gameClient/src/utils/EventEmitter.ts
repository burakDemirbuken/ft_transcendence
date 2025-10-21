type EventCallback = (data?: any) => void;

class EventEmitter
{
	private eventCallbacks: Map<string, EventCallback>;

	constructor()
	{
		this.eventCallbacks = new Map();
	}

	on(event: string, callback: EventCallback): void
	{
		this.eventCallbacks.set(event, callback);
	}

	off(event: string, callback: EventCallback): void
	{
		if (this.eventCallbacks.has(event))
		{
			const existingCallback = this.eventCallbacks.get(event);
			if (existingCallback === callback)
				this.eventCallbacks.delete(event);
		}
	}

	emit(event: string, data?: any): void
	{
		if (this.eventCallbacks.has(event))
		{
			const callback = this.eventCallbacks.get(event);
			if (callback)
				callback(data);
		}
	}
}

export default EventEmitter;
