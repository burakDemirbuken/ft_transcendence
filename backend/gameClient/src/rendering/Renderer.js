import * as constants from '../utils/constants.js';

class Renderer
{
	constructor()
	{
		this.screenSize = constants.SCREEN_SIZE;
		this.paddleSize = null;
		this.ballSize = null;
		this.colors = null;
	}

	initialize(gameConfig)
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

	renderGame(data, machine)
	{
		const gameData = data.gameData;
		if (!machine || !gameData)
		{
			this.renderWaitingScreen('Waiting for game data...', machine);
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
				(player) =>
				{
					this.renderPaddle(ctx, player.position);
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

	clearScreen(ctx)
	{
		ctx.fillStyle = this.colors.background;
		ctx.fillRect(0, 0, this.screenSize.width, this.screenSize.height);
	}

	renderPaddle(ctx, position)
	{
		ctx.fillStyle = this.colors.paddle;
		ctx.fillRect(position.x, position.y, this.paddleSize.width, this.paddleSize.height);
	}

	renderBall(ctx, ball)
	{
		ctx.fillStyle = this.colors.ball;
		ctx.beginPath();
		ctx.arc(ball.position.x + ball.radius, ball.position.y + ball.radius, ball.radius, 0, Math.PI * 2);
		ctx.fill();
	}

	renderScore(ctx, score)
	{
		ctx.fillStyle = this.colors.text;
		ctx.font = '48px Arial';
		ctx.textAlign = 'center';

		ctx.fillText(score.team2, this.screenSize.width / 4, 60);

		ctx.fillText(score.team1, (this.screenSize.width * 3) / 4, 60);
	}

	renderCenterLine(ctx)
	{
		ctx.strokeStyle = this.colors.text;
		ctx.setLineDash([10, 10]);
		ctx.beginPath();
		ctx.moveTo(this.screenSize.width / 2, 0);
		ctx.lineTo(this.screenSize.width / 2, this.screenSize.height);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	renderWaitingScreen(message, machine)
	{
		const ctx = machine.getScreenContext();
		this.clearScreen(ctx);

		ctx.fillStyle = this.colors.text;
		ctx.font = '32px Arial';
		ctx.textAlign = 'center';
		ctx.fillText(message || 'Oyuncu Bekleniyor...', this.screenWidth / 2, this.screenHeight / 2);

		machine.updateScreen();
	}

	finishScreen(gameData, machine)
	{
		const ctx = machine.getScreenContext();
		this.clearScreen(ctx);

		ctx.fillStyle = this.colors.text;
		ctx.font = '32px Arial';
		ctx.textAlign = 'center';
		// winner ya da gameover yazılacak
		const winnerNames = gameData.winner.names.join(', ');
		ctx.fillText(`Winner: ${winnerNames}`, this.screenSize.width / 2, this.screenSize.height / 2 - 20);

		if (gameData.score)
			ctx.fillText(`Score: ${gameData.score.team1} - ${gameData.score.team2}`, this.screenSize.width / 2, this.screenSize.height / 2 + 20);
		machine.updateScreen();
	}
}

export default Renderer;
