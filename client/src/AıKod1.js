// ==============================================
// CORE SYSTEM CLASSES
// ==============================================

class GameCore {
    constructor() {
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.arcadeMachine = null;
        this.gameScreen = null;
        this.isInitialized = false;
    }

    async initialize(canvas) {
        // Babylon.js engine ve scene kurulumu
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(this.engine);

        // Kamera kurulumu
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 5, -10), this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.attachToCanvas(canvas, true);

        // Işık kurulumu
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);

        // Arkade makinesi yükleme
        await this.loadArcadeMachine();

        // Oyun ekranı tekstürü oluşturma
        this.createGameScreen();

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

    async loadArcadeMachine() {
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "./models/", "ArcadeMachine.obj", this.scene);
        this.arcadeMachine = result.meshes[0];

        // Arkade makinesi pozisyonunu ayarla
        this.arcadeMachine.position = new BABYLON.Vector3(0, 0, 0);
        this.arcadeMachine.scaling = new BABYLON.Vector3(1, 1, 1);
    }

    createGameScreen() {
        // Oyun ekranı için dinamik tekstür oluştur
        const screenWidth = 1024;
        const screenHeight = 512;

        this.gameScreen = new BABYLON.DynamicTexture("gameScreen", {
            width: screenWidth,
            height: screenHeight
        }, this.scene);

        // Arkade makinesinin ekran materyalini ayarla
        const screenMaterial = new BABYLON.StandardMaterial("screenMaterial", this.scene);
        screenMaterial.diffuseTexture = this.gameScreen;
        screenMaterial.emissiveTexture = this.gameScreen;

        // Ekran mesh'ini bul ve materyali uygula (mesh ismine göre ayarlanmalı)
        const screenMesh = this.scene.getMeshByName("Screen") || this.arcadeMachine.getChildMeshes()[0];
        if (screenMesh) {
            screenMesh.material = screenMaterial;
        }
    }

    getScreenContext() {
        return this.gameScreen.getContext();
    }

    updateScreen() {
        this.gameScreen.update();
    }

    dispose() {
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

class GameStateManager {
    constructor() {
        this.currentState = 'menu';
        this.gameData = null;
        this.players = [];
        this.ball = null;
        this.score = { player1: 0, player2: 0 };
        this.gameMode = null;
        this.callbacks = new Map();
    }

    setState(newState) {
        const oldState = this.currentState;
        this.currentState = newState;
        this.triggerCallback('stateChanged', { oldState, newState });
    }

    updateGameData(data) {
        this.gameData = data;

        // Oyun verilerini güncelle
        if (data.players) this.players = data.players;
        if (data.ball) this.ball = data.ball;
        if (data.score) this.score = data.score;
        if (data.gameMode) this.gameMode = data.gameMode;

        this.triggerCallback('gameDataUpdated', data);
    }

    getGameData() {
        return {
            players: this.players,
            ball: this.ball,
            score: this.score,
            gameMode: this.gameMode,
            currentState: this.currentState
        };
    }

    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    triggerCallback(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => callback(data));
        }
    }
}

// ==============================================
// RENDERER CLASS
// ==============================================

class GameRenderer {
    constructor(gameCore) {
        this.gameCore = gameCore;
        this.ctx = null;
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

    initialize() {
        this.ctx = this.gameCore.getScreenContext();
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
        this.gameCore.updateScreen();
    }

    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);
    }

    renderGame(gameData) {
        this.clear();

        // Oyuncuları çiz
        if (gameData.players) {
            gameData.players.forEach(player => {
                this.renderPaddle(player);
            });
        }

        // Topu çiz
        if (gameData.ball) {
            this.renderBall(gameData.ball);
        }

        // Skoru çiz
        if (gameData.score) {
            this.renderScore(gameData.score);
        }

        // Orta çizgiyi çiz
        this.renderCenterLine();

        this.gameCore.updateScreen();
    }

    renderPaddle(player) {
        this.ctx.fillStyle = this.colors.paddle;
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    renderBall(ball) {
        this.ctx.fillStyle = this.colors.ball;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderScore(score) {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';

        // Sol oyuncu skoru
        this.ctx.fillText(score.player1, this.screenWidth / 4, 60);

        // Sağ oyuncu skoru
        this.ctx.fillText(score.player2, (this.screenWidth * 3) / 4, 60);
    }

    renderCenterLine() {
        this.ctx.strokeStyle = this.colors.text;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.screenWidth / 2, 0);
        this.ctx.lineTo(this.screenWidth / 2, this.screenHeight);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    renderMenu(menuData) {
        this.clear();

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '64px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PONG', this.screenWidth / 2, 100);

        // Frontend'den gelen menü verileri
        if (menuData && menuData.length > 0) {
            this.ctx.font = '32px Arial';
            menuData.forEach((item, index) => {
                this.ctx.fillText(item, this.screenWidth / 2, 200 + index * 60);
            });
        }

        this.gameCore.updateScreen();
    }

    renderWaitingScreen(message) {
        this.clear();

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message || 'Oyuncu Bekleniyor...', this.screenWidth / 2, this.screenHeight / 2);

        this.gameCore.updateScreen();
    }
}

