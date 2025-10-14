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
	WwupdateRoomData(roomData)
	{
		if (!roomData) return;

		try {
			// Normalize server data to ensure consistency
			const normalizedData = this._normalizeServerData(roomData);

			if (normalizedData.type === 'custom') {
				this.currentCustomRoom = normalizedData;
				this.customRooms.set(normalizedData.id, normalizedData);

				// Check if current player is host
				this.isCustomRoomHost = normalizedData.players?.some(p =>
					p.id === 'current_player' && p.isHost
				) || false;

				this._updateCustomRoomDisplay();
			} else if (normalizedData.type === 'tournament') {
				this.currentTournament = normalizedData;

				// Check if current player is host
				this.isHost = normalizedData.players?.some(p =>
					p.id === 'current_player' && p.isHost
				) || false;

				this._updateTournamentDisplay();
			}

			// Update player ready status if available
			const currentPlayer = normalizedData.players?.find(p => p.id === 'current_player');
			if (currentPlayer) {
				this.currentPlayerReady = currentPlayer.status === 'ready';
			}

			// Emit event for external listeners
			this.dispatchEvent(new CustomEvent('roomDataUpdated', {
				detail: { roomData: normalizedData }
			}));

		} catch (error) {
			console.error('Error updating room data:', error);
			this.showStatus('Error updating room data: ' + error.message, 'error');
		}
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

		// Emit event to App
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
	 * Create mock room data for demonstration (matches server format)
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
				paddleWidth: 10,
				paddleHeight: 100,
				paddleSpeed: 700,
				ballRadius: 7,
				ballSpeed: 600,
				ballSpeedIncrease: 100,
				maxPlayers: 2,
				maxScore: 11
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
						<option value="5">5 Points</option>
						<option value="7">7 Points</option>
						<option value="11" selected>11 Points</option>
						<option value="15">15 Points</option>
						<option value="21">21 Points</option>
					</select>
				</div>
				<div class="info-item">
					<div class="info-label">Ball Speed</div>
					<select id="ballSpeedSelect" onchange="window.roomUi.updateGameSetting('ballSpeed', this.value)">
						<option value="400">Slow</option>
						<option value="600" selected>Normal</option>
						<option value="800">Fast</option>
						<option value="1000">Very Fast</option>
					</select>
				</div>
				<div class="info-item">
					<div class="info-label">Paddle Speed</div>
					<select id="paddleSpeedSelect" onchange="window.roomUi.updateGameSetting('paddleSpeed', this.value)">
						<option value="500">Slow</option>
						<option value="700" selected>Normal</option>
						<option value="900">Fast</option>
						<option value="1200">Very Fast</option>
					</select>
				</div>
				<div class="info-item">
					<div class="info-label">Ball Speed Increase</div>
					<select id="ballSpeedIncreaseSelect" onchange="window.roomUi.updateGameSetting('ballSpeedIncrease', this.value)">
						<option value="50">Low (+50)</option>
						<option value="100" selected>Normal (+100)</option>
						<option value="150">High (+150)</option>
						<option value="200">Very High (+200)</option>
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

		console.log('🔄 Updating custom room display with data:', this.currentCustomRoom);

		// Update room info
		const titleEl = document.getElementById('customRoomTitle');
		const idEl = document.getElementById('customRoomId');
		const statusEl = document.getElementById('customRoomStatus');
		const playerCountEl = document.getElementById('customRoomPlayerCount');
		const maxScoreEl = document.getElementById('customRoomMaxScore');

		if (titleEl) {
			titleEl.textContent = this.currentCustomRoom.name;
			console.log('📝 Room title updated:', this.currentCustomRoom.name);
		}
		if (idEl) {
			idEl.textContent = `ID: ${this.currentCustomRoom.id}`;
			console.log('🆔 Room ID updated:', this.currentCustomRoom.id);
		}
		if (statusEl) {
			statusEl.textContent = this.currentCustomRoom.status;
			console.log('📊 Room status updated:', this.currentCustomRoom.status);
		}
		if (playerCountEl) {
			const playerCountText = `${this.currentCustomRoom.players.length}/${this.currentCustomRoom.maxPlayers}`;
			playerCountEl.textContent = playerCountText;
			console.log('👥 Player count updated:', playerCountText);
		}
		if (maxScoreEl) {
			maxScoreEl.textContent = this.currentCustomRoom.gameSettings.maxScore;
			console.log('🎯 Max score updated:', this.currentCustomRoom.gameSettings.maxScore);
		}

		// Update players list
		const playersList = document.getElementById('customRoomPlayersList');
		if (playersList) {
			console.log('👥 Updating players list:', this.currentCustomRoom.players);
			playersList.innerHTML = this.currentCustomRoom.players.map(player => {
				console.log('👤 Processing player:', player);
				return `
					<div class="participant-item">
						<span class="participant-name">
							${player.name}
							${player.isHost ? ' 👑' : ''}
						</span>
						<span class="participant-status ${player.status === 'ready' ? 'status-ready' : 'status-waiting'}">
							${player.status === 'ready' ? '✅ Ready' : '⏳ Waiting'}
						</span>
					</div>
				`;
			}).join('');
		}

		// Update game settings selects to match server format
		console.log('⚙️ Updating game settings:', this.currentCustomRoom.gameSettings);
		const maxScoreSelect = document.getElementById('maxScoreSelect');
		const ballSpeedSelect = document.getElementById('ballSpeedSelect');
		const paddleSpeedSelect = document.getElementById('paddleSpeedSelect');
		const ballSpeedIncreaseSelect = document.getElementById('ballSpeedIncreaseSelect');

		if (maxScoreSelect) {
			// Clear all selected options first
			Array.from(maxScoreSelect.options).forEach(option => option.selected = false);
			// Set the correct value and select the option
			maxScoreSelect.value = this.currentCustomRoom.gameSettings.maxScore;
			const selectedOption = maxScoreSelect.querySelector(`option[value="${this.currentCustomRoom.gameSettings.maxScore}"]`);
			if (selectedOption) selectedOption.selected = true;
			maxScoreSelect.disabled = !this.isCustomRoomHost;
			console.log('🎯 Max score select updated:', this.currentCustomRoom.gameSettings.maxScore);
		}
		if (ballSpeedSelect) {
			Array.from(ballSpeedSelect.options).forEach(option => option.selected = false);
			ballSpeedSelect.value = this.currentCustomRoom.gameSettings.ballSpeed;
			const selectedOption = ballSpeedSelect.querySelector(`option[value="${this.currentCustomRoom.gameSettings.ballSpeed}"]`);
			if (selectedOption) selectedOption.selected = true;
			ballSpeedSelect.disabled = !this.isCustomRoomHost;
			console.log('⚡ Ball speed select updated:', this.currentCustomRoom.gameSettings.ballSpeed);
		}
		if (paddleSpeedSelect) {
			Array.from(paddleSpeedSelect.options).forEach(option => option.selected = false);
			paddleSpeedSelect.value = this.currentCustomRoom.gameSettings.paddleSpeed;
			const selectedOption = paddleSpeedSelect.querySelector(`option[value="${this.currentCustomRoom.gameSettings.paddleSpeed}"]`);
			if (selectedOption) selectedOption.selected = true;
			paddleSpeedSelect.disabled = !this.isCustomRoomHost;
			console.log('🏓 Paddle speed select updated:', this.currentCustomRoom.gameSettings.paddleSpeed);
		}
		if (ballSpeedIncreaseSelect) {
			Array.from(ballSpeedIncreaseSelect.options).forEach(option => option.selected = false);
			const increaseValue = this.currentCustomRoom.gameSettings.ballSpeedIncrease || 100;
			ballSpeedIncreaseSelect.value = increaseValue;
			const selectedOption = ballSpeedIncreaseSelect.querySelector(`option[value="${increaseValue}"]`);
			if (selectedOption) selectedOption.selected = true;
			ballSpeedIncreaseSelect.disabled = !this.isCustomRoomHost;
			console.log('🚀 Ball speed increase select updated:', increaseValue);
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
		}, 5000);

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
	// SERVER DATA HANDLING
	// ================================

	/**
	 * Validate and normalize server room data
	 * @param {Object} serverData - Raw data from server
	 * @returns {Object} Normalized room data
	 */
	_normalizeServerData(serverData)
	{
		if (!serverData || !serverData.id) {
			throw new Error('Invalid server data: missing room ID');
		}

		// Ensure all required fields exist with defaults
		const normalized = {
			id: serverData.id,
			name: serverData.name || 'Unnamed Room',
			type: serverData.type || 'custom',
			status: serverData.status || 'waiting',
			maxPlayers: serverData.maxPlayers || 2,
			host: serverData.host || null,
			players: Array.isArray(serverData.players) ? serverData.players : [],
			gameSettings: this._normalizeGameSettings(serverData.gameSettings || {}),
			createdAt: serverData.createdAt || Date.now()
		};

		// Validate players array
		normalized.players = normalized.players.map(player => ({
			id: player.id || 'unknown',
			name: player.name || 'Unknown Player',
			status: player.status || 'waiting',
			isHost: Boolean(player.isHost)
		}));

		return normalized;
	}

	/**
	 * Normalize game settings to match server format
	 * @param {Object} settings - Game settings from server
	 * @returns {Object} Normalized game settings
	 */
	_normalizeGameSettings(settings)
	{
		return {
			// Paddle settings
			paddleWidth: settings.paddleWidth || 10,
			paddleHeight: settings.paddleHeight || 100,
			paddleSpeed: settings.paddleSpeed || 700,

			// Ball settings
			ballRadius: settings.ballRadius || 7,
			ballSpeed: settings.ballSpeed || 600,
			ballSpeedIncrease: settings.ballSpeedIncrease || 100,

			// Game settings
			maxPlayers: settings.maxPlayers || 2,
			maxScore: settings.maxScore || 11
		};
	}

	/**
	 * Convert internal setting name to display name
	 * @param {string} settingName - Internal setting name
	 * @returns {string} Display name
	 */
	_getSettingDisplayName(settingName)
	{
		const displayNames = {
			paddleWidth: 'Paddle Width',
			paddleHeight: 'Paddle Height',
			paddleSpeed: 'Paddle Speed',
			ballRadius: 'Ball Size',
			ballSpeed: 'Ball Speed',
			ballSpeedIncrease: 'Ball Speed Increase',
			maxPlayers: 'Max Players',
			maxScore: 'Max Score'
		};

		return displayNames[settingName] || settingName;
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

	/**
	 * Handle server-specific room status updates
	 * @param {string} status - Room status from server
	 * @param {Object} additionalData - Additional status data
	 */
	handleRoomStatusUpdate(status, additionalData = {})
	{
		const statusMessages = {
			'waiting': 'Waiting for players...',
			'in_game': 'Game in progress',
			'completed': 'Game completed',
			'starting': 'Game starting...',
			'paused': 'Game paused',
			'error': 'Room error occurred'
		};

		const message = statusMessages[status] || `Room status: ${status}`;
		const messageType = status === 'error' ? 'error' :
						   status === 'completed' ? 'success' : 'info';

		this.showStatus(message, messageType);

		// Update current room status
		if (this.currentCustomRoom) {
			this.currentCustomRoom.status = status;
			this._updateCustomRoomDisplay();
		}
		if (this.currentTournament) {
			this.currentTournament.status = status;
			this._updateTournamentDisplay();
		}

		// Emit status change event
		this.dispatchEvent(new CustomEvent('roomStatusChanged', {
			detail: { status, additionalData }
		}));

		console.log('🏠 Room status updated:', status, additionalData);
	}

	/**
	 * Handle server errors
	 * @param {string} errorType - Type of error
	 * @param {string} message - Error message
	 * @param {Object} details - Error details
	 */
	handleServerError(errorType, message, details = {})
	{
		const errorMessages = {
			'room_not_found': 'Room not found',
			'room_full': 'Room is full',
			'permission_denied': 'Permission denied',
			'invalid_settings': 'Invalid game settings',
			'network_error': 'Network connection error',
			'timeout': 'Request timeout'
		};

		const displayMessage = errorMessages[errorType] || message || 'An error occurred';
		this.showStatus(displayMessage, 'error');

		// Emit error event for App to handle
		this.dispatchEvent(new CustomEvent('serverError', {
			detail: { errorType, message: displayMessage, details }
		}));

		console.error('🚨 Server error:', errorType, message, details);
	}
}

export default RoomUi;
