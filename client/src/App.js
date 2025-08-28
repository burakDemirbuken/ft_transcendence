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

		this._setupEventListeners();
		this._setupGlobalExports();
	}

	_setupEventListeners()
	{
		// Listen to RoomUi events
		this.roomUi.addEventListener('customRoomCreated', (event) => {
			console.log('Custom room created:', event.detail);
			this.networkManager.send('room/create', {id: this.playerId, name: this.playerName});
			// TODO: Send to server via NetworkManager
		});

		this.roomUi.addEventListener('joinCustomRoomRequested', (event) => {
			console.log('Join custom room requested:', event.detail);
			this.networkManager.send('room/join', {id: this.playerId, roomId: event.detail.roomId});
		});

		this.roomUi.addEventListener('tournamentCreated', (event) => {
			console.log('Tournament created:', event.detail);
			this.networkManager.send('tournament/create', {id: this.playerId, name: event.detail.name});
		});

		this.roomUi.addEventListener('joinTournamentRequested', (event) => {
			console.log('Join tournament requested:', event.detail);
			this.networkManager.send('tournament/join', {id: this.playerId, tournamentId: event.detail.tournamentId});
		});

		this.roomUi.addEventListener('customGameStarted', (event) => {
			console.log('Custom game started:', event.detail);
			this.startGame(event.detail);
		});

		this.roomUi.addEventListener('playerReadyChanged', (event) => {
			console.log('Player ready changed:', event.detail);
			this.networkManager.send('player/ready', {id: this.playerId, isReady: event.detail.isReady});
		});

		this.roomUi.addEventListener('gameSettingChanged', (event) => {
			console.log('Game setting changed:', event.detail);
			// TODO: Send setting change to server via NetworkManager
		});
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
	}

	/**
	 * Update room data from server
	 */
	updateRoomData(roomData)
	{
		this.roomUi.updateRoomData(roomData);
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
				gameMode: 'custom',
				maxScore: 5,
				ballSpeed: 1.0,
				paddleSpeed: 1.0,
				difficulty: 'normal'
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
		// Get IP from URL
		const ip = window.location.hostname;
		this.networkManager.connect(`ws://${ip}:3000`, {
			id: this._TEST_generateRandomId(),
			name: this._TEST_generateRandomName()
		});

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
			case 'roomCreated':
				this.updateRoomData(data.roomData);
				break;
			case 'roomJoined':
				this.updateRoomData(data.roomData);
				break;
			case 'playerJoined':
				this.updateRoomData(data.roomData);
				break;
			case 'playerLeft':
				this.updateRoomData(data.roomData);
				break;
			case 'playerReadyChanged':
				this.updateRoomData(data.roomData);
				break;
			case 'gameSettingChanged':
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
