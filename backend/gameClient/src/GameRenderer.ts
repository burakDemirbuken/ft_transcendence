/// <reference types="babylonjs" />

import GameCore from './core/GameCore.js';
import Renderer from './rendering/Renderer.js';
import EventEmitter from './utils/EventEmitter.js';
import ArcadeMachine from './arcade/ArcadeMachine.js';

interface Position {
	x: number;
	y: number;
	z: number;
}

interface GameConfig {
	canvasId: string;
	renderConfig: any;
	gameMode: string;
	arcade?: any;
	arcadeCount?: number;
	arcadeOwnerNumber?: number;
}

interface Match {
	matchNumber: number;
	gameState: any;
}

interface TournamentData {
	matches: Match[];
}

class GameRenderer extends EventEmitter
{
	private canvas: HTMLCanvasElement | null;
	private gameCore: GameCore;
	private arcadeMachines: Map<number, ArcadeMachine>;
	private renderer: Renderer;
	public gameState: any;
	private currentGameMode: string | null;
	private playerMachine: ArcadeMachine | null;
	private isRunning: boolean;

	constructor()
	{
		super();
		this.canvas = null;
		this.gameCore = new GameCore();
		this.arcadeMachines = new Map();
		this.renderer = new Renderer();
		this.gameState = null;
		this.currentGameMode = null;
		this.playerMachine = null;

		this.isRunning = false;
	}
//		await this.gameCore.loadScene(gameConfig.gameMode);

	/*
	{
		tournament:
		{
			id: 1,
			name: 'Champions Cup',
			maxPlayers: 8,
			rules: 'Single elimination',
		},
		gameCount: 2,
		playersCount: 4,
		games:
		[
			{ id: 1, players: [1, 2] },
			{ id: 2, players: [3, 4] }
		],
		gameSettings:
		{
			paddleHeight: 100,
			paddleWidth: 20,
			ballRadius: 10,
			fieldWidth: 800,
			fieldHeight: 400,
			paddleSpeed: 10,
			ballSpeed: 5,
		},
		players:
		[
			{ id: 1, name: 'Alice', gameId: 1 },
			{ id: 2, name: 'Bob', gameId: 1 },
			{ id: 3, name: 'Charlie', gameId: 2 },
			{ id: 4, name: 'Diana', gameId: 2 },
		]
	}
	*/

// oyun başladığında initialize edilecek sahne yüklenecek oyun oynanmaya hazır hale gelecek
	async initialize(gameConfig: GameConfig): Promise<void>
	{
		if (!gameConfig || !gameConfig.canvasId)
			throw new Error('Game configuration is missing canvasId');
		this.canvas = document.getElementById(gameConfig.canvasId) as HTMLCanvasElement;
		if (!this.canvas)
			throw new Error('Canvas is missing');
		if (!gameConfig.renderConfig)
			throw new Error('Game render configuration is missing');
		await this.gameCore.initialize(this.canvas, gameConfig.arcade);
		this.renderer.initialize(gameConfig.renderConfig);
		this.currentGameMode = gameConfig.gameMode;
		switch (this.currentGameMode)
		{
			case 'local':
			case 'ai':
			case 'multiplayer':
			case 'classic':
				await this.classicInitialize();
				break;
			case 'tournament':
				await this.tournamentInitialize(gameConfig.arcadeCount, gameConfig.arcadeOwnerNumber);
				break;
			default:
				throw new Error(`Unknown game mode: ${gameConfig.gameMode}`);
		}
	}

