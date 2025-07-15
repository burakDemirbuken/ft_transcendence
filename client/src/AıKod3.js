// ==============================================
// CORE SYSTEM CLASSES
// ==============================================

class ArcadeMachine {
	constructor(id, scene, position = { x: 0, y: 0, z: 0 }) {
		this.id = id;
		this.scene = scene;
		this.position = position;
		this.mesh = null;
		this.gameScreen = null;
		this.screenMaterial = null;
		this.isActive = false;
	}

	async load() {
		const result = await BABYLON.SceneLoader.ImportMeshAsync("", "./models/", "ArcadeMachine.obj", this.scene);
		this.mesh = result.meshes[0];

		// Pozisyon ayarla
		this.mesh.position = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z);
		this.mesh.scaling = new BABYLON.Vector3(1, 1, 1);

		// Oyun ekranı oluştur
		this.createGameScreen();

		return this;
	}

	createGameScreen() {
		const screenWidth = 1024;
		const screenHeight = 512;

		this.gameScreen = new BABYLON.DynamicTexture(`gameScreen_${this.id}`, {
			width: screenWidth,
			height: screenHeight
		}, this.scene);

		// Ekran materyali
		this.screenMaterial = new BABYLON.StandardMaterial(`screenMaterial_${this.id}`, this.scene);
		this.screenMaterial.diffuseTexture = this.gameScreen;
		this.screenMaterial.emissiveTexture = this.gameScreen;

		// Ekran mesh'ini bul
		const screenMesh = this.scene.getMeshByName(`Screen_${this.id}`) || this.mesh.getChildMeshes()[0];
		if (screenMesh) {
			screenMesh.material = this.screenMaterial;
		}
	}

	getScreenContext() {
		return this.gameScreen.getContext();
	}

	updateScreen() {
		this.gameScreen.update();
	}

	setActive(active) {
		this.isActive = active;
		// Aktif olmayan makineleri solgun göster
		if (this.screenMaterial) {
			this.screenMaterial.alpha = active ? 1.0 : 0.5;
		}
	}

	dispose() {
		if (this.gameScreen) {
			this.gameScreen.dispose();
		}
		if (this.screenMaterial) {
			this.screenMaterial.dispose();
		}
		if (this.mesh) {
			this.mesh.dispose();
		}
	}
}

class GameCore {
	constructor() {
		this.engine = null;
		this.scene = null;
		this.camera = null;
		this.arcadeMachines = new Map();
		this.isInitialized = false;
		this.viewMode = 'single'; // 'single', 'multiple', 'tournament'
	}

	async initialize(canvas) {
		// Babylon.js engine ve scene kurulumu
		this.engine = new BABYLON.Engine(canvas, true);
		this.scene = new BABYLON.Scene(this.engine);

		// Kamera kurulumu
		this.setupCamera();

		// Işık kurulumu
		const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);

		this.isInitialized = true;

