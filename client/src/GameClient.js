
import GameCore from './core/GameCore.js';
import Renderer from './rendering/Renderer.js';
import EventEmitter from './utils/EventEmitter.js';

class GameClient extends EventEmitter
{
	constructor()
	{
		super();
		this.canvas = null;
		this.gameCore = new GameCore();
		this.renderer = new Renderer(this.gameCore);
		this.gameState = null;

		// ? this.gameStateManager = new GameStateManager();
		this.isRunning = false;
	}
//		await this.gameCore.loadScene(gameConfig.gameMode);


// oyun başladığında initialize edilecek sahne yüklenecek oyun oynanmaya hazır hale gelecek
	async initialize(gameConfig)
	{
		if (!gameConfig || !gameConfig.canvasId)
			throw new Error('Game configuration is missing canvasId');
		this.canvas = document.getElementById(gameConfig.canvasId);
		if (!this.canvas)
			throw new Error('Canvas is missing');

		switch (gameConfig.GameMode)
		{
			case 'local':
				this.localGameInitialize(gameConfig);
				break;
			case 'multiple':
				this.multiplayerGameInitialize(gameConfig);
				break;
			case 'tournament':
				this.tournamentGameInitialize(gameConfig);
				break;
			case 'ai':
				this.aiGameInitialize(gameConfig);
				break;
			case 'custom':
				this.customGameInitialize(gameConfig);
				break;
			case 'classic':
				this.classicGameInitialize(gameConfig);
				break;
			default:
				throw new Error(`Unknown game mode: ${gameConfig.GameMode}`);
		}


		await this.gameCore.initialize(this.canvas, gameConfig.arcade);
		if (!gameConfig.gameRender)
			throw new Error('Game render configuration is missing');
		this.renderer.initialize(gameConfig.gameRender);
		this.setupGameControls();
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
export default GameClient;