	async tournamentInitialize(arcadeCount: number = 0, playerOwnerNumber: number = 0): Promise<void>
	{
		const radius = 5; // Yuvarlağın yarıçapı
		const angleStep = (Math.PI * 2) / arcadeCount; // Her oyuncu arası açı
		for (let i = 0; i < arcadeCount; i++)
		{
			const angle = i * angleStep;
			const position = {
				x: Math.round(Math.cos(angle) * radius * 1000) / 1000,
				y: 0,
				z: Math.round(Math.sin(angle) * radius * 1000) / 1000
			};

       		const rotationAngle = Math.atan2(-position.x, -position.z) + Math.PI;
			const machine = new ArcadeMachine(this.gameCore.scene!);
			await machine.load(position, rotationAngle);
			this.arcadeMachines.set(i, machine);
		}

		// PlayerMachine'i set et
		this.playerMachine = this.arcadeMachines.get(playerOwnerNumber) || null;

		this.focusOnPlayer(playerOwnerNumber);
	}

	async classicInitialize(): Promise<void>
	{
		this.playerMachine = new ArcadeMachine(this.gameCore.scene!);
		await this.playerMachine.load();

		// Pozisyon set et (default 0,0,0)
		if (!this.playerMachine.position) {
			this.playerMachine.position = { x: 0, y: 0, z: 0 };
		}

		this.arcadeMachines.set(0, this.playerMachine);
		const cameraDistance = 3;
		const cameraHeight = 4.5;
		this.gameCore.setCameraPosition(
			{ x: this.playerMachine.position.x, y: this.playerMachine.position.y + cameraHeight, z: this.playerMachine.position.z - cameraDistance},
			{ x: this.playerMachine.position.x, y: this.playerMachine.position.y + 3.75, z: this.playerMachine.position.z });
	}

	startRendering(): void
	{
		this.isRunning = true;
		this.gameLoop();
	}

	stopRendering(): void
	{
		this.isRunning = false;
	}

	render(data: any): void
	{
		if (!this.isRunning)
			return;
		if (this.currentGameMode === 'tournament')
			this.renderTournament(data);
		else
			this.renderMachine(data, this.playerMachine);
	}

	renderMachine(data: any, machine: ArcadeMachine | null): void
	{
		if (machine)
			this.renderer.renderGame(data, machine);
	}

	renderTournament(data: TournamentData): void
	{
		data.matches.forEach((match) => {
			const machine = this.arcadeMachines.get(match.matchNumber);
			if (machine)
				this.renderer.renderGame(match.gameState, machine);
		});
	}

	// Player ID'sine göre machine bul
	getMachineByPlayerId(playerId: number): ArcadeMachine | undefined
	{
		return this.arcadeMachines.get(playerId);
	}

	// Belirli bir machine'e odaklan (kamera hareketi)
	focusOnPlayer(machineNumber: number): void
	{
		const cameraDistance = 3;
		const cameraHeight = 4.5;
		const angleStep = (Math.PI * 2) / this.arcadeMachines.size; // Her oyuncu arası açı

		const angle = machineNumber * angleStep + BABYLON.Tools.ToRadians(4);
		const cameraPosition = {
			x: Math.round(Math.cos(angle) * cameraDistance * 1000) / 1000,
			y: cameraHeight,
			z: Math.round(Math.sin(angle) * cameraDistance * 1000) / 1000
		};

		const targetMachine = this.arcadeMachines.get(machineNumber);

		const lookAtPosition = {
			x: targetMachine.position.x,
			y: targetMachine.position.y + 3.75,
			z: targetMachine.position.z
		};

		this.gameCore.setCameraPosition(cameraPosition, lookAtPosition);
	}

	gameLoop(): void
	{
		if (!this.isRunning)
			return;
		if (this.gameState)
			this.render(this.gameState);
		else if (this.playerMachine)
			this.renderer.renderWaitingScreen("Waiting for game state...", this.playerMachine);
		requestAnimationFrame(() => this.gameLoop());
	}

	dispose(): void
	{
		this.isRunning = false;
		this.currentGameMode = null;
		this.gameCore.dispose();
	}

	reset(): void
	{
		this.stopRendering();
		this.gameCore.dispose();
		this.gameState = null;
		this.currentGameMode = null;
		this.arcadeMachines.forEach(machine => machine.dispose());
		this.arcadeMachines.clear();
		this.playerMachine = null;
	}
}
export default GameRenderer;