		// Render loop
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});

		// Resize handling
		window.addEventListener("resize", () => {
			this.engine.resize();
		});
	}

	setupCamera() {
		// Kamera pozisyonu view mode'a göre ayarlanacak
		this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 5, -10), this.scene);
		this.camera.setTarget(BABYLON.Vector3.Zero());
		this.camera.attachToCanvas(this.engine.getRenderingCanvas(), true);
	}

	async setViewMode(mode, machineCount = 1) {
		this.viewMode = mode;

		// Mevcut makineleri temizle
		this.clearMachines();

		switch (mode) {
			case 'single':
				await this.setupSingleMachine();
				break;
			case 'multiple':
				await this.setupMultipleMachines(machineCount);
				break;
			case 'tournament':
				await this.setupTournamentMachines(machineCount);
				break;
		}

		this.adjustCameraForMode();
	}

	async setupSingleMachine() {
		const machine = new ArcadeMachine('main', this.scene, { x: 0, y: 0, z: 0 });
		await machine.load();
		machine.setActive(true);
		this.arcadeMachines.set('main', machine);
	}

	async setupMultipleMachines(count) {
		const spacing = 8; // Makineler arası mesafe
		const startX = -(count - 1) * spacing / 2;

		for (let i = 0; i < count; i++) {
			const machine = new ArcadeMachine(`machine_${i}`, this.scene, {
				x: startX + i * spacing,
				y: 0,
				z: 0
			});
			await machine.load();
			machine.setActive(i === 0); // İlk makine aktif
			this.arcadeMachines.set(`machine_${i}`, machine);
		}
	}

	async setupTournamentMachines(count) {
		// Turnuva için dairesel yerleşim
		const radius = 15;
		const angleStep = (Math.PI * 2) / count;

		for (let i = 0; i < count; i++) {
			const angle = i * angleStep;
			const x = Math.cos(angle) * radius;
			const z = Math.sin(angle) * radius;

			const machine = new ArcadeMachine(`tournament_${i}`, this.scene, { x, y: 0, z });
			await machine.load();

			// Merkeze doğru bak
			machine.mesh.rotation.y = angle + Math.PI;

			machine.setActive(false); // Başlangıçta hepsi pasif
			this.arcadeMachines.set(`tournament_${i}`, machine);
		}
	}

	adjustCameraForMode() {
		switch (this.viewMode) {
			case 'single':
				this.camera.position = new BABYLON.Vector3(0, 5, -10);
				this.camera.setTarget(BABYLON.Vector3.Zero());
				break;
			case 'multiple':
				const machineCount = this.arcadeMachines.size;
				this.camera.position = new BABYLON.Vector3(0, 8, -15 - machineCount * 2);
				this.camera.setTarget(BABYLON.Vector3.Zero());
				break;
			case 'tournament':
				this.camera.position = new BABYLON.Vector3(0, 25, -5);
				this.camera.setTarget(BABYLON.Vector3.Zero());
				break;
		}
	}

	getMachine(id) {
		return this.arcadeMachines.get(id);
	}

	setActiveMachine(id) {
		this.arcadeMachines.forEach((machine, machineId) => {
			machine.setActive(machineId === id);
		});
	}

	clearMachines() {
		this.arcadeMachines.forEach(machine => {
			machine.dispose();
		});
		this.arcadeMachines.clear();
	}

	dispose() {
		this.clearMachines();
		this.engine.dispose();
	}
}

// ==============================================
// NETWORK MANAGER
// ==============================================

class NetworkManager {
	constructor() {
		this.socket = null;
		this.isConnected = false;
		this.serverUrl = 'ws://localhost:3000';
		this.callbacks = new Map();
	}

	connect(url = this.serverUrl) {
		this.socket = new WebSocket(url);

		this.socket.onopen = () => {
			this.isConnected = true;
			this.triggerCallback('connected');
		};

		this.socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			this.handleMessage(data);
		};

		this.socket.onclose = () => {
			this.isConnected = false;
			this.triggerCallback('disconnected');
		};

		this.socket.onerror = (error) => {
			this.triggerCallback('error', error);
		};
	}

	handleMessage(data) {
		const { type, payload } = data;
		this.triggerCallback(type, payload);
	}

	send(type, payload) {
		if (this.isConnected) {
			this.socket.send(JSON.stringify({ type, payload }));
		}
	}

	on(event, callback) {
		if (!this.callbacks.has(event)) {
			this.callbacks.set(event, []);
		}
		this.callbacks.get(event).push(callback);
	}

	off(event, callback) {
		if (this.callbacks.has(event)) {
			const callbacks = this.callbacks.get(event);
			const index = callbacks.indexOf(callback);
			if (index > -1) {
				callbacks.splice(index, 1);
			}
		}
	}

	triggerCallback(event, data) {
		if (this.callbacks.has(event)) {
			this.callbacks.get(event).forEach(callback => callback(data));
		}
	}

	disconnect() {
		if (this.socket) {
			this.socket.close();
		}
	}
}

// ==============================================
// GAME STATE MANAGER
// ==============================================

class GameStateManager
{
	constructor()
	{
		this.currentState = 'menu';
		this.gameData = null;
		this.players = [];
		this.ball = null;
		this.score = { player1: 0, player2: 0 };
		this.gameMode = null;
		this.callbacks = new Map();
	}

	setState(newState)
	{
		const oldState = this.currentState;
		this.currentState = newState;
		this.triggerCallback('stateChanged', { oldState, newState });
	}

