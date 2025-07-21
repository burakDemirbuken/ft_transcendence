
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

import GameCore from './GameCore.js';
import NetworkManager from './NetworkManager.js';
import GameStateManager from './GameStateManager.js';
import GameRenderer from './GameRenderer.js';
import InputManager from './InputManager.js';

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
		/*
		// Game modes
		this.gameModes = {
			sameDevice: new SameDeviceMode(this.networkManager, this.gameStateManager),
			multiDevice: new MultiDeviceMode(this.networkManager, this.gameStateManager),
			tournament: new TournamentMode(this.networkManager, this.gameStateManager)
		};
		*/
		this.isRunning = false;
	}

	async initialize(gameConfig)
	{
		if (!this.canvas || !gameConfig || !gameConfig.arcade)
			throw new Error('Canvas or game configuration is missing');
		await this.gameCore.initialize(this.canvas, gameConfig.arcade);
		await this.gameCore.setViewMode(gameConfig.gameMode);
		if (!gameConfig.gameRender)
			throw new Error('Game render configuration is missing');
		this.renderer.initialize(gameConfig.gameRender);
		this.networkManager.connect();
		this.setupEventListeners();
	}

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
			() =>
			{
				console.log('Sunucuya bağlandı');
			}
		);
		this.inputManager.onKey("w",
			() =>
			{
				this.networkManager.send({ type: "input", payload: {direction: 'up', action: "down"} });
			},
			() =>
			{
				this.networkManager.send({ type: "input", payload: {direction: 'up', action: "up"} });
			}
		);
		this.inputManager.onKey("s",
			() =>
			{
				this.networkManager.send({ type: "input", payload: {direction: 'down', action: "down"} });
			},
			() =>
			{
				this.networkManager.send({ type: "input", payload: {direction: 'down', action: "up"} });
			}
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

	connectToServer(url)
	{
		this.networkManager.connect(url);
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
