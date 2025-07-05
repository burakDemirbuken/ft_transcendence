class EventEmitter
{
    constructor()
	{
        this.events = {};
    }

    on(eventName, callback)
	{
        if (!this.events[eventName])
            this.events[eventName] = [];
        this.events[eventName].push(callback);
        return this;
    }

    once(eventName, callback)
	{
        const onceCallback =
		(...args) =>
		{
            callback(...args);
            this.off(eventName, onceCallback);
        };
        this.on(eventName, onceCallback);
        return this;
    }

    emit(eventName, ...args)
	{
        if (this.events[eventName])
		{
            this.events[eventName].forEach(
				callback =>
				{
					try
					{
						callback(...args);
					}
					catch (error)
					{
						console.error(`EventEmitter error in ${eventName}:`, error);
					}
				});
        }
        return this;
    }

    off(eventName, callbackToRemove)
	{
        if (this.events[eventName])
		{
            this.events[eventName] = this.events[eventName]
                .filter(callback => callback !== callbackToRemove);

            if (this.events[eventName].length === 0)
                delete this.events[eventName];
        }
        return this;
    }

    removeAllListeners(eventName = null)
	{
        if (eventName)
            delete this.events[eventName];
        else
            this.events = {};
        return this;
    }

    listenerCount(eventName)
	{
        return this.events[eventName] ? this.events[eventName].length : 0;
    }

    eventNames()
	{
        return Object.keys(this.events);
    }
}

export default EventEmitter;
