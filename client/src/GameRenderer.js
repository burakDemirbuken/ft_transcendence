
import GameCore from './core/GameCore.js';
import Renderer from './rendering/Renderer.js';
import EventEmitter from './utils/EventEmitter.js';
import ArcadeMachine from './arcade/ArcadeMachine.js';

class GameRenderer extends EventEmitter
{
	constructor()
	{
		super();
		this.canvas = null;
		this.gameCore = new GameCore();
		this.arcadeMachines = new Map();
		this.renderer = new Renderer(this.gameCore);
		this.gameState = null;
		this.currentGameMode = null;

		// ? this.gameStateManager = new GameStateManager();
		this.isRunning = false;
	}
//		await this.gameCore.loadScene(gameConfig.gameMode);


// oyun başladığında initialize edilecek sahne yüklenecek oyun oynanmaya hazır hale gelecek
	async initialize(gameConfig)
	{
		console.log('🚀 Initializing game renderer with config:', gameConfig);
		if (!gameConfig || !gameConfig.canvasId)
			throw new Error('Game configuration is missing canvasId');
		this.canvas = document.getElementById(gameConfig.canvasId);
		if (!this.canvas)
			throw new Error('Canvas is missing');
		if (!gameConfig.renderConfig)
			throw new Error('Game render configuration is missing');
		await this.gameCore.initialize(this.canvas, gameConfig.arcade);
		this.renderer.initialize(gameConfig.renderConfig);
		this.currentGameMode = gameConfig.gameMode;
		switch (this.currentGameMode)
		{
			case 'local':
				this._localGameInitialize(gameConfig);
				break;
			case 'multiple':
				this._multiplayerGameInitialize(gameConfig);
				break;
			case 'tournament':
				this._tournamentGameInitialize(gameConfig);
				break;
			case 'ai':
				this._aiGameInitialize(gameConfig);
				break;
			case 'custom':
				this._customGameInitialize(gameConfig);
				break;
			case 'classic':
				this._classicGameInitialize(gameConfig);
				break;
			default:
				throw new Error(`Unknown game mode: ${gameConfig.GameMode}`);
		}
	}

	async _localGameInitialize(config)
	{
		this._singleArcadeInitialize(config);
	}

	async  _singleArcadeInitialize(config)
	{
		const mainMachine = new ArcadeMachine(this.gameCore.scene);
		await mainMachine.load(config.arcade);
		this.gameCore.setCameraPosition(
			{x: mainMachine.position.x, y: mainMachine.position.y + 4.5, z: mainMachine.position.z + 2.5},
			{ x: mainMachine.position.x, y: mainMachine.position.y + 3.75, z: mainMachine.position.z });
		this.arcadeMachines.set('main', mainMachine);
	}

	startRendering()
	{
		this.isRunning = true;
		this.gameLoop();
	}

	//! machine name değişecek
	render(data)
	{
		if (!this.isRunning)
			return;
		let machine;
		if (this.currentGameMode === "local" || this.currentGameMode === "classic" || this.currentGameMode === "ai")
			machine = this.arcadeMachines.get('main');
		else
			throw new Error(`Unknown game mode for rendering: ${this.currentGameMode}`);
		if (!machine)
		{
			this.renderer.renderWaitingScreen('No arcade machines available for rendering', 'main');
			return;
		}
		this._renderMachine(data, machine);
	}

	_renderMachine(data, machine)
	{
		if (!machine)
			throw new Error('Arcade machine not found for rendering');
		this.renderer.renderGame(data, machine);
		machine.updatePreview();
	}

	gameLoop()
	{
		if (!this.isRunning)
			return;
		if (this.gameState)
			this.render(this.gameState);
		else
			this.renderer.renderWaitingScreen("Waiting for game state...", 'main');
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
export default GameRenderer;
