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
import GameStateManager from './GameStateManager.js';
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

	TEST_generateRandomId()
	{
		return Math.random().toString(36).substr(2, 6).toUpperCase();
	}

	TEST_generateRandomName()
	{
		const names = [
			'Player', 'Gamer', 'User', 'Tester', 'Demo',
			'Alpha', 'Beta', 'Gamma', 'Delta', 'Echo'
		];
		const randomName = names[Math.floor(Math.random() * names.length)];
		const randomNumber = Math.floor(Math.random() * 999) + 1;
		return `${randomName}${randomNumber}`;
	}

	async initialize(gameConfig)
	{
		if (!this.canvas || !gameConfig || !gameConfig.arcade)
			throw new Error('Canvas or game configuration is missing');

		// Store gameConfig as instance variable for later use
		this.gameConfig = gameConfig;

		await this.gameCore.initialize(this.canvas, gameConfig.arcade);
		await this.gameCore.setViewMode(gameConfig.gameMode);
		if (!gameConfig.gameRender)
			throw new Error('Game render configuration is missing');
		this.renderer.initialize(gameConfig.gameRender);

		const hostname = window.location.hostname || 'localhost';
		console.log(`🌐 Using hostname: ${hostname}`);

		const params = new URLSearchParams({
			id: this.TEST_generateRandomId(),
			name: this.TEST_generateRandomName(),
			matchId: this.generateUniqueMatchId(),
			gameMode: gameConfig.gameMode
		});
		const url = `ws://${hostname}:3000/ws?${params.toString()}`;
		this.networkManager.connect(url);
		this.setupEventListeners();
	}

	createCustomRoom()
	{

	}

	generateUniqueMatchId()
	{
		const timestamp = Date.now().toString(36);
		const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
		return `match-${timestamp}-${randomPart}`;
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
			() => console.log('Sunucuya bağlandı')
		);
		this.inputManager.onKey("w",
			() => this.networkManager.send("move", {direction: 'up', action: true}),
			() => this.networkManager.send("move", {direction: 'up', action: false})
		);
		this.inputManager.onKey("s",
			() => this.networkManager.send("move", {direction: 'down', action: true}),
			() => this.networkManager.send("move", {direction: 'down', action: false})
		);
		this.inputManager.onKey("ArrowUp",
			() => this.networkManager.send(this.gameConfig.gameMode === "local" ? "player2Move" : "move", {direction: 'up', action: true}),
			() => this.networkManager.send(this.gameConfig.gameMode === "local" ? "player2Move" : "move", {direction: 'up', action: false})
		);

		this.inputManager.onKey("ArrowDown",
			() => this.networkManager.send(this.gameConfig.gameMode === "local" ? "player2Move" : "move", {direction: 'down', action: true}),
			() => this.networkManager.send(this.gameConfig.gameMode === "local" ? "player2Move" : "move", {direction: 'down', action: false})
		);


		this.inputManager.onKey("r", () => this.networkManager.send("reset"));
		this.inputManager.onKey("Escape",
			() => this.networkManager.send("pause")
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
