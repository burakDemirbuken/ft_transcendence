import WebSocketClient from './network/WebSocketClient.js';
import GameRenderer from "./GameRenderer.js";
import RoomUi from './RoomUi.js';

//!
import InputManager from './input/InputManager.js';
import rendererConfig from './json/rendererConfig.js';


class App
{
	constructor()
	{
		this.playerId = this._TEST_generateRandomId();
		this.playerName = this._TEST_generateRandomName();
		this.gameRenderer = new GameRenderer();
		this.webSocketClient = new WebSocketClient(window.location.hostname, 3002);
		this.roomUi = new RoomUi();
		this.inputManager = new InputManager();

		this._setupNetworkListeners();
		this._gameControllerSetup();
	}

	_gameControllerSetup()
	{
		this.inputManager.onKey("w",
			() =>
			{
				// this.gameRenderer.joystickMove(1, 'up');
				this.webSocketClient.send('player/playerAction', {key: "w", action: true});
			},
			() =>
			{
				// this.gameRenderer.joystickMove(1, 'neutral');
				this.webSocketClient.send('player/playerAction', {key: "w", action: false});
			}
		);
		this.inputManager.onKey("s",
			() =>
			{
				// this.gameRenderer.joystickMove(1, 'down');
				this.webSocketClient.send('player/playerAction', {key: "s", action: true});
			},
			() =>
			{
				// this.gameRenderer.joystickMove(1, 'neutral');
				this.webSocketClient.send('player/playerAction', {key: "s", action: false});
			}
		);
		// Arrow keys for same player (alternative controls)
		this.inputManager.onKey("ArrowUp",
			() => this.webSocketClient.send('player/playerAction', {key: "ArrowUp", action: true}),
			() => this.webSocketClient.send('player/playerAction', {key: "ArrowUp", action: false})
		);

		this.inputManager.onKey("ArrowDown",
			() => this.webSocketClient.send('player/playerAction', {key: "ArrowDown", action: true}),
			() => this.webSocketClient.send('player/playerAction', {key: "ArrowDown", action: false})
		);

		this.inputManager.onKey("escape",
			() => this.webSocketClient.send('player/playerAction', {key: "escape", action: true}),
			() => this.webSocketClient.send('player/playerAction', {key: "escape", action: false})
		);
	}

	_setupNetworkListeners()
	{
		this.webSocketClient.onConnect(() =>
		{
			console.log('✅ Connected to server');
		});

		this.webSocketClient.onMessage((data) =>
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

		this.webSocketClient.onClose((event) =>
		{
			console.log('🔌 Disconnected from server:', event.code, event.reason);
		});

		this.webSocketClient.onError((error) =>
		{
		});

		this.webSocketClient.connect({ id: this.playerId, name: this.playerName });
	}

	createRoom(mode, gameSettings)
	{
		try
		{
			if (!this.webSocketClient.isConnect())
				throw new Error('Not connected to server');
			let data = {
				name: `${this.playerName}'s Room`,
				gameMode: mode,
				...gameSettings
			};
			this.webSocketClient.send('room/create', data);
		}
		catch (error)
		{
			console.error('❌ Error creating room:', error);
		}
	}

	nextRound()
	{
		this.webSocketClient.send('room/nextRound');
	}

	joinRoom(roomId)
	{
		try
		{
			if (!this.webSocketClient.isConnect())
				throw new Error('Not connected to server');
			if (!roomId)
				throw new Error('Room ID is required to join a room');
			this.webSocketClient.send('room/join', { roomId });
		}
		catch (error)
		{
			console.error('❌ Error joining room:', error);
		}
	}

	startGame()
	{
		this.webSocketClient.send('room/startGame');
	}

	readyState(readyState)
	{
		this.webSocketClient.send('room/setReady', {isReady: readyState });
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
			case 'tournament':
				this._handleTournamentEvent(subEvent, data);
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
			default:
				console.log('Unhandled room event:', subEvent, data);
		}
	}

	_handleTournamentEvent(subEvent, data)
	{
		console.log('Tournament event:', subEvent, JSON.stringify(data, null, 2));
		switch (subEvent)
		{
			case 'initial':
				const playerArcadeNumber = data.games.find(g => g.players.includes(this.playerId)).matchNumber;
				this.loadGame(
					{
						canvasId: "renderCanvas",
						gameMode: 'tournament',
						renderConfig:
						{
							...rendererConfig,
							paddleSize:
							{
								width: data.gameSettings.paddleWidth,
								height: data.gameSettings.paddleHeight
							},
						},
						arcadeCount: data.gameCount,
						arcadeOwnerNumber: playerArcadeNumber,
					}
				);
				break;
			case 'update':
				this.gameRenderer.gameState = data;
				break;
			case 'roundFinish':
				this.gameRenderer.reset();
				this.roomUi.showGameUI();
			default:
				console.log('Unhandled tournament event:', subEvent, data);
		}
	}

	loadGame(gameConfig)
	{
		this.gameRenderer.initialize(gameConfig).then(
			() =>
			{
				this.webSocketClient.send('player/initialized');
				this.roomUi.hideGameUI();
				this.gameRenderer.startRendering();
			}).catch((error) =>
			{
				console.error('❌ Error initializing game renderer:', error);
			}
		);
	}

	_handleGameEvent(subEvent, data)
	{
		switch (subEvent)
		{
			case 'initial':
				this.loadGame({
						canvasId: "renderCanvas",
						gameMode: data.gameMode,
						renderConfig:
						{
							...rendererConfig,
							paddleSize:
							{
								width: data.paddleWidth,
								height: data.paddleHeight
							},
						},
					}
				);
				break;
			case 'stateUpdate':
				this.gameRenderer.gameState = data.gameData;
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