// ==============================================
// GAME MODES
// ==============================================

class GameModeBase {
    constructor(networkManager, gameStateManager) {
        this.networkManager = networkManager;
        this.gameStateManager = gameStateManager;
        this.isActive = false;
    }

    activate() {
        this.isActive = true;
        this.setupEventListeners();
    }

    deactivate() {
        this.isActive = false;
        this.removeEventListeners();
    }

    setupEventListeners() {
        // Alt sınıflarda override edilecek
    }

    removeEventListeners() {
        // Alt sınıflarda override edilecek
    }
}

class SameDeviceMode extends GameModeBase {
    constructor(networkManager, gameStateManager) {
        super(networkManager, gameStateManager);
        this.player1Keys = { up: 'KeyW', down: 'KeyS' };
        this.player2Keys = { up: 'ArrowUp', down: 'ArrowDown' };
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown(event) {
        if (!this.isActive) return;

        const keyCode = event.code;
        let player = null;
        let direction = null;

        if (keyCode === this.player1Keys.up) {
            player = 1;
            direction = 'up';
        } else if (keyCode === this.player1Keys.down) {
            player = 1;
            direction = 'down';
        } else if (keyCode === this.player2Keys.up) {
            player = 2;
            direction = 'up';
        } else if (keyCode === this.player2Keys.down) {
            player = 2;
            direction = 'down';
        }

        if (player && direction) {
            this.networkManager.send('playerMove', { player, direction, pressed: true });
        }
    }

    handleKeyUp(event) {
        if (!this.isActive) return;

        const keyCode = event.code;
        let player = null;

        if (keyCode === this.player1Keys.up || keyCode === this.player1Keys.down) {
            player = 1;
        } else if (keyCode === this.player2Keys.up || keyCode === this.player2Keys.down) {
            player = 2;
        }

        if (player) {
            this.networkManager.send('playerMove', { player, direction: 'stop', pressed: false });
        }
    }
}

class MultiDeviceMode extends GameModeBase {
    constructor(networkManager, gameStateManager) {
        super(networkManager, gameStateManager);
        this.playerId = null;
        this.playerKeys = { up: 'ArrowUp', down: 'ArrowDown' };
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    }

    setPlayerId(id) {
        this.playerId = id;
    }

    handleKeyDown(event) {
        if (!this.isActive || !this.playerId) return;

        const keyCode = event.code;
        let direction = null;

        if (keyCode === this.playerKeys.up) {
            direction = 'up';
        } else if (keyCode === this.playerKeys.down) {
            direction = 'down';
        }

        if (direction) {
            this.networkManager.send('playerMove', {
                player: this.playerId,
                direction,
                pressed: true
            });
        }
    }

    handleKeyUp(event) {
        if (!this.isActive || !this.playerId) return;

        const keyCode = event.code;

        if (keyCode === this.playerKeys.up || keyCode === this.playerKeys.down) {
            this.networkManager.send('playerMove', {
                player: this.playerId,
                direction: 'stop',
                pressed: false
            });
        }
    }
}

class TournamentMode extends GameModeBase {
    constructor(networkManager, gameStateManager) {
        super(networkManager, gameStateManager);
        this.tournamentData = null;
        this.currentMatch = null;
    }