	updateGameData(data)
	{
		this.gameData = data;

		// Oyun verilerini güncelle
		if (data.players) this.players = data.players;
		if (data.ball) this.ball = data.ball;
		if (data.score) this.score = data.score;
		if (data.gameMode) this.gameMode = data.gameMode;

		this.triggerCallback('gameDataUpdated', data);
	}

	getGameData()
	{
		return {
			players: this.players,
			ball: this.ball,
			score: this.score,
			gameMode: this.gameMode,
			currentState: this.currentState
		};
	}

	on(event, callback)
	{
		if (!this.callbacks.has(event))
			this.callbacks.set(event, []);
		this.callbacks.get(event).push(callback);
	}

	triggerCallback(event, data)
	{
		if (this.callbacks.has(event))
			this.callbacks.get(event).forEach(callback => callback(data));
	}
}

// ==============================================
// RENDERER CLASS
// ==============================================

class GameRenderer
{
	constructor(gameCore)
	{
		this.gameCore = gameCore;
		this.screenWidth = 1024;
		this.screenHeight = 512;
		this.colors = {
			background: '#000000',
			paddle: '#FFFFFF',
			ball: '#FFFFFF',
			text: '#FFFFFF',
			accent: '#00FF00'
		};
	}

	initialize()
	{
		// Renderer artık birden fazla makine destekliyor
	}

	renderGame(gameData, machineId = 'main')
	{
		const machine = this.gameCore.getMachine(machineId);
		if (!machine) return;

		const ctx = machine.getScreenContext();
		this.clearScreen(ctx);

		// Oyuncuları çiz
		if (gameData.players)
		{
			gameData.players.forEach(
				player =>
				{
					this.renderPaddle(ctx, player);
				});
		}

		// Topu çiz
		if (gameData.ball)
			this.renderBall(ctx, gameData.ball);
		if (gameData.score)
			this.renderScore(ctx, gameData.score);

		this.renderCenterLine(ctx);

		machine.updateScreen();
	}

	renderMultipleGames(gamesData)
	{
		// Birden fazla oyun verisi varsa
		gamesData.forEach(
			(gameData, index) =>
			{
				const machineId = `machine_${index}`;
				this.renderGame(gameData, machineId);
			});
	}

	renderTournament(tournamentData) {
		// Turnuva verisi
		if (tournamentData.matches) {
			tournamentData.matches.forEach((match, index) => {
				const machineId = `tournament_${index}`;

				if (match.isActive) {
					this.gameCore.setActiveMachine(machineId);
					this.renderGame(match.gameData, machineId);
				} else {
					this.renderWaitingScreen(`Maç ${index + 1}`, machineId);
				}
			});
		}
	}

	clearScreen(ctx) {
		ctx.fillStyle = this.colors.background;
		ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
	}

	renderPaddle(ctx, player) {
		ctx.fillStyle = this.colors.paddle;
		ctx.fillRect(player.x, player.y, player.width, player.height);
	}

	renderBall(ctx, ball) {
		ctx.fillStyle = this.colors.ball;
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
		ctx.fill();
	}

	renderScore(ctx, score) {
		ctx.fillStyle = this.colors.text;
		ctx.font = '48px Arial';
		ctx.textAlign = 'center';

		// Sol oyuncu skoru
		ctx.fillText(score.player1, this.screenWidth / 4, 60);

		// Sağ oyuncu skoru
		ctx.fillText(score.player2, (this.screenWidth * 3) / 4, 60);
	}

