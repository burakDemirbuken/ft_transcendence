import WebSocketClient from './network/WebSocketClient.js';
import GameRenderer from "./GameRenderer.js";
import InputManager from './input/InputManager.js';
import rendererConfig from './json/rendererConfig.js';

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
	renderConfig: {
		[key: string]: any;
	};
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

	async start(data: StartData): Promise<void>
	{
		let initData = null;
		initData = {
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
		};

		if (data.gameMode === 'tournament')
		{
			let playerArcadeNumber = data.games.find(g => g.players.includes(this.playerId))?.matchNumber;
			if (playerArcadeNumber === undefined)
				playerArcadeNumber = 0;
			initData.arcadeCount = data.gameCount;
			initData.arcadeOwnerNumber = playerArcadeNumber;
		}
		await this.loadGame(initData);
		this._setupNetworkListeners(data.roomId, data.gameMode);
		this._gameControllerSetup();
	}

	_gameControllerSetup(): void
	{
		this.inputManager!.onKey("w",
			() =>
			{
				this.webSocketClient.send('player/playerAction', {key: "w", action: true});
			},
			() =>
			{
				this.webSocketClient.send('player/playerAction', {key: "w", action: false});
			}
		);
		this.inputManager!.onKey("s",
			() =>
			{
				this.webSocketClient.send('player/playerAction', {key: "s", action: true});
			},
			() =>
			{
				this.webSocketClient.send('player/playerAction', {key: "s", action: false});
			}
		);
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
		});

		this.webSocketClient.onMessage((data) =>
		{
			if (!data || typeof data !== 'object') {
				return;
			}

			if (!data.type) {
				return;
			}

			this.handleNetworkEvent(data.type, data.payload);
		});

		this.webSocketClient.onClose((event) =>
		{
		});

		this.webSocketClient.onError((error) =>
		{
		});

		this.webSocketClient.connect("ws-game", { userID: this.playerId, userName: this.playerName, gameId: roomId, gameMode: gameMode });
	}

	handleNetworkEvent(eventType: string, data: any): void
	{
		const [event, subEvent] = eventType.split('/');
		switch (event)
		{
			case 'game':
			case 'tournament':
				this._handleGameEvent(subEvent, data);
				break;
			default:
				console.error('Unhandled network event:', eventType, data);
		}
	}

	async loadGame(gameConfig: GameConfig): Promise<void>
	{
		await this.gameRenderer.initialize(gameConfig).then(
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
		this.inputManager.destroy();
	}
}

export default App;
