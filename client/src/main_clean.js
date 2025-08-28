import GameClient from './GameClient.js';
import RoomManager from './RoomUi.js';
import * as constants from './utils/constants.js';

let gameClient = new GameClient("renderCanvas");
let roomManager = new RoomManager();
let gameState = {
	isInGame: false,
	gameMode: null,
	tournamentData: null
};

// Setup RoomManager event listeners
roomManager.addEventListener('customGameStarted', (event) => {
	const gameData = event.detail;
	startGameWithMode("custom", gameData);
});

roomManager.addEventListener('tournamentMatchStart', (event) => {
	const matchData = event.detail;
	onTournamentMatchStart(matchData);
});

// Make roomManager available globally for HTML onclick handlers
window.roomManager = roomManager;

const ip = window.location.hostname;
const port = 3030;

const exampleGameConfig = {
	type: "config",
	payload: {
		gameMode: "multiple", // "local", "online", "tournament", "ai"
		arcade: {
			position: { x: 0, y: 0, z: 0 },
			type: "classic", // "classic", "modern", "pong1971"
			machine: {
				path: "../models/arcade/classic/",
				model: "arcade.obj",
				colors: {
					body: "#FF0000",
					sides: "#00FF00",
					joystick: "#0000FF",
					buttons: "#FFFF00"
				}
			}
		},
		gameRender: {
			colors: {
				background: "#000000",
				paddle: "#FFFFFF",
				ball: "#FFFFFF",
				text: "#FFFFFF",
				accent: "#00FF00"
			},
			paddleSize: {
				width: constants.PADDLE_WIDTH,
				height: constants.PADDLE_HEIGHT,
			},
			ball: {
				radius: constants.BALL_RADIUS
			}
		},
	}
};

const exampleCustomProperties = {
	canvasWidth: 800,
	canvasHeight: 600,
	paddleWidth: 10,
	paddleHeight: 100,
	paddleSpeed: 700,
	ballRadius: 7,
	ballSpeed: 600,
	ballSpeedIncrease: 100,
	maxPlayers: 2,
	maxScore: 11
};

// ================================
// GAME FUNCTIONS
// ================================

function localGameStart() {
	startGameWithMode("local");
}

function aiGameStart() {
	startGameWithMode("ai");
}

async function customGameStart() {
	try {
		// Use RoomManager to create custom room
		const roomData = {
			id: 'ROOM-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
			name: 'Custom Game Room',
			type: 'custom',
			status: 'waiting',
			maxPlayers: 2,
			host: 'current_player',
			players: [
				{ id: 'current_player', name: 'You (Host)', status: 'waiting', isHost: true }
			],
			gameSettings: {
				...exampleCustomProperties
			},
			createdAt: Date.now()
		};

		roomManager.createCustomRoom(roomData);
	} catch (error) {
		console.error('❌ Failed to start custom game:', error);
		showGameError('Failed to create custom room: ' + error.message);
	}
}

function joinGame() {
	const customGameId = document.getElementById("customGameId")?.value?.trim();
	if (!customGameId) {
		showGameError("Please enter a valid Game ID.");
		return;
	}

	// Use RoomManager to join room
	roomManager.joinCustomRoom(customGameId);
}

function tournamentGameStart(tournamentData) {
	startGameWithMode("tournament", tournamentData);
}

function startGameWithMode(mode, additionalData = null) {
	hideGameUI();
	exampleGameConfig.payload.gameMode = mode;

	// Handle additional data based on mode
	if (mode === "tournament" && additionalData) {
		exampleGameConfig.payload.tournamentData = additionalData;
		gameState.tournamentData = additionalData;
	} else if (mode === "multiple" && additionalData?.matchId) {
		exampleGameConfig.payload.matchId = additionalData.matchId;
	}

	gameState.gameMode = mode;

	try {
		gameClient.initialize(exampleGameConfig.payload);
		gameClient.startGame();
		gameState.isInGame = true;
		console.log(`🎮 Game started in ${mode} mode`);
	} catch (error) {
		console.error('❌ Error initializing client:', error);
		showGameError('Failed to start game. Please try again.');
		showGameUI();
	}
}

// Tournament integration functions
function onTournamentMatchStart(matchData) {
	console.log('🏆 Tournament match starting:', matchData);
	gameState.tournamentData = matchData;
	tournamentGameStart(matchData);
}

function onGameEnd(gameResult) {
	console.log('🎯 Game ended:', gameResult);

	gameState.isInGame = false;
	showGameUI();

	// If this was a tournament game, report results
	if (gameState.gameMode === "tournament" && gameState.tournamentData) {
		reportTournamentResult(gameResult);
	}

	// Reset game state
	gameState.gameMode = null;
	gameState.tournamentData = null;
}

function reportTournamentResult(gameResult) {
	// TODO: Send tournament result to server
	console.log('📊 Reporting tournament result:', gameResult);

	// Show result to user
	const message = gameResult.winner
		? `Game finished! Winner: ${gameResult.winner}`
		: 'Game finished!';

	// You could integrate this with the tournament UI
	if (window.showStatus) {
		window.showStatus(message, 'info');
	}
}

function exitGame() {
	if (gameState.isInGame) {
		console.log('🚪 Exiting game...');

		// TODO: Notify server if in online/tournament mode
		if (gameState.gameMode === "multiple" || gameState.gameMode === "tournament") {
			// Send disconnect message to server
		}

		gameState.isInGame = false;
		gameState.gameMode = null;
		gameState.tournamentData = null;
		showGameUI();
	}
}

// ================================
// UI FUNCTIONS
// ================================