	renderCenterLine(ctx) {
		ctx.strokeStyle = this.colors.text;
		ctx.setLineDash([10, 10]);
		ctx.beginPath();
		ctx.moveTo(this.screenWidth / 2, 0);
		ctx.lineTo(this.screenWidth / 2, this.screenHeight);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	renderMenu(menuData, machineId = 'main')
	{
		const machine = this.gameCore.getMachine(machineId);
		if (!machine) return;

		const ctx = machine.getScreenContext();
		this.clearScreen(ctx);

		ctx.fillStyle = this.colors.text;
		ctx.font = '64px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('PONG', this.screenWidth / 2, 100);

		// Frontend'den gelen menü verileri
		if (menuData && menuData.length > 0) {
			ctx.font = '32px Arial';
			menuData.forEach((item, index) => {
				ctx.fillText(item, this.screenWidth / 2, 200 + index * 60);
			});
		}

		machine.updateScreen();
	}

	renderWaitingScreen(message, machineId = 'main')
	{
		const machine = this.gameCore.getMachine(machineId);
		if (!machine) return;

		const ctx = machine.getScreenContext();
		this.clearScreen(ctx);

		ctx.fillStyle = this.colors.text;
		ctx.font = '32px Arial';
		ctx.textAlign = 'center';
		ctx.fillText(message || 'Oyuncu Bekleniyor...', this.screenWidth / 2, this.screenHeight / 2);

		machine.updateScreen();
	}
}

// ==============================================
// GAME MODES
// ==============================================

class GameModeBase
{
	constructor(networkManager, gameStateManager)
	{
		this.networkManager = networkManager;
		this.gameStateManager = gameStateManager;
		this.isActive = false;
	}

	activate()
	{
		this.isActive = true;
		this.setupEventListeners();
	}

	deactivate()
	{
		this.isActive = false;
		this.removeEventListeners();
	}

	setupEventListeners()
	{
		// Alt sınıflarda override edilecek
	}

	removeEventListeners()
	{
		// Alt sınıflarda override edilecek
	}
}

class SameDeviceMode extends GameModeBase
{
	constructor(networkManager, gameStateManager)
	{
		super(networkManager, gameStateManager);
		this.player1Keys = { up: 'KeyW', down: 'KeyS' };
		this.player2Keys = { up: 'ArrowUp', down: 'ArrowDown' };
	}

	setupEventListeners()
	{
		document.addEventListener('keydown', this.handleKeyDown.bind(this));
		document.addEventListener('keyup', this.handleKeyUp.bind(this));
	}

	removeEventListeners()
	{
		document.removeEventListener('keydown', this.handleKeyDown.bind(this));
		document.removeEventListener('keyup', this.handleKeyUp.bind(this));
	}

	handleKeyDown(event)
	{
		if (!this.isActive) return;

		const keyCode = event.code;
		let player = null;
		let direction = null;

		if (keyCode === this.player1Keys.up)
		{
			player = 1;
			direction = 'up';
		}
		else if (keyCode === this.player1Keys.down)
		{
			player = 1;
			direction = 'down';
		}
		else if (keyCode === this.player2Keys.up)
		{
			player = 2;
			direction = 'up';
		}
		else if (keyCode === this.player2Keys.down)
		{
			player = 2;
			direction = 'down';
		}

		if (player && direction) {
			this.networkManager.send('move', { player, direction });
		}
	}

	handleKeyUp(event)
	{
		if (!this.isActive) return;

		const keyCode = event.code;
		let player = null;

		if (keyCode === this.player1Keys.up || keyCode === this.player1Keys.down)
			player = 1;
		else if (keyCode === this.player2Keys.up || keyCode === this.player2Keys.down)
			player = 2;

		if (player) {
			this.networkManager.send('move', { player, direction: 'stop' });
		}
	}
}

class MultiDeviceMode extends GameModeBase
{
	constructor(networkManager, gameStateManager)
	{
		super(networkManager, gameStateManager);
		this.playerId = null;
		this.playerKeys = { up: 'ArrowUp', down: 'ArrowDown' };
	}

	setupEventListeners()
	{
		document.addEventListener('keydown', this.handleKeyDown.bind(this));
		document.addEventListener('keyup', this.handleKeyUp.bind(this));
	}

	removeEventListeners()
	{
		document.removeEventListener('keydown', this.handleKeyDown.bind(this));
		document.removeEventListener('keyup', this.handleKeyUp.bind(this));
	}

	setPlayerId(id)
	{
		this.playerId = id;
	}

	handleKeyDown(event)
	{
		if (!this.isActive || !this.playerId) return;

		const keyCode = event.code;
		let direction = null;

		if (keyCode === this.playerKeys.up)
			direction = 'up';
		else if (keyCode === this.playerKeys.down)
			direction = 'down';

		if (direction)
			this.networkManager.send('move', { player: this.playerId, direction });
	}

