import NetworkManager from './network/NetworkManager.js';
import GameRenderer from "./GameRenderer.js";
import RoomUi from './RoomUi.js';

//!
import localGameConfig from './json/LocalConfig.js';
import InputManager from './input/InputManager.js';
import rendererConfig from './json/rendererConfig.js';





class App
{
	constructor()
	{
		this.playerId = this._TEST_generateRandomId();
		this.playerName = this._TEST_generateRandomName();
		this.gameRenderer = new GameRenderer();
		this.networkManager = new NetworkManager(window.location.hostname, 3000);
		this.roomUi = new RoomUi();
		this.inputManager = new InputManager();

		this._setupNetworkListeners();
		this._gameControllerSetup();
	}
	//* Kaldım: server kısmındaki dataların gönderimi tamamlandı. Şimdi client tarafında bu dataların işlenmesi ve local game in başlatılması gerekiyor.

	_gameControllerSetup()
	{
		this.inputManager.onKey("w",
			() =>
			{
				this.gameRenderer.joystickMove(1, 'up');
				this.networkManager.send('game/playerAction', {key: "w", action: true});
			},
			() =>
			{
				this.gameRenderer.joystickMove(1, 'neutral');
				this.networkManager.send('game/playerAction', {key: "w", action: false});
			}
		);
		this.inputManager.onKey("s",
			() =>
			{
				this.gameRenderer.joystickMove(1, 'down');
				this.networkManager.send('game/playerAction', {key: "s", action: true});
			},
			() =>
			{
				this.gameRenderer.joystickMove(1, 'neutral');
				this.networkManager.send('game/playerAction', {key: "s", action: false});
			}
		);
		// Arrow keys for same player (alternative controls)
		this.inputManager.onKey("ArrowUp",
			() => this.networkManager.send('game/playerAction', {key: "ArrowUp", action: true}),
			() => this.networkManager.send('game/playerAction', {key: "ArrowUp", action: false})
		);

		this.inputManager.onKey("ArrowDown",
			() => this.networkManager.send('game/playerAction', {key: "ArrowDown", action: true}),
			() => this.networkManager.send('game/playerAction', {key: "ArrowDown", action: false})
		);

		this.inputManager.onKey("escape",
			() => this.networkManager.send('game/playerAction', {key: "escape", action: true}),
			() => this.networkManager.send('game/playerAction', {key: "escape", action: false})
		);
	}

	_setupNetworkListeners()
	{
		this.networkManager.onConnect(() =>
		{
			console.log('✅ Connected to server');
		});

		this.networkManager.onMessage((data) =>
		{
			// Defensive programming: ensure data has the expected structure
			if (!data || typeof data !== 'object') {
				console.error('❌ Received invalid message format:', data);
				return;
			}

			if (!data.type) {
				console.error('❌ Received message without type field:', data);
				return;
			}

			this.handleNetworkEvent(data.type, data.payload);
		});

		this.networkManager.onClose((event) =>
		{
			console.log('🔌 Disconnected from server:', event.code, event.reason);
		});

		this.networkManager.onError((error) =>
		{
			console.error('❌ Network error:', error);
		});

		this.networkManager.connect({ id: this.playerId, name: this.playerName });
	}

	localGame()
	{
		this._createRoom("local");
	}

	aiGame()
	{
		this.loadGame("ai");
	}

	customGame()
	{
		this._createRoom('classic');
	}

	joinCustomRoom()
	{

	}

	startGame()
	{
		this.networkManager.send('room/startGame');
	}

	readyState(readyState)
	{
		this.networkManager.send('room/setReady', {isReady: readyState });
	}

	_createRoom(mode)
	{
		if (!this.networkManager.isConnect())
			throw new Error('Not connected to server');
		const data = {
			name: `${this.playerName}'s Room`,
			gameMode: mode,
			host: this.playerId,
			gameSettings: localGameConfig.gameSettings
		};
		this.networkManager.send('room/create', data);
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

	loadGame(gameConfig)
	{
		this.gameRenderer.initialize(gameConfig).then(() =>
		{
			console.log('✅ Game initialized successfully');
			this.gameClient.startGame();
		})
		.catch((error) =>
		{
			console.error('❌ Error initializing game:', error);
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
		const [event, subEvent] = eventType.split('/');

		switch (event)
		{
			case 'room':
				this._handleRoomEvent(subEvent, data);
				break;
			case 'game':
				this._handleGameEvent(subEvent, data);
				break;
			case 'error':
				this.roomUi.showGameError(data || 'Unknown error from server');
				break;
			default:
				console.log('Unhandled network event:', eventType, data);
		}
	}

	_handleRoomEvent(subEvent, data)
	{
		switch (subEvent)
		{
			case 'created':
				this.networkManager.send('room/join', { roomId: data.roomId });
			default:
				console.log('Unhandled room event:', subEvent, data);
		}
	}

	_handleGameEvent(subEvent, data)
	{
		switch (subEvent)
		{
			/*
{
	type: "config",

	payload:
	{
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
				width: 10,
			}
		},
	}
};
*/
			case 'started':
				this.gameRenderer.initialize({
						canvasId: "renderCanvas",
						gameMode: data.gameMode,
						renderConfig: rendererConfig,
						arcade: localGameConfig.arcade
					}).then(
					() =>
					{
						// servera init edildiğini bildir
					}).catch((error) =>
					{
						console.error('❌ Error initializing game renderer:', error);
					}
				);
				this.roomUi.showGameUI();

				break;
			default:
				console.log('Unhandled game event:', subEvent, data);
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
export default App;
