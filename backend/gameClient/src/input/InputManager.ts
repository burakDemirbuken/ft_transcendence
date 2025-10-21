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

	initEventListeners(): void
	{
		document.addEventListener('keydown',
			(e: KeyboardEvent) =>
			{
				if (this.pressedKeys.has(e.key))
				{
					if (this.isRegisteredKey(e.key))
						e.preventDefault();
					return;
				}

				this.pressedKeys.add(e.key);

				if (this.isRegisteredKey(e.key))
					e.preventDefault();

				const callback = this.keyDownCallbacks.get(e.key);
				if (callback)
					callback(e);
			}
		);

		document.addEventListener('keyup',
			(e: KeyboardEvent) =>
			{
				this.pressedKeys.delete(e.key);
				const callback = this.keyUpCallbacks.get(e.key);
				if (callback)
					callback(e);
			}
		);

		window.addEventListener('blur',
			() =>
			{
				this.pressedKeys.clear();
			}
		);
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

	isKeyPressed(key: string): boolean
	{
		return this.pressedKeys.has(key);
	}

	isAnyKeyPressed(keys: string[]): boolean
	{
		return keys.some(key => this.pressedKeys.has(key));
	}

	areAllKeysPressed(keys: string[]): boolean
	{
		return keys.every(key => this.pressedKeys.has(key));
	}

	removeKeyDown(key: string): void
	{
		this.keyDownCallbacks.delete(key);
	}

	removeKeyUp(key: string): void
	{
		this.keyUpCallbacks.delete(key);
	}

	clearCallbacks(): void
	{
		this.keyDownCallbacks.clear();
		this.keyUpCallbacks.clear();
	}

	getActiveKeys(): string[]
	{
		return Array.from(this.pressedKeys);
	}

	getRegisteredKeys(): RegisteredKeys
	{
		return {
			down: Array.from(this.keyDownCallbacks.keys()),
			up: Array.from(this.keyUpCallbacks.keys())
		};
	}

	destroy(): void
	{
		this.pressedKeys.clear();
		this.keyDownCallbacks.clear();
		this.keyUpCallbacks.clear();
	}
}

export default InputManager;
