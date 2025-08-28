/**
 * RoomUi - Handles room-related UI operations and interfaces
 * Manages custom rooms, tournaments, and their respective interfaces
 * Receives data from App and updates UI accordingly
 */
class RoomUi extends EventTarget
{
	constructor()
	{
		super();

		// Room states
		this.customRooms = new Map();
		this.currentCustomRoom = null;
		this.isCustomRoomHost = false;

		// Tournament states
		this.currentTournament = null;
		this.isHost = false;
		this.currentPlayerReady = false;

		// References to DOM elements
		this.elements = {
			uiOverlay: null,
			tournamentRoom: null,
			customRoomInterface: null
		};

		this._initializeElements();
	}

	_initializeElements()
	{
		// Cache frequently used DOM elements
		this.elements.uiOverlay = document.querySelector('.ui-overlay');
		this.elements.tournamentRoom = document.getElementById('tournamentRoom');
	}

	// ================================
	// ROOM DATA MANAGEMENT (FROM APP)
	// ================================

	/**
	 * Update room data from App
	 * @param {Object} roomData - Room data from server/App
	 */
	updateRoomData(roomData)
	{
		if (!roomData) return;

		if (roomData.type === 'custom') {
			this.currentCustomRoom = roomData;
			this.customRooms.set(roomData.id, roomData);

			// Check if current player is host
			this.isCustomRoomHost = roomData.players?.some(p =>
				p.id === 'current_player' && p.isHost
			) || false;

			this._updateCustomRoomDisplay();
		} else if (roomData.type === 'tournament') {
			this.currentTournament = roomData;

			// Check if current player is host
			this.isHost = roomData.players?.some(p =>
				p.id === 'current_player' && p.isHost
			) || false;

			this._updateTournamentDisplay();
		}

		// Emit event for external listeners
		this.dispatchEvent(new CustomEvent('roomDataUpdated', {
			detail: { roomData }
		}));
	}

	/**
	 * Set player ready status
	 * @param {boolean} isReady - Ready status
	 */
	setPlayerReady(isReady)
	{
		this.currentPlayerReady = isReady;
		this._updateReadyButtons();
	}

	// ================================
	// CUSTOM ROOM MANAGEMENT
	// ================================

	/**
	 * Create a new custom room
	 * @param {Object} roomData - Room configuration data from App
	 */
	createCustomRoom(roomData)
	{
		if (!roomData || !roomData.id) {
			throw new Error('Room data with ID is required');
		}

		this.customRooms.set(roomData.id, roomData);
		this.currentCustomRoom = roomData;
		this.isCustomRoomHost = true;

		this.showCustomRoomInterface();
		this.showStatus('Custom room created successfully!', 'success');

		console.log('🏠 Custom room created:', roomData.id);

		// Emit event for App
		this.dispatchEvent(new CustomEvent('customRoomCreated', {
			detail: { roomId: roomData.id, roomData }
		}));

		return roomData.id;
	}

	/**
	 * Join an existing custom room
	 * @param {string} roomId - Room ID to join
	 */
	joinCustomRoom(roomId)
	{
		if (!roomId) {
			const inputRoomId = document.getElementById('customRoomId')?.value?.trim();
			if (!inputRoomId) {
				this.showStatus('Please enter a room ID', 'error');
				return;
			}
			roomId = inputRoomId;
		}

		// Emit event to App to handle server communication
		this.dispatchEvent(new CustomEvent('joinCustomRoomRequested', {
			detail: { roomId }
		}));

		// For now, create mock room for demonstration
		if (!this.customRooms.has(roomId)) {
			const mockRoom = this._createMockCustomRoom(roomId);
			this.customRooms.set(roomId, mockRoom);
		}

		const room = this.customRooms.get(roomId);
		if (room.players.length >= room.maxPlayers) {
			this.showStatus('Room is full!', 'error');
			return;
		}

		// Check if player already in room
		const existingPlayer = room.players.find(p => p.id === 'current_player');
		if (!existingPlayer) {
			room.players.push({
				id: 'current_player',
				name: 'You',
				status: 'waiting',
				isHost: false
			});
		}

		this.currentCustomRoom = room;
		this.isCustomRoomHost = false;

		this.showCustomRoomInterface();
		this.showStatus('Joined custom room successfully!', 'success');

		console.log('🚪 Joined custom room:', roomId);
	}