    setupEventListeners() {
        this.networkManager.on('tournamentUpdate', this.handleTournamentUpdate.bind(this));
        this.networkManager.on('matchStart', this.handleMatchStart.bind(this));
    }

    removeEventListeners() {
        this.networkManager.off('tournamentUpdate', this.handleTournamentUpdate.bind(this));
        this.networkManager.off('matchStart', this.handleMatchStart.bind(this));
    }

    handleTournamentUpdate(data) {
        this.tournamentData = data;
        this.gameStateManager.updateGameData(data);
    }

    handleMatchStart(data) {
        this.currentMatch = data;
        this.gameStateManager.setState('playing');
    }

    joinTournament() {
        this.networkManager.send('joinTournament');
    }
}

// ==============================================
// MAIN GAME CLIENT
// ==============================================

class PongClient {
    constructor(canvasId) {
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

    async initialize() {
        await this.gameCore.initialize(this.canvas);
        this.renderer.initialize();
        this.setupEventListeners();
        this.gameStateManager.setState('ready');
    }

    setupEventListeners() {
        // Network events
        this.networkManager.on('connected', () => {
            console.log('Sunucuya bağlandı');
        });

        this.networkManager.on('gameUpdate', (data) => {
            this.gameStateManager.updateGameData(data);
            this.renderer.renderGame(data);
        });

        this.networkManager.on('gameStart', (data) => {
            this.gameStateManager.setState('playing');
            this.gameStateManager.updateGameData(data);
        });

        this.networkManager.on('gameEnd', (data) => {
            this.gameStateManager.setState('gameOver');
            // Game over ekranını göster
        });

        this.networkManager.on('menuData', (data) => {
            this.gameStateManager.setState('menu');
            this.renderer.renderMenu(data.menuItems);
        });

        this.networkManager.on('gameMode', (data) => {
            this.setGameMode(data.mode, data.options);
        });

        // State changes
        this.gameStateManager.on('stateChanged', (data) => {
            this.handleStateChange(data);
        });
    }

    handleStateChange(data) {
        const { oldState, newState } = data;

        switch (newState) {
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

    connectToServer(url) {
        this.networkManager.connect(url);
    }

    // Endpoint'ten gelen oyun modu bilgisi
    setGameMode(mode, options = {}) {
        if (this.currentGameMode) {
            this.currentGameMode.deactivate();
        }

        this.currentGameMode = this.gameModes[mode];

        if (this.currentGameMode) {
            this.currentGameMode.activate();

            // Çoklu cihaz modunda oyuncu ID'si gerekebilir
            if (mode === 'multiDevice' && options.playerId) {
                this.currentGameMode.setPlayerId(options.playerId);
            }

            this.gameStateManager.setState('waiting');
        }
    }

    // API endpoint'i için public method
    async setGameModeFromAPI(endpoint) {
        try {
            const response = await fetch(endpoint);
            const data = await response.json();

            if (data.gameMode) {
                this.setGameMode(data.gameMode, data.options);
            }
        } catch (error) {
            console.error('Oyun modu alınamadı:', error);
        }
    }

    startGame() {
        this.isRunning = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;

        // Ana oyun döngüsü - çizim sunucudan gelen verilere göre yapılacak
        requestAnimationFrame(() => this.gameLoop());
    }

    dispose() {
        this.isRunning = false;
        if (this.currentGameMode) {
            this.currentGameMode.deactivate();
        }
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

    // Endpoint'ten oyun modu bilgisi alma
    client.setGameModeFromAPI('/api/game-mode');

    // Veya doğrudan oyun modu set etme
    client.setGameMode('sameDevice');

    // Çoklu cihaz için oyuncu ID'si ile
    client.setGameMode('multiDevice', { playerId: 1 });
});

// Frontend'den gelen veriler örneği:
// GET /api/game-mode
// Response: { gameMode: 'sameDevice', options: { playerId: 1 } }

// WebSocket üzerinden menü verileri alma:
// { type: 'menuData', payload: { menuItems: ['Aynı Cihazdan Oyna', 'Farklı Cihazdan Oyna'] } }
*/