	handleKeyUp(event)
	{
		if (!this.isActive || !this.playerId) return;

		const keyCode = event.code;

		if (keyCode === this.playerKeys.up || keyCode === this.playerKeys.down) {
			this.networkManager.send('move', { player: this.playerId, direction: 'stop' });
		}
	}
}

class TournamentMode extends GameModeBase
{
	constructor(networkManager, gameStateManager)
	{
		super(networkManager, gameStateManager);
		this.tournamentData = null;
		this.currentMatch = null;
	}

	setupEventListeners()
	{
		this.networkManager.on('tournamentUpdate', this.handleTournamentUpdate.bind(this));
		this.networkManager.on('matchStart', this.handleMatchStart.bind(this));
	}

	removeEventListeners()
	{
		this.networkManager.off('tournamentUpdate', this.handleTournamentUpdate.bind(this));
		this.networkManager.off('matchStart', this.handleMatchStart.bind(this));
	}

	handleTournamentUpdate(data)
	{
		this.tournamentData = data;
		this.gameStateManager.updateGameData(data);
	}

	handleMatchStart(data)
	{
		this.currentMatch = data;
		this.gameStateManager.setState('playing');
	}

	joinTournament()
	{
		this.networkManager.send('joinTournament');
	}
}

// ==============================================
// MAIN GAME CLIENT
// ==============================================

class PongClient
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

	async initialize()
	{
		await this.gameCore.initialize(this.canvas);
		this.renderer.initialize();
		this.setupEventListeners();
		this.gameStateManager.setState('ready');
	}

	setupEventListeners()
	{
		// Network events
		this.networkManager.on('connected',
			() =>
			{
				console.log('Sunucuya bağlandı');
			});

		this.networkManager.on('gameUpdate',
			(data) =>
			{
				this.gameStateManager.updateGameData(data);
				this.renderer.renderGame(data);
			});

		this.networkManager.on('gameStart',
			(data) =>
			{
				this.gameStateManager.setState('playing');
				this.gameStateManager.updateGameData(data);
			});

		this.networkManager.on('gameEnd',
			(data) =>
			{
				this.gameStateManager.setState('gameOver');
			});

		this.networkManager.on('menuData',
			(data) =>
			{
				this.gameStateManager.setState('menu');
				this.renderer.renderMenu(data.menuItems);
			});

		this.networkManager.on('gameMode',
			(data) =>
			{
				this.setGameMode(data.mode, data.options);
			});

		// State changes
		this.gameStateManager.on('stateChanged',
			(data) =>
			{
				this.handleStateChange(data);
			});
	}

	handleStateChange(data)
	{
		const { oldState, newState } = data;

		switch (newState)
		{
			case 'ready':
				this.renderer.renderWaitingScreen('Hazır...');
				break;
			case 'menu':
				// Menu frontend'den gelecek
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

// ==============================================
// USAGE EXAMPLE
// ==============================================

// Kullanım örneği:
/*
const client = new PongClient('gameCanvas');

client.initialize().then(() => {
	client.connectToServer('ws://localhost:3000');

	// Tek makine - Normal oyun
	client.setGameMode('sameDevice');

	// Çoklu makine - Multiplayer
	client.setGameMode('multiDevice', { machineCount: 3, playerId: 1 });

	// Turnuva - Dairesel yerleşim
	client.setGameMode('tournament', { machineCount: 8 });

	// Endpoint'ten oyun modu bilgisi alma
	client.setGameModeFromAPI('/api/game-mode');
});

// API Response örnekleri:
// Single: { gameMode: 'sameDevice' }
// Multiple: { gameMode: 'multiDevice', options: { machineCount: 4, playerId: 2 } }
// Tournament: { gameMode: 'tournament', options: { machineCount: 8 } }

// Server'dan gelen veri örnekleri:
// Tek oyun: { type: 'gameUpdate', payload: { players: [...], ball: {...} } }
// Çoklu oyun: { type: 'multipleGamesUpdate', payload: [gameData1, gameData2, ...] }
// Turnuva: { type: 'tournamentUpdate', payload: { matches: [...] } }
*/
