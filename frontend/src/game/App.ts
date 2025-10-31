import WebSocketClient from './network/WebSocketClient.js';
import GameRenderer from "./GameRenderer.js";

//!
import InputManager from './input/InputManager.js';
import rendererConfig from './json/rendererConfig.js';

/*
const gl = canvas.getContext("webgl");
if (!gl) {
  alert("WebGL not supported");
  throw new Error("WebGL not supported");
}
*/

interface StartData {
	gameMode: string;
	roomId: string;
	gameCount?: number;
	games?: Array<{
		matchNumber?: number;
		players: number[];
	}>;
	gameSettings: {
		paddleWidth: number;
		paddleHeight: number;
	};
}

interface GameConfig {
	canvasId: string;
	gameMode: string;
	renderConfig: any;
	arcadeCount?: number;
	arcadeOwnerNumber?: number;
}

interface GameSettings {
	[key: string]: any;
}

class App
{
	private playerId: number;
	private playerName: string;
	private gameRenderer: GameRenderer;
	private webSocketClient: WebSocketClient;
	private inputManager: InputManager | null;

	constructor(id: number, name: string)
	{
		this.playerId = id;
		this.playerName = name;
		this.gameRenderer = new GameRenderer();
		// Use nginx proxy instead of direct connection
		this.webSocketClient = new WebSocketClient(window.location.hostname, 3030);
		this.inputManager = new InputManager();
	}

	start(data: StartData): void
	{
		console.log('🚀 Starting app with data:', JSON.stringify(data, null, 2));
		if (data.gameMode === 'tournament')
		{
			let playerArcadeNumber = data.games.find(g => g.players.includes(this.playerId))?.matchNumber;
			if (playerArcadeNumber === undefined)
				playerArcadeNumber = 0;
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
		}
		else
		{
			this.loadGame({
					canvasId: "renderCanvas",
					gameMode: data.gameMode,
					renderConfig:
					{
						...rendererConfig,
						paddleSize:
						{
							width: data.gameSettings.paddleWidth,
							height: data.gameSettings.paddleHeight
						},
					},
				}
			);
		}

		// ulas :
		// this._pingpong(this.playerName);
		this._setupNetworkListeners(data.roomId, data.gameMode);
		this._gameControllerSetup();
	}

	_pingpong(name: string): void {
		const socket = new WebSocket(`wss://${window.location.hostname}:3007/ws-friend/presence?` + new URLSearchParams({ userName: name }).toString());
		socket.onopen = () => {
			console.log('Connected to presence server');
		}

		socket.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				if (message.type === 'ping') {
					socket.send(JSON.stringify({ type: 'pong' }));
				}
			} catch (err) {
				console.error('Error parsing message from presence server:', err);
			}
		}

		socket.onerror = (error) => {
			console.error('Heartbeat WebSocket error:', error);
		}

	}

	_gameControllerSetup(): void
	{
		this.inputManager!.onKey("w",
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
		this.inputManager!.onKey("s",
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
		this.inputManager!.onKey("ArrowUp",
			() => this.webSocketClient.send('player/playerAction', {key: "ArrowUp", action: true}),
			() => this.webSocketClient.send('player/playerAction', {key: "ArrowUp", action: false})
		);

		this.inputManager!.onKey("ArrowDown",
			() => this.webSocketClient.send('player/playerAction', {key: "ArrowDown", action: true}),
			() => this.webSocketClient.send('player/playerAction', {key: "ArrowDown", action: false})
		);

		this.inputManager!.onKey("escape",
			() => this.webSocketClient.send('player/playerAction', {key: "escape", action: true}),
			() => this.webSocketClient.send('player/playerAction', {key: "escape", action: false})
		);
	}

	_setupNetworkListeners(roomId: string, gameMode: string): void
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

		this.webSocketClient.connect("ws-game/ws", { userID: this.playerId, userName: this.playerName, gameId: roomId, gameMode: gameMode });
	}

	createRoom(mode: string, gameSettings: GameSettings): void
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
			this.webSocketClient.send('create', data);
		}
		catch (error)
		{
			console.error('❌ Error creating room:', error);
		}
	}

	nextRound(): void
	{
		this.webSocketClient.send('room/nextRound', {});
	}

	joinRoom(roomId: string): void
	{
		try
		{
			if (!this.webSocketClient.isConnect())
				throw new Error('Not connected to server');
			if (!roomId)
				throw new Error('Room ID is required to join a room');
			this.webSocketClient.send('join', { roomId });
		}
		catch (error)
		{
			console.error('❌ Error joining room:', error);
		}
	}

	startGame(): void
	{
		this.webSocketClient.send('startGame', {});
	}

	readyState(readyState: boolean): void
	{
		this.webSocketClient.send('setReady', {isReady: readyState });
	}

	// ================================
	// NETWORK EVENT HANDLERS
	// ================================

	/**
	 * Handle network events from server
	 */
	handleNetworkEvent(eventType: string, data: any): void
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
			case 'tournament':
				this._handleTournamentEvent(subEvent, data);
				break;
			case 'error':
				console.error('❌ Server error:', data);
				break;
			default:
				console.error('Unhandled network event:', eventType, data);
		}
	}

	_handleRoomEvent(subEvent: string, data: any): void
	{
		switch (subEvent)
		{
			default:
				console.log('Unhandled room event:', subEvent, data);
		}
	}

	_handleTournamentEvent(subEvent: string, data: any): void
	{
		switch (subEvent)
		{
			case 'update':
				this.gameRenderer.gameState = data;
				break;
			default:
				console.error('Unhandled tournament event:', subEvent, data);
		}
	}

	loadGame(gameConfig: GameConfig): void
	{
		console.log('🎮 Loading game with config:', gameConfig);
		this.gameRenderer.initialize(gameConfig).then(
			() =>
			{
				this.gameRenderer.startRendering();
			}).catch((error) =>
			{
				console.error('❌ Error initializing game renderer:', error);
			}
		);
	}

	_handleGameEvent(subEvent: string, data: any): void
	{
		switch (subEvent)
		{
			case 'update':
				this.gameRenderer.gameState = data;
				break;
			default:
				console.error('Unhandled game event:', subEvent, data);
		}
	}

	destroy(): void
	{
		this.gameRenderer.reset();
		this.webSocketClient.disconnect();
		if (this.inputManager)
		{
			this.inputManager.destroy();
			this.inputManager = null;
		}
		console.log('🧹 App resources cleaned up');
	}
}

export default App;
