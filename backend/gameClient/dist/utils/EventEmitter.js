class EventEmitter {
    constructor() {
        this.eventCallbacks = new Map();
    }
    on(event, callback) {
        this.eventCallbacks.set(event, callback);
    }
    off(event, callback) {
        if (this.eventCallbacks.has(event)) {
            const existingCallback = this.eventCallbacks.get(event);
            if (existingCallback === callback)
                this.eventCallbacks.delete(event);
        }
    }
    emit(event, data) {
        if (this.eventCallbacks.has(event)) {
            const callback = this.eventCallbacks.get(event);
            if (callback)
                callback(data);
        }
    }
}
export default EventEmitter;
//# sourceMappingURL=EventEmitter.js.map