	/**
	 * Create mock room data for demonstration
	 */
	_createMockCustomRoom(roomId)
	{
		return {
			id: roomId,
			name: 'Joined Custom Room',
			type: 'custom',
			status: 'waiting',
			maxPlayers: 2,
			host: 'other_player',
			players: [
				{ id: 'other_player', name: 'Host', status: 'ready', isHost: true }
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
	}

	/**
	 * Show custom room interface
	 */
	showCustomRoomInterface()
	{
		if (!this.currentCustomRoom) return;

		// Hide other interfaces
		this._hideAllInterfaces();

		// Create or show custom room interface
		let customRoomEl = document.getElementById('customRoomInterface');
		if (!customRoomEl) {
			customRoomEl = this._createCustomRoomInterface();
			document.body.appendChild(customRoomEl);
		}

		this.elements.customRoomInterface = customRoomEl;
		this._updateCustomRoomDisplay();
		customRoomEl.style.display = 'block';
	}

	/**
	 * Create custom room interface HTML
	 */
	_createCustomRoomInterface()
	{
		const roomInterface = document.createElement('div');
		roomInterface.id = 'customRoomInterface';
		roomInterface.className = 'tournament-room';
		roomInterface.innerHTML = `
			<button class="close-btn" onclick="window.roomUi.closeCustomRoom()">&times;</button>

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
					<select id="maxScoreSelect" onchange="window.roomUi.updateGameSetting('maxScore', this.value)">
						<option value="3">3 Points</option>
						<option value="5" selected>5 Points</option>
						<option value="7">7 Points</option>
						<option value="10">10 Points</option>
					</select>
				</div>
				<div class="info-item">
					<div class="info-label">Ball Speed</div>
					<select id="ballSpeedSelect" onchange="window.roomUi.updateGameSetting('ballSpeed', this.value)">
						<option value="0.5">Slow</option>
						<option value="1.0" selected>Normal</option>
						<option value="1.5">Fast</option>
						<option value="2.0">Very Fast</option>
					</select>
				</div>
				<div class="info-item">
					<div class="info-label">Paddle Speed</div>
					<select id="paddleSpeedSelect" onchange="window.roomUi.updateGameSetting('paddleSpeed', this.value)">
						<option value="0.5">Slow</option>
						<option value="1.0" selected>Normal</option>
						<option value="1.5">Fast</option>
						<option value="2.0">Very Fast</option>
					</select>
				</div>
			</div>

			<div class="tournament-actions">
				<button class="btn btn-primary" id="customRoomReadyBtn" onclick="window.roomUi.toggleCustomRoomReady()">
					Mark Ready
				</button>
				<button class="btn btn-success" id="startCustomGameBtn" onclick="window.roomUi.startCustomGame()" style="display: none;">
					Start Game
				</button>
				<button class="btn btn-warning" onclick="window.roomUi.leaveCustomRoom()">
					Leave Room
				</button>
			</div>
		`;

		return roomInterface;
	}

	/**
	 * Update custom room display with current data
	 */
	_updateCustomRoomDisplay()
	{
		if (!this.currentCustomRoom) return;

		// Update room info
		const titleEl = document.getElementById('customRoomTitle');
		const idEl = document.getElementById('customRoomId');
		const statusEl = document.getElementById('customRoomStatus');
		const playerCountEl = document.getElementById('customRoomPlayerCount');
		const maxScoreEl = document.getElementById('customRoomMaxScore');

		if (titleEl) titleEl.textContent = this.currentCustomRoom.name;
		if (idEl) idEl.textContent = `ID: ${this.currentCustomRoom.id}`;
		if (statusEl) statusEl.textContent = this.currentCustomRoom.status;
		if (playerCountEl) playerCountEl.textContent = `${this.currentCustomRoom.players.length}/${this.currentCustomRoom.maxPlayers}`;
		if (maxScoreEl) maxScoreEl.textContent = this.currentCustomRoom.gameSettings.maxScore;

		// Update players list
		const playersList = document.getElementById('customRoomPlayersList');
		if (playersList) {
			playersList.innerHTML = this.currentCustomRoom.players.map(player => `
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
		}

		// Update game settings
		const maxScoreSelect = document.getElementById('maxScoreSelect');
		const ballSpeedSelect = document.getElementById('ballSpeedSelect');
		const paddleSpeedSelect = document.getElementById('paddleSpeedSelect');

		if (maxScoreSelect) {
			maxScoreSelect.value = this.currentCustomRoom.gameSettings.maxScore;
			maxScoreSelect.disabled = !this.isCustomRoomHost;
		}
		if (ballSpeedSelect) {
			ballSpeedSelect.value = this.currentCustomRoom.gameSettings.ballSpeed;
			ballSpeedSelect.disabled = !this.isCustomRoomHost;
		}
		if (paddleSpeedSelect) {
			paddleSpeedSelect.value = this.currentCustomRoom.gameSettings.paddleSpeed;
			paddleSpeedSelect.disabled = !this.isCustomRoomHost;
		}

		// Update buttons
		this._updateCustomRoomButtons();
	}

	/**
	 * Update custom room button states
	 */
	_updateCustomRoomButtons()
	{
		const currentPlayer = this.currentCustomRoom.players.find(p => p.id === 'current_player');
		const readyBtn = document.getElementById('customRoomReadyBtn');
		const startBtn = document.getElementById('startCustomGameBtn');

		// Update ready button
		if (currentPlayer && readyBtn) {
			if (currentPlayer.status === 'ready') {
				readyBtn.textContent = 'Not Ready';
				readyBtn.className = 'btn btn-warning';
			} else {
				readyBtn.textContent = 'Mark Ready';
				readyBtn.className = 'btn btn-primary';
			}
		}

		// Update start button
		if (startBtn) {
			const allPlayersReady = this.currentCustomRoom.players.length >= 2 &&
								   this.currentCustomRoom.players.every(player => player.status === 'ready');

			if (this.isCustomRoomHost && this.currentCustomRoom.players.length >= 2) {
				startBtn.style.display = 'block';
				if (allPlayersReady) {
					startBtn.disabled = false;
					startBtn.textContent = 'Start Game';
				} else {
					startBtn.disabled = true;
					startBtn.textContent = 'Waiting for players...';
				}
			} else {
				startBtn.style.display = 'none';
			}
		}
	}

	/**
	 * Toggle custom room ready status
	 */
	toggleCustomRoomReady()
	{
		if (!this.currentCustomRoom) return;

		const currentPlayer = this.currentCustomRoom.players.find(p => p.id === 'current_player');
		if (!currentPlayer) return;

		currentPlayer.status = currentPlayer.status === 'ready' ? 'waiting' : 'ready';
		this._updateCustomRoomDisplay();

		const statusMessage = currentPlayer.status === 'ready' ? 'You are ready!' : 'You are not ready';
		this.showStatus(statusMessage, currentPlayer.status === 'ready' ? 'success' : 'info');

		// Emit event to App for server communication
		this.dispatchEvent(new CustomEvent('playerReadyChanged', {
			detail: {
				roomId: this.currentCustomRoom.id,
				playerId: 'current_player',
				isReady: currentPlayer.status === 'ready'
			}
		}));

		console.log('🎯 Player ready state changed:', currentPlayer.status);
	}

	/**
	 * Update game setting (host only)
	 */
	updateGameSetting(setting, value)
	{
		if (!this.isCustomRoomHost || !this.currentCustomRoom) {
			this.showStatus('Only the host can change game settings', 'error');
			return;
		}

		this.currentCustomRoom.gameSettings[setting] = parseFloat(value) || value;
		this._updateCustomRoomDisplay();

		this.showStatus(`Game setting updated: ${setting} = ${value}`, 'info');

		// Emit event to App for server communication
		this.dispatchEvent(new CustomEvent('gameSettingChanged', {
			detail: {
				roomId: this.currentCustomRoom.id,
				setting,
				value
			}
		}));

		console.log('⚙️ Game setting updated:', setting, value);
	}

	/**
	 * Start custom game (host only)
	 */
	startCustomGame()
	{
		if (!this.isCustomRoomHost || !this.currentCustomRoom) {
			this.showStatus('Only the host can start the game', 'error');
			return;
		}

		const allPlayersReady = this.currentCustomRoom.players.every(player => player.status === 'ready');
		if (!allPlayersReady) {
			this.showStatus('All players must be ready before starting', 'error');
			return;
		}

		if (this.currentCustomRoom.players.length < 2) {
			this.showStatus('At least 2 players required to start', 'error');
			return;
		}

		this.currentCustomRoom.status = 'in_progress';
		this.showStatus('Starting custom game...', 'success');

		// Emit game start event
		const gameData = {
			roomId: this.currentCustomRoom.id,
			gameSettings: this.currentCustomRoom.gameSettings,
			players: this.currentCustomRoom.players,
			isHost: this.isCustomRoomHost
		};

		this.dispatchEvent(new CustomEvent('customGameStarted', {
			detail: gameData
		}));

		// Close interface
		this.closeCustomRoom();

		console.log('🎮 Custom game started:', gameData);
	}

	/**
	 * Leave custom room
	 */
	leaveCustomRoom()
	{
		if (!this.currentCustomRoom) return;

		const roomId = this.currentCustomRoom.id;
		this.showStatus('Left custom room', 'info');

		// Emit event to App
		this.dispatchEvent(new CustomEvent('customRoomLeft', {
			detail: { roomId }
		}));

		this.closeCustomRoom();
		console.log('🚪 Left custom room:', roomId);
	}

	/**
	 * Close custom room interface
	 */
	closeCustomRoom()
	{
		const customRoomEl = document.getElementById('customRoomInterface');
		if (customRoomEl) {
			customRoomEl.style.display = 'none';
		}

		this.currentCustomRoom = null;
		this.isCustomRoomHost = false;
	}

	// ================================
	// TOURNAMENT MANAGEMENT
	// ================================

	/**
	 * Create a new tournament
	 */
	createTournament()
	{
		const tournamentId = 'TOUR-' + Math.random().toString(36).substr(2, 8).toUpperCase();

		this.currentTournament = {
			id: tournamentId,
			name: 'New Tournament',
			type: 'tournament',
			status: 'waiting',
			maxPlayers: 8,
			players: [
				{ id: 'current_player', name: 'You', status: 'waiting', isHost: true }
			],
			format: 'Single Elimination'
		};

		this.isHost = true;
		this.currentPlayerReady = false;

		this.showTournamentRoom();
		this.showStatus('Tournament created successfully!', 'success');

		// Emit event to App
		this.dispatchEvent(new CustomEvent('tournamentCreated', {
			detail: { tournamentId, tournament: this.currentTournament }
		}));

		console.log('Creating tournament:', tournamentId);
		return tournamentId;
	}

	/**
	 * Join an existing tournament
	 */
	joinTournament()
	{
		const tournamentId = document.getElementById('customTournamentId')?.value?.trim();
		if (!tournamentId) {
			this.showStatus('Please enter a tournament ID', 'error');
			return;
		}

		// Emit event to App for server communication
		this.dispatchEvent(new CustomEvent('joinTournamentRequested', {
			detail: { tournamentId }
		}));

		// Mock tournament join for demonstration
		this.currentTournament = {
			id: tournamentId,
			name: 'Joined Tournament',
			type: 'tournament',
			status: 'waiting',
			maxPlayers: 8,
			players: [
				{ id: 'player1', name: 'Host', status: 'ready', isHost: true },
				{ id: 'player2', name: 'Player 2', status: 'waiting', isHost: false },
				{ id: 'current_player', name: 'You', status: 'waiting', isHost: false }
			],
			format: 'Single Elimination'
		};

		this.isHost = false;
		this.currentPlayerReady = false;

		this.showTournamentRoom();
		this.showStatus('Joined tournament successfully!', 'success');

		console.log('Joining tournament:', tournamentId);
		return tournamentId;
	}

	/**
	 * Show tournament room interface
	 */
	showTournamentRoom()
	{
		if (!this.currentTournament) return;

		// Hide other interfaces
		this._hideAllInterfaces();

		// Use existing tournament room from HTML
		const tournamentRoom = this.elements.tournamentRoom;
		if (tournamentRoom) {
			this._updateTournamentDisplay();
			tournamentRoom.style.display = 'block';
		}
	}

	/**
	 * Update tournament display with current data
	 */
	_updateTournamentDisplay()
	{
		if (!this.currentTournament) return;

		// Update tournament info
		const titleEl = document.getElementById('roomTitle');
		const idEl = document.getElementById('roomId');
		const statusEl = document.getElementById('tournamentStatus');
		const playerCountEl = document.getElementById('playerCount');
		const formatEl = document.getElementById('tournamentFormat');
		const maxPlayersEl = document.getElementById('maxPlayers');

		if (titleEl) titleEl.textContent = this.currentTournament.name;
		if (idEl) idEl.textContent = `ID: ${this.currentTournament.id}`;
		if (statusEl) statusEl.textContent = this.currentTournament.status;
		if (playerCountEl) playerCountEl.textContent = `${this.currentTournament.players.length}/${this.currentTournament.maxPlayers}`;
		if (formatEl) formatEl.textContent = this.currentTournament.format;
		if (maxPlayersEl) maxPlayersEl.textContent = this.currentTournament.maxPlayers.toString();

		// Update participants list
		const participantsList = document.getElementById('participantsList');
		if (participantsList) {
			participantsList.innerHTML = this.currentTournament.players.map(player => `
				<div class="participant-item">
					<span class="participant-name">
						${player.name}
						${player.id === 'current_player' ? ' (You)' : ''}
						${this.isHost && player.isHost ? ' 👑' : ''}
					</span>
					<span class="participant-status ${player.status === 'ready' ? 'status-ready' : 'status-waiting'}">
						${player.status === 'ready' ? '✅ Ready' : '⏳ Waiting'}
					</span>
				</div>
			`).join('');
		}

		// Update buttons
		this._updateTournamentButtons();
	}

	/**
	 * Update tournament button states
	 */
	_updateTournamentButtons()
	{
		const startBtn = document.getElementById('startTournamentBtn');
		const readyBtn = document.getElementById('readyBtn');

		// Update start button for host
		if (startBtn) {
			const allPlayersReady = this.currentTournament.players.length >= 2 &&
								   this.currentTournament.players.every(player => player.status === 'ready');

			if (this.isHost && this.currentTournament.players.length >= 2) {
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
		}

		// Update ready button
		this._updateReadyButtons();
	}

	/**
	 * Update ready button states
	 */
	_updateReadyButtons()
	{
		const readyBtn = document.getElementById('readyBtn');
		if (readyBtn) {
			if (this.currentPlayerReady) {
				readyBtn.textContent = 'Not Ready';
				readyBtn.className = 'btn btn-warning';
			} else {
				readyBtn.textContent = 'Mark Ready';
				readyBtn.className = 'btn btn-primary';
			}
		}
	}

	/**
	 * Toggle tournament ready status
	 */
	toggleReady()
	{
		if (!this.currentTournament) return;

		this.currentPlayerReady = !this.currentPlayerReady;

		// Update current player's status in the tournament
		const currentPlayer = this.currentTournament.players.find(p => p.id === 'current_player');
		if (currentPlayer) {
			currentPlayer.status = this.currentPlayerReady ? 'ready' : 'waiting';
		}

		// Update UI
		this._updateTournamentDisplay();

		const statusMessage = this.currentPlayerReady ? 'You are ready!' : 'You are not ready';
		this.showStatus(statusMessage, this.currentPlayerReady ? 'success' : 'info');

		// Emit event to App for server communication
		this.dispatchEvent(new CustomEvent('playerReadyChanged', {
			detail: {
				tournamentId: this.currentTournament.id,
				playerId: 'current_player',
				isReady: this.currentPlayerReady
			}
		}));

		console.log('Player ready state changed:', this.currentPlayerReady);
	}

	/**
	 * Start tournament (host only)
	 */
	startTournament()
	{
		if (!this.isHost || !this.currentTournament) {
			this.showStatus('Only the host can start the tournament', 'error');
			return;
		}

		const allPlayersReady = this.currentTournament.players.every(player => player.status === 'ready');
		if (!allPlayersReady) {
			this.showStatus('All players must be ready before starting', 'error');
			return;
		}

		if (this.currentTournament.players.length < 2) {
			this.showStatus('At least 2 players required to start', 'error');
			return;
		}

		this.currentTournament.status = 'in_progress';
		this._updateTournamentDisplay();

		this.showStatus('Tournament started!', 'success');

		// Emit event to App
		this.dispatchEvent(new CustomEvent('tournamentStarted', {
			detail: { tournamentId: this.currentTournament.id, tournament: this.currentTournament }
		}));

		console.log('Starting tournament:', this.currentTournament.id);
	}

	/**
	 * Leave tournament
	 */
	leaveTournament()
	{
		if (!this.currentTournament) return;

		const tournamentId = this.currentTournament.id;
		this.showStatus('Left tournament', 'info');

		// Emit event to App
		this.dispatchEvent(new CustomEvent('tournamentLeft', {
			detail: { tournamentId }
		}));

		this.closeTournamentRoom();
		console.log('Leaving tournament:', tournamentId);
	}

	/**
	 * Close tournament room interface
	 */
	closeTournamentRoom()
	{
		if (this.elements.tournamentRoom) {
			this.elements.tournamentRoom.style.display = 'none';
		}

		this.currentTournament = null;
		this.isHost = false;
		this.currentPlayerReady = false;
	}

	// ================================
	// UI UTILITY FUNCTIONS
	// ================================

	/**
	 * Hide game UI overlay
	 */
	hideGameUI()
	{
		if (this.elements.uiOverlay) {
			this.elements.uiOverlay.style.display = 'none';
		}
	}

	/**
	 * Show game UI overlay
	 */
	showGameUI()
	{
		if (this.elements.uiOverlay) {
			this.elements.uiOverlay.style.display = 'flex';
		}
	}

	/**
	 * Show status message
	 * @param {string} message - Status message
	 * @param {string} type - Message type (success, error, warning, info)
	 */
	showStatus(message, type = 'info')
	{
		// Create or update status display
		let statusEl = document.getElementById('roomUiStatus');
		if (!statusEl) {
			statusEl = document.createElement('div');
			statusEl.id = 'roomUiStatus';
			statusEl.style.cssText = `
				position: fixed;
				top: 20px;
				left: 50%;
				transform: translateX(-50%);
				padding: 10px 20px;
				border-radius: 8px;
				z-index: 2000;
				max-width: 400px;
				text-align: center;
				font-weight: 500;
			`;
			document.body.appendChild(statusEl);
		}

		// Set status style based on type
		const colors = {
			success: { bg: 'rgba(0, 255, 0, 0.9)', color: 'white' },
			error: { bg: 'rgba(255, 0, 0, 0.9)', color: 'white' },
			warning: { bg: 'rgba(255, 165, 0, 0.9)', color: 'white' },
			info: { bg: 'rgba(0, 123, 255, 0.9)', color: 'white' }
		};

		const style = colors[type] || colors.info;
		statusEl.style.background = style.bg;
		statusEl.style.color = style.color;
		statusEl.textContent = message;
		statusEl.style.display = 'block';

		// Auto-hide after 3 seconds
		setTimeout(() => {
			if (statusEl && statusEl.textContent === message) {
				statusEl.style.display = 'none';
			}
		}, 3000);

		// Emit status event
		this.dispatchEvent(new CustomEvent('statusMessage', {
			detail: { message, type }
		}));
	}

	/**
	 * Show error message
	 * @param {string} message - Error message
	 */
	showGameError(message)
	{
		this.showStatus(message, 'error');
	}

	/**
	 * Hide all room interfaces
	 */
	_hideAllInterfaces()
	{
		// Hide tournament room
		if (this.elements.tournamentRoom) {
			this.elements.tournamentRoom.style.display = 'none';
		}

		// Hide custom room interface
		const customRoomInterface = document.getElementById('customRoomInterface');
		if (customRoomInterface) {
			customRoomInterface.style.display = 'none';
		}
	}

	// ================================
	// PUBLIC GETTERS
	// ================================

	/**
	 * Get current custom room data
	 */
	getCurrentRoom()
	{
		return this.currentCustomRoom;
	}

	/**
	 * Get current tournament data
	 */
	getCurrentTournament()
	{
		return this.currentTournament;
	}

	/**
	 * Check if current player is host
	 */
	isCurrentlyHost()
	{
		return this.isHost || this.isCustomRoomHost;
	}

	/**
	 * Get player ready status
	 */
	getPlayerReadyStatus()
	{
		return this.currentPlayerReady;
	}
}

export default RoomUi;
