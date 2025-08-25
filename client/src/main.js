import Client from './Client.js';
import * as constants from './utils/constants.js';

let client = new Client("renderCanvas");
let gameState = {
	isInGame: false,
	gameMode: null,
	tournamentData: null
};

const exampleGameConfig =
{
	type: "config",

	payload:
	{
		gameMode: "multiple", // "local", "online", "tournament", "ai"

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
				width: constants.PADDLE_WIDTH,
				height: constants.PADDLE_HEIGHT,
			},
			ball:
			{
				radius: constants.BALL_RADIUS
			}
		},
	}
};

function localGameStart()
{
	startGameWithMode("local");
}

function aiGameStart()
{
	startGameWithMode("ai");
}

function customGameStart()
{
	// Open custom room creation interface
	createCustomRoom();
}

function tournamentGameStart(tournamentData)
{
	startGameWithMode("tournament", tournamentData);
}


function TEST_generateRandomId()
{
	return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function TEST_generateRandomName()
{
	const names = [
		'Player', 'Gamer', 'User', 'Tester', 'Demo',
		'Alpha', 'Beta', 'Gamma', 'Delta', 'Echo'
	];
	const randomName = names[Math.floor(Math.random() * names.length)];
	const randomNumber = Math.floor(Math.random() * 999) + 1;
	return `${randomName}${randomNumber}`;
}

function startGameWithMode(mode, additionalData = null)
{
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
		client.initialize(exampleGameConfig.payload);
		client.startGame();
		gameState.isInGame = true;
		console.log(`🎮 Game started in ${mode} mode`);
	} catch (error) {
		console.error('❌ Error initializing client:', error);
		showGameError('Failed to start game. Please try again.');
		showGameUI();
	}
}

function hideGameUI()
{
	const uiOverlay = document.querySelector('.ui-overlay');
	if (uiOverlay) {
		uiOverlay.style.display = 'none';
	}
}

function showGameUI()
{
	const uiOverlay = document.querySelector('.ui-overlay');
	if (uiOverlay) {
		uiOverlay.style.display = 'flex';
	}
}

