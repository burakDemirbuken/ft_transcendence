import * as constants from '../utils/constants.js';

interface Translations {
	[key: string]: string;
}

interface Position {
	x: number;
	y: number;
}

interface Ball {
	position: Position;
	radius: number;
}

interface Score {
	team1: number;
	team2: number;
}

interface Player {
	position: Position;
	oldPosition?: Position;
}

interface GameData {
	players?: Player[];
	ball?: Ball;
	score?: Score;
	winner?: {
		names: string[];
		ids: string[];
	};
}

interface RenderData {
	currentState?: string;
	gameData?: GameData;
}

interface PaddleSize {
	width: number;
	height: number;
}

interface Colors {
	background: string;
	paddle: string;
	ball: string;
	text: string;
	accent: string;
}

interface GameConfig {
	colors: Colors;
	paddleSize?: PaddleSize;
	ball?: {
		radius: number;
	};
}

interface ArcadeMachine {
	getScreenContext(): any;  // BABYLON.ICanvasRenderingContext
	updateScreen(): void;
	joystickMove(number: number, direction: string): void;
}

async function getJsTranslations(lang: string): Promise<Translations> {
	const response = await fetch(`../../locales/game.json`);
	const translations = await response.json();
	return translations[lang];
}

class Renderer
{
	private lang: Promise<Translations>;
	private screenSize: { width: number; height: number };
	private paddleSize: PaddleSize | null;
	private ballSize: number | null;
	private colors: Colors | null;

	constructor()
	{
		this.lang = getJsTranslations("en");
		console.log('🎮 Game Renderer initialized with language:', {});
		this.screenSize = constants.SCREEN_SIZE;
		this.paddleSize = null;
		this.ballSize = null;
		this.colors = null;
	}

	initialize(gameConfig: GameConfig): void
	{
		if (!gameConfig || !gameConfig.colors)
			throw new Error('Game configuration is incomplete');

		this.colors = gameConfig.colors;

		if (gameConfig.paddleSize)
			this.paddleSize = gameConfig.paddleSize;
		else
			this.paddleSize = { width: 10, height: 100 };

		if (gameConfig.ball)
			this.ballSize = gameConfig.ball.radius || 10;
		else
			this.ballSize = 10;
	}

	renderGame(data: RenderData, machine: ArcadeMachine): void
	{
		const gameData = data.gameData;
		if (!machine || !gameData)
		{
			this.renderWaitingScreen('Waiting...', machine);
			return;
		}

		if (data.currentState === "canceled")
		{
			this.renderWaitingScreen('Game Canceled', machine);
			return;
		}

		if (data.currentState === "finished")
		{
			this.finishScreen(gameData, machine);
			return;
		}

		const ctx = machine.getScreenContext();
		this.clearScreen(ctx);

		if (gameData.players)
		{
			gameData.players.forEach(
				(player, index) =>
				{
					this.renderPaddle(ctx, player.position);

					if (player.oldPosition)
					{
						console.log("player:", player);
						const deltaY = player.position.y - player.oldPosition.y;
						const threshold = 1;
						const joystickNumber = index + 1;

						if (Math.abs(deltaY) > threshold)
						{
							if (deltaY < 0) {
								machine.joystickMove(joystickNumber, 'up');
							} else if (deltaY > 0) {
								machine.joystickMove(joystickNumber, 'down');
							}
						}
						else
							machine.joystickMove(joystickNumber, 'neutral');
					}
				}
			);
		}
		if (gameData.ball)
			this.renderBall(ctx, gameData.ball);
		if (gameData.score)
			this.renderScore(ctx, gameData.score);

		this.renderCenterLine(ctx);

		machine.updateScreen();
	}

	clearScreen(ctx: CanvasRenderingContext2D): void
	{
		if (!this.colors) return;
		ctx.fillStyle = this.colors.background;
		ctx.fillRect(0, 0, this.screenSize.width, this.screenSize.height);
	}

	renderPaddle(ctx: CanvasRenderingContext2D, position: Position): void
	{
		if (!this.colors || !this.paddleSize) return;
		ctx.fillStyle = this.colors.paddle;
		ctx.fillRect(position.x, position.y, this.paddleSize.width, this.paddleSize.height);
	}

	renderBall(ctx: CanvasRenderingContext2D, ball: Ball): void
	{
		if (!this.colors) return;
		ctx.fillStyle = this.colors.ball;
		ctx.beginPath();
		ctx.arc(ball.position.x + ball.radius, ball.position.y + ball.radius, ball.radius, 0, Math.PI * 2);
		ctx.fill();
	}

	renderScore(ctx: CanvasRenderingContext2D, score: Score): void
	{
		if (!this.colors) return;
		ctx.fillStyle = this.colors.text;
		ctx.font = '48px Arial';
		ctx.textAlign = 'center';

		ctx.fillText(score.team1.toString(), this.screenSize.width / 4, 60);

		ctx.fillText(score.team2.toString(), (this.screenSize.width * 3) / 4, 60);
	}

	renderCenterLine(ctx: CanvasRenderingContext2D): void
	{
		if (!this.colors) return;
		ctx.strokeStyle = this.colors.text;
		ctx.setLineDash([10, 10]);
		ctx.beginPath();
		ctx.moveTo(this.screenSize.width / 2, 0);
		ctx.lineTo(this.screenSize.width / 2, this.screenSize.height);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	renderWaitingScreen(message: string, machine: ArcadeMachine): void
	{
		if (!this.colors) return;
		const ctx = machine.getScreenContext();
		this.clearScreen(ctx);

		ctx.fillStyle = this.colors.text;
		ctx.font = '32px Arial';
		ctx.textAlign = 'center';
		ctx.fillText(message || 'Waiting...', this.screenSize.width / 2, this.screenSize.height / 2);

		machine.updateScreen();
	}

	finishScreen(gameData: GameData, machine: ArcadeMachine): void
	{
		if (!this.colors) return;
		const ctx = machine.getScreenContext();
		this.clearScreen(ctx);

		ctx.fillStyle = this.colors.text;
		ctx.font = '32px Arial';
		ctx.textAlign = 'center';

		if (gameData.winner) {
			const winnerNames = gameData.winner.names.join(', ');
			ctx.fillText(`Winner: ${winnerNames}`, this.screenSize.width / 2, this.screenSize.height / 2 - 20);
		}

		if (gameData.score)
			ctx.fillText(`Score: ${gameData.score.team1} - ${gameData.score.team2}`, this.screenSize.width / 2, this.screenSize.height / 2 + 20);
		machine.updateScreen();
	}
}

export default Renderer;
