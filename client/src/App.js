import NetworkManager from './network/NetworkManager.js';
import GameClient from "./GameClient.js";
import RoomUi from './RoomUi.js';

class App
{
	constructor()
	{
		this.playerId = this._TEST_generateRandomId();
		this.playerName = this._TEST_generateRandomName();
		this.gameClient = new GameClient("renderCanvas");
		this.networkManager = new NetworkManager();
		this.roomUi = new RoomUi();

		// Game ready state
		this.isReady = false;

		this._setupGlobalExports();
		this._setupNetworkListeners();
	}

	readyState()
	{
		this.isReady = !this.isReady;
		console.log("readyState fonksiyonu çağrıldı");
		const toggle = document.getElementById('readyToggle');

		if (this.isReady)
			toggle.classList.add('active');
		else
			toggle.classList.remove('active');
	}

	_setupGlobalExports()
	{
		// Export App instance and RoomUi for HTML onclick handlers
		window.app = this;
		window.roomUi = this.roomUi;

		// Export individual functions for HTML compatibility
		window.createTournament = () => this.roomUi.createTournament();
		window.joinTournament = () => this.roomUi.joinTournament();
		window.toggleReady = () => this.roomUi.toggleReady();
		window.startTournament = () => this.roomUi.startTournament();
		window.leaveTournament = () => this.roomUi.leaveTournament();
		window.closeTournamentRoom = () => this.roomUi.closeTournamentRoom();
		window.joinCustomRoom = (roomId) => this.roomUi.joinCustomRoom(roomId);

		// Export game functions
		window.localGameStart = () => this.startLocalGame();
		window.aiGameStart = () => this.startAIGame();
		window.customGameStart = () => this.createCustomGame();

		// Export ready toggle function
		window.toggleReady = () => this.toggleReady();
		window.getReadyState = () => this.getReadyState();
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

	/**
	 * Start local game
	 */
	startLocalGame()
	{
		const gameConfig = {
			gameMode: "local",
			// Add other local game config
		};
		this.loadGame(gameConfig);
	}

	/**
	 * Start AI game
	 */
	startAIGame()
	{
		const gameConfig = {
			gameMode: "ai",
			// Add other AI game config
		};
		this.loadGame(gameConfig);
	}

	/**
	 * Create custom game
	 */
	createCustomGame()
	{
		const roomData = {
			id: 'ROOM-' + this._TEST_generateRandomId(),
			name: 'Custom Game Room',
			type: 'custom',
			status: 'waiting',
			maxPlayers: 2,
			host: 'current_player',
			players: [
				{ id: 'current_player', name: 'You (Host)', status: 'waiting', isHost: true }
			],
			gameSettings: {
				paddleWidth: 10,
				paddleHeight: 100,
				paddleSpeed: 700,
				ballRadius: 7,
				ballSpeed: 600,
				ballSpeedIncrease: 100,
				maxPlayers: 2,
				maxScore: 11
			},
			createdAt: Date.now()
		};

		this.roomUi.createCustomRoom(roomData);
	}

	/**
	 * Start game with given data
	 */
	startGame(gameData)
	{
		this.roomUi.hideGameUI();

		const gameConfig = {
			gameMode: gameData.gameSettings?.gameMode || "custom",
			roomId: gameData.roomId,
			players: gameData.players,
			settings: gameData.gameSettings
		};

		this.loadGame(gameConfig);
	}

	/**
	 * Send message to server when connection is ready
	 */
	//! Ai
	_sendWhenConnected(type, payload)
	{
		if (this.networkManager.isConnected) {
			try {
				this.networkManager.send(type, payload);
			} catch (error) {
				console.error('❌ Failed to send message:', error);
				this.roomUi.showStatus('Failed to send to server', 'error');
			}
		} else {
			// Queue message for when connection is ready
			console.log('⏳ Queueing message until connected:', type);
			this.roomUi.showStatus('Connecting to server...', 'info');

			const sendWhenReady = () => {
				this.networkManager.send(type, payload);
				this.networkManager.off('connected', sendWhenReady);
			};

			this.networkManager.on('connected', sendWhenReady);
		}
	}

	/**
	 * Toggle ready state
	 */
	toggleReady()
	{
		this.isReady = !this.isReady;

		// Update button appearance
		const readyBtn = document.getElementById('readyToggleBtn');
		if (readyBtn) {
			if (this.isReady) {
				readyBtn.textContent = 'Hazır ✅';
				readyBtn.className = 'btn btn-success';
				this.roomUi.hideGameUI();
				console.log('🟢 Player is READY');
			} else {
				readyBtn.textContent = 'Hazır Ol';
				readyBtn.className = 'btn btn-warning';
				this.roomUi.showGameUI();
				console.log('🟡 Player is NOT READY');
			}
		}

		return this.isReady;
	}

	/**
	 * Check if player is ready
	 */
	getReadyState()
	{
		return this.isReady;
	}

	/**
	 * Force set ready state
	 */
	setReady(ready = true)
	{
		this.isReady = ready;
		this.toggleReady(); // Update UI
		return this.isReady;
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

	loadGame(gameConfig)
	{
		// Add canvas reference to game config
		gameConfig.canvas = document.getElementById('renderCanvas');

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