function showGameError(message)
{
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

function joinGame()
{
	const customGameId = document.getElementById("customGameId").value;
	if (!customGameId)
	{
		showGameError("Please enter a valid Game ID.");
		return;
	}

	startGameWithMode("multiple", { matchId: customGameId });
}

// Tournament integration functions
function onTournamentMatchStart(matchData)
{
	console.log('🏆 Tournament match starting:', matchData);
	gameState.tournamentData = matchData;
	tournamentGameStart(matchData);
}

function onGameEnd(gameResult)
{
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

function reportTournamentResult(gameResult)
{
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

// Keyboard controls for game
function setupKeyboardControls()
{
	document.addEventListener('keydown', (event) => {
		if (!gameState.isInGame) return;

		// ESC to exit game
		if (event.key === 'Escape') {
			exitGame();
		}
	});
}

function exitGame()
{
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

// Initialize when page loads
function initialize()
{
	setupKeyboardControls();
	console.log('🎮 Game system initialized');
}

// Call initialize when DOM is ready
if (document.readyState === 'loading')
	document.addEventListener('DOMContentLoaded', initialize);
else
	initialize();

// Tournament UI Management
let currentTournament = null;
let isHost = false;
let currentPlayerReady = false;

function createTournament()
{
	const tournamentId = 'TOUR-' + Math.random().toString(36).substr(2, 8).toUpperCase();

	// Mock tournament creation
	currentTournament = {
	id: tournamentId,
	name: 'New Tournament',
	status: 'waiting',
	maxPlayers: 8,
	players: [
		{ id: 'current_player', name: 'You', status: 'waiting' }
	],
	format: 'Single Elimination'
	};

	isHost = true;
	currentPlayerReady = false;
	showTournamentRoom();
	showStatus('Tournament created successfully!', 'success');

	// TODO: Send create tournament request to server
	console.log('Creating tournament:', tournamentId);
}

function joinTournament() {
	const tournamentId = document.getElementById('customTournamentId').value.trim();

	if (!tournamentId) {
	showStatus('Please enter a tournament ID', 'error');
	return;
	}

	// Mock tournament join
	currentTournament = {
	id: tournamentId,
	name: 'Joined Tournament',
	status: 'waiting',
	maxPlayers: 8,
	players: [
		{ id: 'player1', name: 'Host', status: 'ready' },
		{ id: 'player2', name: 'Player 2', status: 'waiting' },
		{ id: 'current_player', name: 'You', status: 'waiting' }
	],
	format: 'Single Elimination'
	};

	isHost = false;
	currentPlayerReady = false;
	showTournamentRoom();
	showStatus('Joined tournament successfully!', 'success');

	// TODO: Send join tournament request to server
	console.log('Joining tournament:', tournamentId);
}

function showTournamentRoom() {
	if (!currentTournament) return;

	// Update room info
	document.getElementById('roomTitle').textContent = currentTournament.name;
	document.getElementById('roomId').textContent = `ID: ${currentTournament.id}`;
	document.getElementById('tournamentStatus').textContent = currentTournament.status;
	document.getElementById('playerCount').textContent = `${currentTournament.players.length}/${currentTournament.maxPlayers}`;
	document.getElementById('tournamentFormat').textContent = currentTournament.format;
	document.getElementById('maxPlayers').textContent = currentTournament.maxPlayers.toString();

	// Update participants list
	const participantsList = document.getElementById('participantsList');
	participantsList.innerHTML = currentTournament.players.map(player => `
	<div class="participant-item">
		<span class="participant-name">
		${player.name}
		${player.id === 'current_player' ? ' (You)' : ''}
		${isHost && player.id === currentTournament.players[0].id ? ' 👑' : ''}
		</span>
		<span class="participant-status ${player.status === 'ready' ? 'status-ready' : 'status-waiting'}">
		${player.status === 'ready' ? '✅ Ready' : '⏳ Waiting'}
		</span>
	</div>
	`).join('');

	// Show/hide and enable/disable start button for host
	const startBtn = document.getElementById('startTournamentBtn');
	const allPlayersReady = currentTournament.players.length >= 2 &&
							currentTournament.players.every(player => player.status === 'ready');

	if (isHost && currentTournament.players.length >= 2) {
	startBtn.style.display = 'block';
	if (allPlayersReady) {
		startBtn.disabled = false;
		startBtn.textContent = 'Start Tournament';
	} else {
		startBtn.disabled = true;
		startBtn.textContent = 'Waiting for all players to be ready...';
	}
	} else {
	startBtn.style.display = 'none';
	}

	// Update ready button state
	updateReadyButton();

	// Show room
	document.getElementById('tournamentRoom').style.display = 'block';
}

function closeTournamentRoom() {
	document.getElementById('tournamentRoom').style.display = 'none';
	currentTournament = null;
	isHost = false;
	currentPlayerReady = false;
}

function toggleReady() {
	if (!currentTournament) return;

	currentPlayerReady = !currentPlayerReady;

	// Update current player's status in the tournament
	const currentPlayer = currentTournament.players.find(p => p.id === 'current_player');
	if (currentPlayer) {
	currentPlayer.status = currentPlayerReady ? 'ready' : 'waiting';
	}

	// Update UI
	updateReadyButton();
	showTournamentRoom();

	const statusMessage = currentPlayerReady ? 'You are ready!' : 'You are not ready';
	showStatus(statusMessage, currentPlayerReady ? 'success' : 'info');

	// TODO: Send ready state to server
	console.log('Player ready state changed:', currentPlayerReady);
}

function updateReadyButton() {
	const readyBtn = document.getElementById('readyBtn');

	if (currentPlayerReady) {
	readyBtn.textContent = 'Not Ready';
	readyBtn.className = 'btn btn-not-ready';
	} else {
	readyBtn.textContent = 'Mark Ready';
	readyBtn.className = 'btn btn-ready';
	}
}

function startTournament() {
	if (!isHost || !currentTournament) {
	showStatus('Only the host can start the tournament', 'error');
	return;
	}

	const allPlayersReady = currentTournament.players.every(player => player.status === 'ready');
	if (!allPlayersReady) {
	showStatus('All players must be ready before starting', 'error');
	return;
	}

	if (currentTournament.players.length < 2) {
	showStatus('At least 2 players required to start', 'error');
	return;
	}

	currentTournament.status = 'in_progress';
	document.getElementById('tournamentStatus').textContent = 'In Progress';
	document.getElementById('startTournamentBtn').style.display = 'none';
	document.getElementById('readyBtn').style.display = 'none';

	showStatus('Tournament started!', 'success');

	// Generate tournament bracket and start first match
	generateTournamentBracket();

	// TODO: Send start tournament request to server
	console.log('Starting tournament:', currentTournament.id);
}

function generateTournamentBracket() {
	if (!currentTournament) return;

	// Shuffle players for fair matchmaking
	const shuffledPlayers = [...currentTournament.players];
	for (let i = shuffledPlayers.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
	}

	// Create bracket structure
	currentTournament.bracket = {
	round: 1,
	matches: [],
	winners: []
	};

	// Create first round matches
	for (let i = 0; i < shuffledPlayers.length; i += 2) {
	if (i + 1 < shuffledPlayers.length) {
		const match = {
		id: `match_${Math.random().toString(36).substr(2, 9)}`,
		round: 1,
		player1: shuffledPlayers[i],
		player2: shuffledPlayers[i + 1],
		status: 'waiting',
		winner: null
		};
		currentTournament.bracket.matches.push(match);
	}
	}

	showStatus(`Tournament bracket created! ${currentTournament.bracket.matches.length} matches in round 1`, 'success');

	// Start first match after a short delay
	setTimeout(() => {
	startNextMatch();
	}, 2000);
}

function startNextMatch() {
	if (!currentTournament || !currentTournament.bracket) return;

	const nextMatch = currentTournament.bracket.matches.find(match => match.status === 'waiting');

	if (!nextMatch) {
	// Check if tournament is complete
	if (currentTournament.bracket.winners.length === 1) {
		completeTournament();
		return;
	}

	// Create next round
	createNextRound();
	return;
	}

	// Start the match
	nextMatch.status = 'in_progress';
	showStatus(`Starting match: ${nextMatch.player1.name} vs ${nextMatch.player2.name}`, 'info');

	// Check if current player is in this match
	const isCurrentPlayerInMatch = nextMatch.player1.id === 'current_player' || nextMatch.player2.id === 'current_player';

	if (isCurrentPlayerInMatch) {
	// Hide tournament room and start game
	document.getElementById('tournamentRoom').style.display = 'none';

	// Start the game with tournament data
	if (window.onTournamentMatchStart) {
		window.onTournamentMatchStart({
		tournamentId: currentTournament.id,
		matchId: nextMatch.id,
		opponent: nextMatch.player1.id === 'current_player' ? nextMatch.player2 : nextMatch.player1,
		isHost: isHost
		});
	}
	} else {
	// Simulate match for other players
	setTimeout(() => {
		simulateMatchResult(nextMatch);
	}, 5000 + Math.random() * 10000); // 5-15 seconds
	}
}

function simulateMatchResult(match) {
	const winner = Math.random() > 0.5 ? match.player1 : match.player2;
	match.winner = winner;
	match.status = 'completed';
	currentTournament.bracket.winners.push(winner);

	showStatus(`Match completed: ${winner.name} wins!`, 'success');

	// Continue to next match
	setTimeout(() => {
		startNextMatch();
	}, 2000);
}

function createNextRound() {
	if (!currentTournament || !currentTournament.bracket) return;

	const winners = currentTournament.bracket.winners;
	if (winners.length < 2) return;

	currentTournament.bracket.round++;
	currentTournament.bracket.matches = [];
	currentTournament.bracket.winners = [];

	// Create matches for next round
	for (let i = 0; i < winners.length; i += 2) {
	if (i + 1 < winners.length) {
		const match = {
		id: `match_${Math.random().toString(36).substr(2, 9)}`,
		round: currentTournament.bracket.round,
		player1: winners[i],
		player2: winners[i + 1],
		status: 'waiting',
		winner: null
		};
		currentTournament.bracket.matches.push(match);
	}
	}

	showStatus(`Round ${currentTournament.bracket.round} starting!`, 'info');

	setTimeout(() => {
	startNextMatch();
	}, 3000);
}

function completeTournament() {
	if (!currentTournament) return;

	const champion = currentTournament.bracket.winners[0];
	currentTournament.status = 'completed';

	document.getElementById('tournamentStatus').textContent = 'Completed';
	showStatus(`🏆 Tournament Complete! Champion: ${champion.name}`, 'success');

	console.log('Tournament completed:', currentTournament.id, 'Champion:', champion);
}

function leaveTournament() {
	if (!currentTournament) return;

	showStatus('Left tournament', 'info');
	currentPlayerReady = false;
	closeTournamentRoom();

	// TODO: Send leave tournament request to server
	console.log('Leaving tournament:', currentTournament.id);
}

function showStatus(message, type = 'info') {
	const statusEl = document.getElementById('tournamentStatus');
	const statusHTML = `<div class="status-message status-${type}">${message}</div>`;
	statusEl.innerHTML = statusHTML;

	// Auto-hide after 3 seconds
	setTimeout(() => {
	if (statusEl.innerHTML === statusHTML) {
		statusEl.innerHTML = '';
	}
	}, 3000);
}

// Custom Room Management
let customRooms = new Map(); // Store custom rooms
let currentCustomRoom = null;
let isCustomRoomHost = false;

function createCustomRoom() {
	const roomId = 'ROOM-' + Math.random().toString(36).substr(2, 8).toUpperCase();

	// Create new custom room
	const newRoom = {
		id: roomId,
		name: 'Custom Room',
		type: 'custom',
		status: 'waiting',
		maxPlayers: 2, // Default for custom 1v1
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

	customRooms.set(roomId, newRoom);
	currentCustomRoom = newRoom;
	isCustomRoomHost = true;

	showCustomRoomInterface();
	showStatus('Custom room created successfully!', 'success');

	console.log('🏠 Custom room created:', roomId);
	return roomId;
}

function joinCustomRoom(roomId) {
	if (!roomId) {
		const inputRoomId = document.getElementById('customRoomId')?.value?.trim();
		if (!inputRoomId) {
			showStatus('Please enter a valid Room ID', 'error');
			return;
		}
		roomId = inputRoomId;
	}

	// Mock joining (in real implementation, this would be a server request)
	const room = customRooms.get(roomId);
	if (!room) {
		// Create mock room for demonstration
		const mockRoom = {
			id: roomId,
			name: 'Joined Custom Room',
			type: 'custom',
			status: 'waiting',
			maxPlayers: 2,
			host: 'other_player',
			players: [
				{ id: 'other_player', name: 'Host', status: 'ready', isHost: true },
				{ id: 'current_player', name: 'You', status: 'waiting', isHost: false }
			],
			gameSettings: {
				gameMode: 'custom',
				maxScore: 5,
				ballSpeed: 1.0,
				paddleSpeed: 1.0,
				difficulty: 'normal'
			},
			createdAt: Date.now() - 30000
		};
		customRooms.set(roomId, mockRoom);
		currentCustomRoom = mockRoom;
		isCustomRoomHost = false;
	} else if (room.players.length >= room.maxPlayers) {
		showStatus('Room is full', 'error');
		return;
	} else {
		// Add player to existing room
		room.players.push({
			id: 'current_player',
			name: 'You',
			status: 'waiting',
			isHost: false
		});
		currentCustomRoom = room;
		isCustomRoomHost = false;
	}

	showCustomRoomInterface();
	showStatus('Joined custom room successfully!', 'success');

	console.log('🚪 Joined custom room:', roomId);
}

function showCustomRoomInterface() {
	if (!currentCustomRoom) return;

	// Hide other UI elements
	const tournamentRoom = document.getElementById('tournamentRoom');
	if (tournamentRoom) {
		tournamentRoom.style.display = 'none';
	}

	// Create or show custom room interface
	let customRoomEl = document.getElementById('customRoomInterface');
	if (!customRoomEl) {
		customRoomEl = createCustomRoomInterface();
		document.body.appendChild(customRoomEl);
	}

	updateCustomRoomDisplay();
	customRoomEl.style.display = 'block';
}

function createCustomRoomInterface() {
	const roomInterface = document.createElement('div');
	roomInterface.id = 'customRoomInterface';
	roomInterface.className = 'tournament-room'; // Reuse tournament room styling
	roomInterface.innerHTML = `
		<button class="close-btn" onclick="closeCustomRoom()">&times;</button>

		<div class="tournament-header">
			<div class="tournament-title" id="customRoomTitle">Custom Room</div>
			<div class="tournament-id" id="customRoomId">ID: ROOM-12345</div>
		</div>

		<div class="tournament-info">
			<div class="info-item">
				<div class="info-label">Status</div>
				<div class="info-value" id="customRoomStatus">Waiting</div>
			</div>
			<div class="info-item">
				<div class="info-label">Players</div>
				<div class="info-value" id="customRoomPlayerCount">0/2</div>
			</div>
			<div class="info-item">
				<div class="info-label">Game Mode</div>
				<div class="info-value">Custom 1v1</div>
			</div>
			<div class="info-item">
				<div class="info-label">Max Score</div>
				<div class="info-value" id="customRoomMaxScore">5</div>
			</div>
		</div>

		<div class="participants-list">
			<div class="participants-title">👥 Players</div>
			<div id="customRoomPlayersList">
				<!-- Players will be populated here -->
			</div>
		</div>

		<div class="tournament-info" id="gameSettingsPanel" style="margin-top: 15px;">
			<div class="participants-title">⚙️ Game Settings</div>
			<div class="info-item">
				<div class="info-label">Max Score</div>
				<select id="maxScoreSelect" onchange="updateGameSetting('maxScore', this.value)" ${!isCustomRoomHost ? 'disabled' : ''}>
					<option value="3">3 Points</option>
					<option value="5" selected>5 Points</option>
					<option value="7">7 Points</option>
					<option value="10">10 Points</option>
				</select>
			</div>
			<div class="info-item">
				<div class="info-label">Ball Speed</div>
				<select id="ballSpeedSelect" onchange="updateGameSetting('ballSpeed', this.value)" ${!isCustomRoomHost ? 'disabled' : ''}>
					<option value="0.5">Slow</option>
					<option value="1.0" selected>Normal</option>
					<option value="1.5">Fast</option>
					<option value="2.0">Very Fast</option>
				</select>
			</div>
			<div class="info-item">
				<div class="info-label">Paddle Speed</div>
				<select id="paddleSpeedSelect" onchange="updateGameSetting('paddleSpeed', this.value)" ${!isCustomRoomHost ? 'disabled' : ''}>
					<option value="0.5">Slow</option>
					<option value="1.0" selected>Normal</option>
					<option value="1.5">Fast</option>
					<option value="2.0">Very Fast</option>
				</select>
			</div>
		</div>

		<div class="tournament-actions">
			<button class="btn btn-primary" id="customRoomReadyBtn" onclick="toggleCustomRoomReady()">
				Mark Ready
			</button>
			<button class="btn btn-success" id="startCustomGameBtn" onclick="startCustomGame()" style="display: none;">
				Start Game
			</button>
			<button class="btn btn-warning" onclick="leaveCustomRoom()">
				Leave Room
			</button>
		</div>
	`;

	return roomInterface;
}

function updateCustomRoomDisplay() {
	if (!currentCustomRoom) return;

	// Update room info
	document.getElementById('customRoomTitle').textContent = currentCustomRoom.name;
	document.getElementById('customRoomId').textContent = `ID: ${currentCustomRoom.id}`;
	document.getElementById('customRoomStatus').textContent = currentCustomRoom.status;
	document.getElementById('customRoomPlayerCount').textContent = `${currentCustomRoom.players.length}/${currentCustomRoom.maxPlayers}`;
	document.getElementById('customRoomMaxScore').textContent = currentCustomRoom.gameSettings.maxScore;

	// Update players list
	const playersList = document.getElementById('customRoomPlayersList');
	playersList.innerHTML = currentCustomRoom.players.map(player => `
		<div class="participant-item">
			<span class="participant-name">
				${player.name}
				${player.isHost ? ' 👑' : ''}
			</span>
			<span class="participant-status ${player.status === 'ready' ? 'status-ready' : 'status-waiting'}">
				${player.status === 'ready' ? '✅ Ready' : '⏳ Waiting'}
			</span>
		</div>
	`).join('');

	// Update game settings
	document.getElementById('maxScoreSelect').value = currentCustomRoom.gameSettings.maxScore;
	document.getElementById('ballSpeedSelect').value = currentCustomRoom.gameSettings.ballSpeed;
	document.getElementById('paddleSpeedSelect').value = currentCustomRoom.gameSettings.paddleSpeed;

	// Update ready button
	updateCustomRoomReadyButton();

	// Update start button
	updateCustomRoomStartButton();
}

function updateCustomRoomReadyButton() {
	const currentPlayer = currentCustomRoom.players.find(p => p.id === 'current_player');
	const readyBtn = document.getElementById('customRoomReadyBtn');

	if (currentPlayer && readyBtn) {
		if (currentPlayer.status === 'ready') {
			readyBtn.textContent = 'Not Ready';
			readyBtn.className = 'btn btn-not-ready';
		} else {
			readyBtn.textContent = 'Mark Ready';
			readyBtn.className = 'btn btn-ready';
		}
	}
}

function updateCustomRoomStartButton() {
	const startBtn = document.getElementById('startCustomGameBtn');
	if (!startBtn) return;

	const allPlayersReady = currentCustomRoom.players.length >= 2 &&
	                       currentCustomRoom.players.every(player => player.status === 'ready');

	if (isCustomRoomHost && currentCustomRoom.players.length >= 2) {
		startBtn.style.display = 'block';
		if (allPlayersReady) {
			startBtn.disabled = false;
			startBtn.textContent = 'Start Game';
		} else {
			startBtn.disabled = true;
			startBtn.textContent = 'Waiting for all players to be ready...';
		}
	} else {
		startBtn.style.display = 'none';
	}
}

function toggleCustomRoomReady() {
	if (!currentCustomRoom) return;

	const currentPlayer = currentCustomRoom.players.find(p => p.id === 'current_player');
	if (!currentPlayer) return;

	currentPlayer.status = currentPlayer.status === 'ready' ? 'waiting' : 'ready';

	updateCustomRoomDisplay();

	const statusMessage = currentPlayer.status === 'ready' ? 'You are ready!' : 'You are not ready';
	showStatus(statusMessage, currentPlayer.status === 'ready' ? 'success' : 'info');

	console.log('🎯 Player ready state changed:', currentPlayer.status);
}

function updateGameSetting(setting, value) {
	if (!isCustomRoomHost || !currentCustomRoom) {
		showStatus('Only the host can change game settings', 'error');
		return;
	}

	currentCustomRoom.gameSettings[setting] = parseFloat(value) || value;
	updateCustomRoomDisplay();

	showStatus(`Game setting updated: ${setting} = ${value}`, 'info');
	console.log('⚙️ Game setting updated:', setting, value);
}

function startCustomGame() {
	if (!isCustomRoomHost || !currentCustomRoom) {
		showStatus('Only the host can start the game', 'error');
		return;
	}

	const allPlayersReady = currentCustomRoom.players.every(player => player.status === 'ready');
	if (!allPlayersReady) {
		showStatus('All players must be ready before starting', 'error');
		return;
	}

	if (currentCustomRoom.players.length < 2) {
		showStatus('At least 2 players required to start', 'error');
		return;
	}

	currentCustomRoom.status = 'in_progress';
	showStatus('Starting custom game...', 'success');

	// Close custom room interface
	closeCustomRoom();

	// Start the game with custom settings
	const gameData = {
		roomId: currentCustomRoom.id,
		gameSettings: currentCustomRoom.gameSettings,
		players: currentCustomRoom.players,
		isHost: isCustomRoomHost
	};

	startGameWithMode("custom", gameData);
	console.log('🎮 Custom game started:', gameData);
}

function leaveCustomRoom() {
	if (!currentCustomRoom) return;

	showStatus('Left custom room', 'info');
	closeCustomRoom();

	console.log('🚪 Left custom room:', currentCustomRoom.id);
}

function closeCustomRoom() {
	const customRoomEl = document.getElementById('customRoomInterface');
	if (customRoomEl) {
		customRoomEl.style.display = 'none';
	}

	currentCustomRoom = null;
	isCustomRoomHost = false;
}

// Manuel katılımcı ekleme fonksiyonları
function showAddParticipantDialog() {
    // Basit bir prompt ile katılımcı ekleme
    const playerName = prompt('Katılımcı adını girin:');
    if (playerName && playerName.trim()) {
        const playerData = {
            id: 'manual_' + Date.now(),
            name: playerName.trim()
        };

        // Hangi mod aktifse ona göre ekle
        if (currentTournament) {
            addParticipantToTournament(playerData);
        } else if (currentCustomRoom) {
            addParticipantToCustomRoom(playerData);
        } else {
            showStatus('Aktif bir oda veya turnuva bulunamadı!', 'error');
        }
    }
}

// Turnuvaya katılımcı ekleme
function addParticipantToTournament(playerData)
{
    if (!currentTournament)
	{
        console.log('❌ Aktif turnuva bulunamadı');
        return false;
    }

    if (currentTournament.players.length >= currentTournament.maxPlayers)
	{
        showStatus('Turnuva dolu! Maksimum katılımcı sayısına ulaşıldı.', 'error');
        return false;
    }

    const existingPlayer = currentTournament.players.find(p => p.id === playerData.id);
    if (existingPlayer)
	{
        showStatus('Bu oyuncu zaten turnuvada!', 'warning');
        return false;
    }

    const newParticipant = {
        id: playerData.id || 'player_' + Date.now(),
        name: playerData.name || 'Anonim Oyuncu',
        status: 'waiting',
        isHost: false,
        joinedAt: Date.now()
    };

    currentTournament.players.push(newParticipant);
    showTournamentRoom();
    showStatus(`${newParticipant.name} turnuvaya katıldı!`, 'success');

    console.log('✅ Katılımcı eklendi:', newParticipant);
    return true;
}

// Custom room'a katılımcı ekleme
function addParticipantToCustomRoom(playerData) {
    if (!currentCustomRoom) {
        console.log('❌ Aktif custom room bulunamadı');
        return false;
    }

    if (currentCustomRoom.players.length >= currentCustomRoom.maxPlayers) {
        showStatus('Oda dolu! Maksimum oyuncu sayısına ulaşıldı.', 'error');
        return false;
    }

    const existingPlayer = currentCustomRoom.players.find(p => p.id === playerData.id);
    if (existingPlayer) {
        showStatus('Bu oyuncu zaten odada!', 'warning');
        return false;
    }

    const newParticipant = {
        id: playerData.id || 'player_' + Date.now(),
        name: playerData.name || 'Anonim Oyuncu',
        status: 'waiting',
        isHost: false,
        joinedAt: Date.now()
    };

    currentCustomRoom.players.push(newParticipant);
    updateCustomRoomDisplay();
    showStatus(`${newParticipant.name} odaya katıldı!`, 'success');

    console.log('✅ Oyuncu custom room\'a eklendi:', newParticipant);
    return true;
}

// Simülasyon amaçlı rastgele katılımcı ekleme
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

    if (currentTournament) {
        addParticipantToTournament(playerData);
    } else if (currentCustomRoom) {
        addParticipantToCustomRoom(playerData);
    } else {
        showStatus('Aktif bir oda veya turnuva bulunamadı!', 'error');
    }
}

// Katılımcı çıkarma fonksiyonu
function removeParticipant(playerId) {
    if (currentTournament) {
        const playerIndex = currentTournament.players.findIndex(p => p.id === playerId);
        if (playerIndex > -1) {
            const removedPlayer = currentTournament.players.splice(playerIndex, 1)[0];
            showTournamentRoom();
            showStatus(`${removedPlayer.name} turnuvadan çıkarıldı.`, 'info');
        }
    } else if (currentCustomRoom) {
        const playerIndex = currentCustomRoom.players.findIndex(p => p.id === playerId);
        if (playerIndex > -1) {
            const removedPlayer = currentCustomRoom.players.splice(playerIndex, 1)[0];
            updateCustomRoomDisplay();
            showStatus(`${removedPlayer.name} odadan çıkarıldı.`, 'info');
        }
    }
}

// Export functions to global scope for HTML onclick handlers
window.localGameStart = localGameStart;
window.aiGameStart = aiGameStart;
window.customGameStart = customGameStart;
window.joinGame = joinGame;

// Export tournament-related functions
window.tournamentGameStart = tournamentGameStart;
window.onTournamentMatchStart = onTournamentMatchStart;
window.onGameEnd = onGameEnd;
window.exitGame = exitGame;
window.createTournament = createTournament;
window.joinTournament = joinTournament;
window.showTournamentRoom = showTournamentRoom;
window.closeTournamentRoom = closeTournamentRoom;
window.toggleReady = toggleReady;
window.startTournament = startTournament;
window.leaveTournament = leaveTournament;
window.showStatus = showStatus;

// Export custom room functions to global scope
window.createCustomRoom = createCustomRoom;
window.joinCustomRoom = joinCustomRoom;
window.showCustomRoomInterface = showCustomRoomInterface;
window.closeCustomRoom = closeCustomRoom;
window.toggleCustomRoomReady = toggleCustomRoomReady;
window.updateGameSetting = updateGameSetting;
window.startCustomGame = startCustomGame;
window.leaveCustomRoom = leaveCustomRoom;
// Export participant management functions
window.showAddParticipantDialog = showAddParticipantDialog;
window.addParticipantToTournament = addParticipantToTournament;
window.addParticipantToCustomRoom = addParticipantToCustomRoom;
window.addRandomParticipant = addRandomParticipant;
window.removeParticipant = removeParticipant;

// Export game state for other modules
window.gameState = gameState;