function hideGameUI() {
	const uiOverlay = document.querySelector('.ui-overlay');
	if (uiOverlay) {
		uiOverlay.style.display = 'none';
	}
}

function showGameUI() {
	const uiOverlay = document.querySelector('.ui-overlay');
	if (uiOverlay) {
		uiOverlay.style.display = 'flex';
	}
}

function showGameError(message) {
	// Create or update error display
	let errorEl = document.getElementById('gameError');
	if (!errorEl) {
		errorEl = document.createElement('div');
		errorEl.id = 'gameError';
		errorEl.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: rgba(255, 0, 0, 0.9);
			color: white;
			padding: 15px;
			border-radius: 8px;
			z-index: 2000;
			max-width: 300px;
		`;
		document.body.appendChild(errorEl);
	}

	errorEl.textContent = message;
	errorEl.style.display = 'block';

	// Auto-hide after 5 seconds
	setTimeout(() => {
		if (errorEl) {
			errorEl.style.display = 'none';
		}
	}, 5000);
}

// ================================
// UTILITY FUNCTIONS
// ================================

function TEST_generateRandomId() {
	return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function TEST_generateRandomName() {
	const names = [
		'Player', 'Gamer', 'User', 'Tester', 'Demo',
		'Alpha', 'Beta', 'Gamma', 'Delta', 'Echo'
	];
	const randomName = names[Math.floor(Math.random() * names.length)];
	const randomNumber = Math.floor(Math.random() * 999) + 1;
	return `${randomName}${randomNumber}`;
}

// Participant management helpers
function showAddParticipantDialog() {
    const playerName = prompt('Katılımcı adını girin:');
    if (playerName && playerName.trim()) {
        const playerData = {
            id: 'manual_' + Date.now(),
            name: playerName.trim()
        };

        if (roomManager.isInTournament()) {
            roomManager.addParticipantToTournament(playerData);
        } else if (roomManager.isInCustomRoom()) {
            roomManager.addParticipantToCustomRoom(playerData);
        } else {
            roomManager.showStatus('Aktif oda veya turnuva bulunamadı', 'error');
        }
    }
}

function addRandomParticipant() {
    const sampleNames = [
        'Ahmet Yılmaz', 'Ayşe Kaya', 'Mehmet Demir', 'Fatma Şahin',
        'Ali Öztürk', 'Zeynep Arslan', 'Mustafa Çelik', 'Elif Aydın',
        'Burak Koç', 'Selin Güneş', 'Emre Yıldız', 'Deniz Aktaş'
    ];

    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const playerData = {
        id: 'random_' + Date.now(),
        name: randomName
    };

    if (roomManager.isInTournament()) {
        roomManager.addParticipantToTournament(playerData);
    } else if (roomManager.isInCustomRoom()) {
        roomManager.addParticipantToCustomRoom(playerData);
    } else {
        roomManager.showStatus('Aktif oda veya turnuva bulunamadı', 'error');
    }
}

// Keyboard controls for game
function setupKeyboardControls() {
	document.addEventListener('keydown', (event) => {
		if (!gameState.isInGame) return;

		// ESC to exit game
		if (event.key === 'Escape') {
			exitGame();
		}
	});
}

// Initialize when page loads
function initialize() {
	setupKeyboardControls();
	console.log('🎮 Game system initialized');
}

// Call initialize when DOM is ready
if (document.readyState === 'loading')
	document.addEventListener('DOMContentLoaded', initialize);
else
	initialize();

// ================================
// GLOBAL EXPORTS
// ================================

// Export functions to global scope for HTML onclick handlers
window.localGameStart = localGameStart;
window.aiGameStart = aiGameStart;
window.customGameStart = customGameStart;
window.joinGame = joinGame;

// Export tournament-related functions (now using RoomManager)
window.tournamentGameStart = tournamentGameStart;
window.onTournamentMatchStart = onTournamentMatchStart;
window.onGameEnd = onGameEnd;
window.exitGame = exitGame;
window.createTournament = () => roomManager.createTournament();
window.joinTournament = () => roomManager.joinTournament();
window.showTournamentRoom = () => roomManager.showTournamentRoom();
window.closeTournamentRoom = () => roomManager.closeTournamentRoom();
window.toggleReady = () => roomManager.toggleReady();
window.startTournament = () => roomManager.startTournament();
window.leaveTournament = () => roomManager.leaveTournament();
window.showStatus = (message, type) => roomManager.showStatus(message, type);

// Export custom room functions (now using RoomManager)
window.createCustomRoom = (roomData) => roomManager.createCustomRoom(roomData);
window.joinCustomRoom = (roomId) => roomManager.joinCustomRoom(roomId);
window.showCustomRoomInterface = () => roomManager.showCustomRoomInterface();
window.closeCustomRoom = () => roomManager.closeCustomRoom();
window.toggleCustomRoomReady = () => roomManager.toggleCustomRoomReady();
window.updateGameSetting = (setting, value) => roomManager.updateGameSetting(setting, value);
window.startCustomGame = () => roomManager.startCustomGame();
window.leaveCustomRoom = () => roomManager.leaveCustomRoom();

// Export participant management functions (now using RoomManager)
window.showAddParticipantDialog = showAddParticipantDialog;
window.addParticipantToTournament = (playerData) => roomManager.addParticipantToTournament(playerData);
window.addParticipantToCustomRoom = (playerData) => roomManager.addParticipantToCustomRoom(playerData);
window.addRandomParticipant = addRandomParticipant;
window.removeParticipant = (playerId) => roomManager.removeParticipant(playerId);

// Export game state for other modules
window.gameState = gameState;
