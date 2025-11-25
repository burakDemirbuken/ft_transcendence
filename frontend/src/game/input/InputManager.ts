type KeyCallback = (event: KeyboardEvent) => void;

interface RegisteredKeys {
	down: string[];
	up: string[];
}

class InputManager
{
	private pressedKeys: Set<string>;
	private keyDownCallbacks: Map<string, KeyCallback>;
	private keyUpCallbacks: Map<string, KeyCallback>;

	constructor()
	{
		this.pressedKeys = new Set();
		this.keyDownCallbacks = new Map();
		this.keyUpCallbacks = new Map();

		this.initEventListeners();
	}

	keyDownEvent(e: KeyboardEvent)
	{
		let key = e.key
		if (key.length === 1)
			key = key.toLowerCase();
		if (this.pressedKeys.has(key))
		{
			if (this.isRegisteredKey(key))
				e.preventDefault();
			return;
		}

		this.pressedKeys.add(key);

		if (this.isRegisteredKey(key))
			e.preventDefault();

		const callback = this.keyDownCallbacks.get(key);
		if (callback)
			callback(e);
	}

	keyUpEvent(e: KeyboardEvent)
	{
		let key = e.key;
		if (key.length === 1)
			key = key.toLowerCase();
		this.pressedKeys.delete(key);
		const callback = this.keyUpCallbacks.get(key);
		if (callback)
			callback(e);
	}

	blurEvent()
	{
		this.pressedKeys.clear();
	}

	initEventListeners(): void
	{
		document.addEventListener('keydown', this.keyDownEvent.bind(this));

		document.addEventListener('keyup', this.keyUpEvent.bind(this));

		window.addEventListener('blur', this.blurEvent.bind(this));
	}

	isRegisteredKey(key: string): boolean
	{
		return this.keyDownCallbacks.has(key) || this.keyUpCallbacks.has(key);
	}

	onKeyDown(key: string, callback: KeyCallback): void
	{
		this.keyDownCallbacks.set(key, callback);
	}

	onKeyUp(key: string, callback: KeyCallback): void
	{
		this.keyUpCallbacks.set(key, callback);
	}

	onKey(key: string, onDown?: KeyCallback, onUp?: KeyCallback): void
	{
		if (onDown) this.onKeyDown(key, onDown);
		if (onUp) this.onKeyUp(key, onUp);
	}

	destroy(): void
	{
		this.pressedKeys.clear();
		document.removeEventListener("keydown", this.keyDownEvent);
		document.removeEventListener("keyup", this.keyUpEvent);
		document.removeEventListener("blur", this.blurEvent);
		this.keyDownCallbacks.clear();
		this.keyUpCallbacks.clear();
	}
}

export default InputManager;
