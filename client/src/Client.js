/*
const exampleGameConfig =
{
	type: "config",

	payload:
	{
		gameMode: "local", // "local", "online", "tournament", "ai"

		arcade:
		{
			position:
			{
				x: 0,
				y: 0,
				z: 0
			},
			type: "classic", // "classic", "modern", "pong1971"
			machine:
			{
				path: "../models/arcade/classic/",
				model: "arcade.obj",
				colors:
				{
					body: "#FF0000",
					sides: "#00FF00",
					joystick: "#0000FF",
					buttons: "#FFFF00"
				}
			}
		},
		gameRender:
		{
			colors:
			{
				background: "#000000",
				paddle: "#FFFFFF",
				ball: "#FFFFFF",
				text: "#FFFFFF",
				accent: "#00FF00"
			},
			paddleSize:
			{
				width: 10,
			}
		},
	}
};
*/

import GameCore from './core/GameCore.js';
import NetworkManager from './network/NetworkManager.js';
import GameRenderer from './rendering/GameRenderer.js';
import InputManager from './input/InputManager.js';

class Client
{
	constructor(canvasId)
	{
		this.canvas = document.getElementById(canvasId);
		this.gameCore = new GameCore();
		this.networkManager = new NetworkManager();
		this.renderer = new GameRenderer(this.gameCore);
		this.inputManager = new InputManager();
		this.gameState = null;

		// ? this.gameStateManager = new GameStateManager();
		this.isRunning = false;
	}
//		await this.gameCore.loadScene(gameConfig.gameMode);


	async initialize(gameConfig)
	{
		if (!this.canvas)
			throw new Error('Canvas is missing');

		await this.gameCore.initialize(this.canvas, gameConfig.arcade);
		if (!gameConfig.gameRender)
			throw new Error('Game render configuration is missing');
		this.renderer.initialize(gameConfig.gameRender);
		this.setupGameControls();
	}

	connectToServer(endPoint, params = {})
	{
		this.networkManager.connect(endPoint, params);
		this.setupEventListeners();
	}

	// Placeholder for future implementation
	// createTournamentRoom() can be implemented to handle tournament room creation logic

	createTournamentRoom()
	{
		if (!this.networkManager.isConnected())
			throw new Error('NetworkManager is not connected');
		this.networkManager.send("createRoom", {mode: "tournament"});
	}

	crea

	setupEventListeners()
	{
		this.networkManager.on("stateChange",
			(data) =>
			{
				this.render(data.gameData, this.gameCore.getMachine("main"));
				this.gameState = data.gameData;
			}
		);
		this.networkManager.on("connected",
			() => console.log('✅ Connected to server')
		);
		this.networkManager.on("error",
			(error) => console.error('connection error:', error)
		);
		this.networkManager.on("createRoomResponse",
			(data) =>
			{
				if (data.success)
					console.log(`Tournament room created. Code: ${data.roomCode}`);
				else
					console.error(`Failed to create tournament room: ${data.message}`);
			}
		);
	}

	setupGameControls()
	{
		if (!this.networkManager.isConnected())
			throw new Error('NetworkManager is not connected');

		this.inputManager.onKey("w",
			() =>
			{
				if (this.gameCore) this.gameCore.joystickMove(1, 'up');
				this.networkManager.send("w", {action: true});
			},
			() =>
			{
				if (this.gameCore) this.gameCore.joystickMove(1, 'reset');
				this.networkManager.send("w", {action: false});
			}
		);
		this.inputManager.onKey("s",
			() =>
			{
				if (this.gameCore) this.gameCore.joystickMove(1, 'down');
				this.networkManager.send("s", {action: true});
			},
			() =>
			{
				if (this.gameCore) this.gameCore.joystickMove(1, 'reset');
				this.networkManager.send("s", {action: false});
			}
		);
		// Arrow keys for same player (alternative controls)
		this.inputManager.onKey("ArrowUp",
			() => this.networkManager.send("ArrowUp", {action: true}),
			() => this.networkManager.send("ArrowUp", {action: false})
		);

		this.inputManager.onKey("ArrowDown",
			() => this.networkManager.send("ArrowDown", {action: true}),
			() => this.networkManager.send("ArrowDown", {action: false})
		);

		this.inputManager.onKey("r",
			() => this.networkManager.send("r", {action: true}),
			() => this.networkManager.send("r", {action: false})
		);
		this.inputManager.onKey("Escape",
			() => this.networkManager.send("Escape", {action: true}),
			() => this.networkManager.send("Escape", {action: false})
		);
	}

	handleStateChange(data)
	{
		const { oldState, newState } = data;

		switch (newState)
		{
			case 'ready':
				this.renderer.renderWaitingScreen('Hazır...');
				break;
			case 'waiting':
				this.renderer.renderWaitingScreen();
				break;
			case 'playing':
				// Oyun modu aktif edilecek
				break;
			case 'gameOver':
				// Game over ekranı
				break;
		}
	}

	startGame()
	{
		this.isRunning = true;
		this.gameLoop();
	}

	render(data, machine)
	{
		if (!this.isRunning)
			return;
		this.renderer.renderGame(data, machine);
		if (machine && typeof machine.updatePreview === 'function')
			machine.updatePreview();
	}

	gameLoop()
	{
		if (!this.isRunning)
			return;
		this.render(this.gameState, this.gameCore.getMachine("main"));
		requestAnimationFrame(() => this.gameLoop());
	}

	dispose()
	{
		this.isRunning = false;
		if (this.currentGameMode)
			this.currentGameMode.deactivate();
		this.networkManager.disconnect();
		this.gameCore.dispose();
	}
}
export default Client;
