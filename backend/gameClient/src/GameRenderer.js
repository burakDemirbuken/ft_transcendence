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
		this.playerMachine = null;

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
			case 'ai':
			case 'classic':
				await this.classicInitialize(gameConfig);
				break;
			case 'tournament':
				await this.tournamentInitialize(gameConfig.arcadeCount, gameConfig.arcadeOwnerNumber);
				break;
			default:
				throw new Error(`Unknown game mode: ${gameConfig.GameMode}`);
		}
	}

/*
	canvasId: "renderCanvas",
	gameMode: 'tournament',
	renderConfig:
	{
		...rendererConfig,
		paddleSize:
		{
			width: data.gameSettings.paddleWidth,
			height: data.gameSettings.paddleHeight
		},
	},
	arcadeCount: data.gameCount,
	arcadeOwnerNumber: data.games.findIndex(g => g.players.includes(this.playerId)) + 1,
*/

	async tournamentInitialize(arcadeCount, playerOwnerNumber)
	{

		const radius = 5; // Yuvarlağın yarıçapı
		const angleStep = (Math.PI * 2) / arcadeCount; // Her oyuncu arası açı
		console.log(`angleStep: ${angleStep.toFixed(2)} radians for ${arcadeCount} players`);

		const centerPosition = { x: 0, y: 0, z: 0 };

		for (let i = 0; i < arcadeCount; i++)
		{
			const angle = i * angleStep;
			console.log(`Angle for player ${i + 1}: ${angle.toFixed(2)} radians`);
			const position = {
				x: Math.cos(angle) * radius,
				y: 0,
				z: Math.sin(angle) * radius
			};

			const machine = new ArcadeMachine(this.gameCore.scene);

			await machine.load(position, angle + Math.PI);

			this.arcadeMachines.set(i + 1, machine);
			console.log(`🎮 Created arcade machine for player ${i + 1} at position (${JSON.stringify(position, null, 2)})`);
		}
		this.playerMachine = this.arcadeMachines.get(playerOwnerNumber);
		this.gameCore.setCameraPosition(
			{ x: this.playerMachine.position.x, y: this.playerMachine.position.y + 4.5, z: this.playerMachine.position.z + 2.5},
			{ x: this.playerMachine.position.x, y: this.playerMachine.position.y + 3.75, z: this.playerMachine.position.z }
		);
		console.log(`🏟️ Tournament arena initialized with ${arcadeCount} players`);
	}

	async classicInitialize(config)
	{
		this.playerMachine = new ArcadeMachine(this.gameCore.scene);
		await this.playerMachine.load();
		this.gameCore.setCameraPosition(
			{ x: this.playerMachine.position.x, y: this.playerMachine.position.y + 4.5, z: this.playerMachine.position.z + 2.5},
			{ x: this.playerMachine.position.x, y: this.playerMachine.position.y + 3.75, z: this.playerMachine.position.z });
		this.arcadeMachines.set('main', this.playerMachine);
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
