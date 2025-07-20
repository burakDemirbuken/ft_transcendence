class InputManager
{
	constructor(gameCore)
	{
		this.gameCore = gameCore;
		this.keyStates = {};
		this.initEventListeners();
	}

	initEventListeners()
	{
		document.addEventListener('keydown', (event) => this.keyStates[event.key] = true);
		document.addEventListener('keyup', (event) => this.keyStates[event.key] = false);
		document.addEventListener('blur', () => this.keyStates = {});
	}

	isKeyPressed(key)
	{
		return this.keyStates[key] || false;
	}

	getActiveKeys()
	{
		return Object.keys(this.keyStates).filter(key => this.keyStates[key]);
	}
}
