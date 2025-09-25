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
			case 'ai':
				this._aiGameInitialize(gameConfig);
				break;
			case 'classic':
				this._classicGameInitialize(gameConfig);
				break;
			case 'tournament':
				this._tournamentGameInitialize(gameConfig);
				break;
			default:
				throw new Error(`Unknown game mode: ${gameConfig.GameMode}`);
		}
	}

	_classicGameInitialize(config)
	{
		this._singleArcadeInitialize(config);
	}

	_aiGameInitialize(config)
	{
		this._singleArcadeInitialize(config);
	}

	_localGameInitialize(config)
	{
		this._singleArcadeInitialize(config);
	}

	_tournamentGameInitialize(config)
	{
		this._multiArcadeInitialize(config);
	}

	async _multiArcadeInitialize(config)
	{
		console.log('🏟️ Initializing tournament arena with config:', JSON.stringify(config, null, 2));
		if (!config.tournament || !config.tournament.players) {
			throw new Error('Tournament configuration is missing players data');
		}

		const players = config.tournament.players;
		const playerCount = players.length;
		const radius = 15; // Yuvarlağın yarıçapı
		const angleStep = (Math.PI * 2) / playerCount; // Her oyuncu arası açı

		// Merkezi kamera konumu
		const centerPosition = { x: 0, y: 0, z: 0 };

		// Her oyuncu için arcade machine oluştur
		for (let i = 0; i < playerCount; i++) {
			const player = players[i];
			const angle = i * angleStep;

			// Yuvarlak düzende pozisyon hesapla
			const position = {
				x: Math.cos(angle) * radius,
				y: 0,
				z: Math.sin(angle) * radius
			};

			// Arcade machine oluştur
			const machine = new ArcadeMachine(this.gameCore.scene);
			machine.playerId = player.id;
			machine.playerName = player.name;
			machine.position = position;
			machine.angle = angle;

			// Machine'i yükle ve konumlandır
			await machine.load(config.arcade);
			machine.setPosition(position.x, position.y, position.z);

			// Machine'i merkeze doğru döndür
			machine.setRotation(0, angle + Math.PI, 0);

			// Machine'i map'e ekle (oyuncu ID'si ile)
			this.arcadeMachines.set(player.id, machine);

			console.log(`🎮 Created arcade machine for player ${player.name} at position (${position.x.toFixed(2)}, ${position.z.toFixed(2)})`);
		}

		// Kamerayı merkeze konumlandır ve yukarıdan baksın
		this.gameCore.setCameraPosition(
			{ x: 0, y: 20, z: 0 }, // Yukarıdan bakış
			{ x: 0, y: 0, z: 0 }   // Merkeze bak
		);

		console.log(`🏟️ Tournament arena initialized with ${playerCount} players`);
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

	render(data)
	{
		if (!this.isRunning)
			return;

		switch (this.currentGameMode) {
			case "local":
			case "classic":
			case "ai":
				const mainMachine = this.arcadeMachines.get('main');
				if (!mainMachine) {
					this.renderer.renderWaitingScreen('No arcade machines available for rendering', 'main');
					return;
				}
				this._renderMachine(data, mainMachine);
				break;

			case "tournament":
				this._renderTournament(data);
				break;

			default:
				throw new Error(`Unknown game mode for rendering: ${this.currentGameMode}`);
		}
	}

	_renderMachine(data, machine)
	{
		if (!machine)
			throw new Error('Arcade machine not found for rendering');
		this.renderer.renderGame(data, machine);
		machine.updatePreview();
	}

	_renderTournament(data)
	{
		// Tournament data format:
		// data = {
		//   matches: [
		//     { player1Id: 'id1', player2Id: 'id2', gameState: {...} },
		//     { player1Id: 'id3', player2Id: 'id4', gameState: {...} }
		//   ],
		//   currentRound: 1,
		//   totalRounds: 3
		// }

		if (!data || !data.matches) {
			// Waiting screen for all machines
			this.arcadeMachines.forEach((machine, playerId) => {
				this.renderer.renderWaitingScreen('Waiting for tournament to start...', playerId);
			});
			return;
		}

		// Her match için ilgili machine'leri render et
		data.matches.forEach(match => {
			const machine1 = this.arcadeMachines.get(match.player1Id);
			const machine2 = this.arcadeMachines.get(match.player2Id);

			if (machine1 && machine2 && match.gameState) {
				// Her iki oyuncunun machine'inde aynı oyun durumunu göster
				this._renderMachine(match.gameState, machine1);
				this._renderMachine(match.gameState, machine2);

				// Machine'leri aktif olarak işaretle
				machine1.setActive(true);
				machine2.setActive(true);
			}
		});

		// Aktif olmayan machine'ler için waiting screen
		this.arcadeMachines.forEach((machine, playerId) => {
			const isInActiveMatch = data.matches.some(match =>
				match.player1Id === playerId || match.player2Id === playerId
			);

			if (!isInActiveMatch) {
				machine.setActive(false);
				this.renderer.renderWaitingScreen('Waiting for your turn...', playerId);
			}
		});
	}

	// Player ID'sine göre machine bul
	getMachineByPlayerId(playerId)
	{
		return this.arcadeMachines.get(playerId);
	}

	// Belirli bir machine'e odaklan (kamera hareketi)
	focusOnPlayer(playerId)
	{
		const machine = this.arcadeMachines.get(playerId);
		if (!machine) {
			console.warn(`Machine not found for player: ${playerId}`);
			return;
		}

		// Kamerayı o machine'in önüne götür
		const cameraDistance = 8;
		const cameraHeight = 4;

		const cameraPosition = {
			x: machine.position.x + Math.cos(machine.angle + Math.PI) * cameraDistance,
			y: machine.position.y + cameraHeight,
			z: machine.position.z + Math.sin(machine.angle + Math.PI) * cameraDistance
		};

		this.gameCore.setCameraPosition(cameraPosition, machine.position);
		console.log(`🎥 Camera focused on player ${machine.playerName}`);
	}

	// Tüm arena görünümüne dön
	showArenaView()
	{
		this.gameCore.setCameraPosition(
			{ x: 0, y: 20, z: 0 }, // Yukarıdan bakış
			{ x: 0, y: 0, z: 0 }   // Merkeze bak
		);
		console.log('🏟️ Switched to arena view');
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
