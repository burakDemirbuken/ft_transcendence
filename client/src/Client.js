
class Client
{
	constructor(canvasId)
	{
		this.canvas = document.getElementById(canvasId);
		this.gameCore = new GameCore();
		this.networkManager = new NetworkManager();
		this.gameStateManager = new GameStateManager();
		this.renderer = new GameRenderer(this.gameCore);

		// Game modes
		this.gameModes = {
			sameDevice: new SameDeviceMode(this.networkManager, this.gameStateManager),
			multiDevice: new MultiDeviceMode(this.networkManager, this.gameStateManager),
			tournament: new TournamentMode(this.networkManager, this.gameStateManager)
		};

		this.currentGameMode = null;
		this.isRunning = false;
	}

	async initialize(gameConfig)
	{
		await this.gameCore.initialize(this.canvas);
		this.renderer.initialize();
		this.setupEventListeners();
		this.gameStateManager.setState('ready');
	}

	setupEventListeners()
	{
		// Network events

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

	// Endpoint'ten gelen oyun modu bilgisi
	setGameMode(mode, options = {})
	{
		if (this.currentGameMode)
			this.currentGameMode.deactivate();

		this.currentGameMode = this.gameModes[mode];

		if (this.currentGameMode)
		{
			this.currentGameMode.activate();

			// Çoklu cihaz modunda oyuncu ID'si gerekebilir
			if (mode === 'multiDevice' && options.playerId)
				this.currentGameMode.setPlayerId(options.playerId);

			this.gameStateManager.setState('waiting');
		}
	}

	// API endpoint'i için public method
	async setGameModeFromAPI(endpoint)
	{
		try
		{
			const response = await fetch(endpoint);
			const data = await response.json();

			if (data.gameMode)
				this.setGameMode(data.gameMode, data.options);
		}
		catch (error)
		{
			console.error('Oyun modu alınamadı:', error);
		}
	}

	startGame()
	{
		this.isRunning = true;
		this.gameLoop();
	}

	gameLoop()
	{
		if (!this.isRunning)
			return;

		// Ana oyun döngüsü - çizim sunucudan gelen verilere göre yapılacak
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
