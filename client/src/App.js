import NetworkManager from './network/NetworkManager.js';
import GameRenderer from "./GameRenderer.js";
import RoomUi from './RoomUi.js';
import localGameConfig from './json/LocalGameConfig.json' assert { type: 'json' };
import InputManager from './input/InputManager.js';

class App
{
	constructor()
	{
		this.playerId = this._TEST_generateRandomId();
		this.playerName = this._TEST_generateRandomName();
		this.gameRenderer = new GameRenderer();
		this.networkManager = new NetworkManager();
		this.roomUi = new RoomUi();
		this.inputManager = new InputManager();


		// Game ready state
		this.isReady = false;

		this._setupGlobalExports();
		this._setupNetworkListeners();
	}

	_localGameControllerSetup()
	{
		this.inputManager.onKey("w",
			() =>
			{
				this.gameRenderer.joystickMove(1, 'up');
				this.networkManager.send("w", {action: true});
			},
			() =>
			{
				this.gameRenderer.joystickMove(1, 'neutral');
				this.networkManager.send("w", {action: false});
			}
		);
		this.inputManager.onKey("s",
			() =>
			{
				this.gameRenderer.joystickMove(1, 'down');
				this.networkManager.send("s", {action: true});
			},
			() =>
			{
				this.gameRenderer.joystickMove(1, 'neutral');
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
	}

	_setupNetworkListeners()
	{
		// Listen to NetworkManager events
		this.networkManager.on('connected', () => {
			console.log('✅ Connected to server');
			this.roomUi.showStatus('Connected to server', 'success');
		});

		this.networkManager.on('disconnected', (data) => {
			console.log('🔌 Disconnected from server:', data);
			this.roomUi.showStatus('Disconnected from server', 'warning');
		});

		this.networkManager.on('error', (error) => {
			console.error('❌ Network error:', error);
			this.roomUi.showStatus('Network connection error', 'error');
		});

		// Listen to game-specific network events
		this.networkManager.on('room/update', (data) => {
			console.log('Room updated:', data);
		});

		this.networkManager.on('tournament/created', (data) => {
			this.roomUi.showStatus('Tournament ID: ' + data.tournamentData.id, 'info');
		});

		this.networkManager.on('tournament/started', (data) => {
			this.startLocalGame();
		});
			this.networkManager.on('tournament/update', (data) => {
			console.log('tournament updated:', data);
		});

		this.networkManager.on('tournament/created', (data) => {
			this.roomUi.showStatus('tournament ID: ' + data.id, 'info');
		});

		this.networkManager.on('tournament/started', (data) => {
		});
	}


	startGame(gameData)
	{
		this.roomUi.hideGameUI();

		const gameConfig = {
			canvas: gameData.canvas,
			gameMode: gameData.gameSettings?.gameMode || "custom",
			roomId: gameData.roomId,
			settings: gameData.gameSettings
		};

		this.loadGame(gameConfig);
	}


	_TEST_generateRandomId()
	{
		return Math.random().toString(36).substr(2, 6).toUpperCase();
	}

	_TEST_generateRandomName()
	{
		const names = [
			'Player', 'Gamer', 'User', 'Tester', 'Demo',
			'Alpha', 'Beta', 'Gamma', 'Delta', 'Echo'
		];
		const randomName = names[Math.floor(Math.random() * names.length)];
		const randomNumber = Math.floor(Math.random() * 999) + 1;
		return `${randomName}${randomNumber}`;
	}

	initialize()
	{
		// Get IP from URL with fallback for Docker
		const ip = window.location.hostname;
		console.log('🌐 Connecting to:', `ws://${ip}:3000/ws`);

		// Try to connect to WebSocket server with fallback
		try {
			this.networkManager.connect(`ws://${ip}:3000/ws`, {
				id: this.playerId,
				name: this.playerName
			});
		} catch (error) {
			console.warn('❌ WebSocket connection failed:', error);
			console.log('🎮 Continuing in offline mode...');
			this.roomUi.showStatus('Running in offline mode - WebSocket unavailable', 'warning');
		}

		console.log('🎮 App initialized successfully');
	}
	//* Kaldığım aşama: En son oyun controllerini ayarladın. Bunu kullanarak local game başlat
	loadGame(gameConfig)
	{
		this.gameClient.initialize(gameConfig).then(() =>
		{
			console.log('✅ Game initialized successfully');
			this.gameClient.startGame();
		})
		.catch((error) =>
		{
			console.error('❌ Error initializing game:', error);
			this.roomUi.showGameError('Failed to start game: ' + error.message);
			this.roomUi.showGameUI();
		});
	}

	// ================================
	// NETWORK EVENT HANDLERS
	// ================================

	/**
	 * Handle network events from server
	 */
	handleNetworkEvent(eventType, data)
	{
		switch (eventType) {
			case 'room/created':
				this.updateRoomData(data.roomData);
				break;
			case 'room/joined':
				this.updateRoomData(data.roomData);
				break;
			case 'player/joined':
				this.updateRoomData(data.roomData);
				break;
			case 'player/left':
				this.updateRoomData(data.roomData);
				break;
			case 'player/readyChanged':
				this.updateRoomData(data.roomData);
				break;
			case 'game/settingChanged':
				this.updateRoomData(data.roomData);
				break;
			case 'gameStarted':
				this.startGame(data.gameData);
				break;
			case 'tournamentCreated':
				this.updateRoomData(data.tournamentData);
				break;
			case 'tournamentJoined':
				this.updateRoomData(data.tournamentData);
				break;
			case 'tournamentStarted':
				this.roomUi.showStatus('Tournament started!', 'success');
				break;
			default:
				console.log('Unhandled network event:', eventType, data);
		}
	}

	// ================================
	// SERVER DATA EXAMPLES & DOCS
	// ================================

	/**
	 * Example of expected server room data format:
	 *
	 * {
	 *   id: "ROOM-12345",
	 *   name: "Custom Room",
	 *   type: "custom", // or "tournament"
	 *   status: "waiting", // "waiting", "in_game", "completed"
	 *   maxPlayers: 2,
	 *   host: "player1",
	 *   players: [
	 *     { id: "player1", name: "Host", status: "ready", isHost: true },
	 *     { id: "player2", name: "Player 2", status: "waiting", isHost: false }
	 *   ],
	 *   gameSettings: {
	 *     paddleWidth: 10,
	 *     paddleHeight: 100,
	 *     paddleSpeed: 700,
	 *     ballRadius: 7,
	 *     ballSpeed: 600,
	 *     ballSpeedIncrease: 100,
	 *     maxPlayers: 2,
	 *     maxScore: 11
	 *   },
	 *   createdAt: 1633036800000
	 * }
	 */

}

// Initialize app when DOM is ready
let app;

function initializeApp() {
	app = new App();
	app.initialize();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeApp);
} else {
	initializeApp();
}

export default App;
