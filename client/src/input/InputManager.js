class InputManager
{
	constructor()
	{
		this.pressedKeys = new Set();
		this.keyDownCallbacks = new Map();
		this.keyUpCallbacks = new Map();

		this.initEventListeners();
	}

	initEventListeners()
	{
		document.addEventListener('keydown',
			(e) =>
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
			(e) =>
			{
				console.log(`Key released: ${e.key}`);
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

	isRegisteredKey(key)
	{
		return this.keyDownCallbacks.has(key) || this.keyUpCallbacks.has(key);
	}

	onKeyDown(key, callback)
	{
		this.keyDownCallbacks.set(key, callback);
	}

	onKeyUp(key, callback)
	{
		this.keyUpCallbacks.set(key, callback);
	}

	onKey(key, onDown, onUp)
	{
		if (onDown) this.onKeyDown(key, onDown);
		if (onUp) this.onKeyUp(key, onUp);
	}

	isKeyPressed(key)
	{
		return this.pressedKeys.has(key);
	}

	isAnyKeyPressed(keys)
	{
		return keys.some(key => this.pressedKeys.has(key));
	}

	areAllKeysPressed(keys)
	{
		return keys.every(key => this.pressedKeys.has(key));
	}

	removeKeyDown(key)
	{
		this.keyDownCallbacks.delete(key);
	}

	removeKeyUp(key)
	{
		this.keyUpCallbacks.delete(key);
	}

	clearCallbacks()
	{
		this.keyDownCallbacks.clear();
		this.keyUpCallbacks.clear();
	}

	getActiveKeys()
	{
		return Array.from(this.pressedKeys);
	}

	getRegisteredKeys()
	{
		return {
			down: Array.from(this.keyDownCallbacks.keys()),
			up: Array.from(this.keyUpCallbacks.keys())
		};
	}
}

export default InputManager;
