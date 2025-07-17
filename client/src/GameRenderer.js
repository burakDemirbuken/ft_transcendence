/*
const exampleGameState =
{
	currentState: 'waiting', // 'waiting', 'playing', 'finished'
	screenSize:
	{
		width: 512,
		height: 512
	},
	gameData:
	{
		players:
		[
			{
				id: 'player1',
				name: 'Player 1',
				position:
				{
					x: 0,
					y: 0
				}
				size:
				{
					width: 10,
					height: 100
				}
			},
			{
				id: 'player2',
				name: 'Player 2',
				position:
				{
					x: 0,
					y: 0
				}
				size:
				{
					width: 10,
					height: 100
				}
			}
		],
		ball:
		{
			position:
			{
				x: 0,
				y: 0
			},
			radius: 10,
			speed: 5
		},
		score: { player1: 0, player2: 0 },
	}
}

const exampleGameRenderConfig =
{
	screenSize:
	{
		width: 512,
		height: 512
	},
	colors:
	{
		background: '#000000',
		paddle: '#FFFFFF',
		ball: '#FFFFFF',
		text: '#FFFFFF',
		accent: '#00FF00'
	},
	paddleSize:
	{
		width: 10,
		height: 100
	},
	ball:
	{
		radius: 10,
	}
};
*/

class GameRenderer
{
	constructor(gameCore)
	{
		this.gameCore = gameCore;
		this.screenSize = null;
		this.paddleSize = null;
		this.ballSize = null;
		this.colors = null;
	}

	initialize(gameConfig)
	{
		if (!gameConfig || !gameConfig.screenSize || !gameConfig.colors)
			throw new Error('Game configuration is incomplete');

		this.screenSize = gameConfig.screenSize;
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

	renderGame(gameData, machine)
	{
		if (!machine)
			return;

		const ctx = machine.getScreenContext();
		this.clearScreen(ctx);

		if (gameData.players)
		{
			gameData.players.forEach(
				(player) =>
				{
					this.renderPaddle(ctx, player.position);
				});
		}
		if (gameData.ball)
			this.renderBall(ctx, gameData.ball);
		if (gameData.score)
			this.renderScore(ctx, gameData.score);

		this.renderCenterLine(ctx);

		machine.updateScreen();
	}

	renderSingleGame(gameData)
	{
		const machineId = `machine_1`;
		this.renderGame(gameData, machineId);
	}


	// TODOO: turnuva için render ayarlanacak.
	renderTournament(tournamentData)
	{
		// Turnuva verisi
		if (tournamentData.matches)
		{
			tournamentData.matches.forEach(
				(match, index) =>
				{
					const machineId = `tournament_${index}`;

					if (match.isActive)
					{
						this.gameCore.setActiveMachine(machineId);
						this.renderGame(match.gameData, machineId);
					}
					else
					{
						this.renderWaitingScreen(`Maç ${index + 1}`, machineId);
					}
				});
		}
	}

	clearScreen(ctx)
	{
		ctx.fillStyle = this.colors.background;
		ctx.fillRect(0, 0, this.screenSize.width, this.screenSize.height);
	}

	renderPaddle(ctx, player)
	{
		ctx.fillStyle = this.colors.paddle;
		ctx.fillRect(player.x, player.y, this.paddleSize.width, this.paddleSize.height);
	}

	renderBall(ctx, ball)
	{
		ctx.fillStyle = this.colors.ball;
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, this.ballSize.radius, 0, Math.PI * 2);
		ctx.fill();
	}

	renderScore(ctx, score)
	{
		ctx.fillStyle = this.colors.text;
		ctx.font = '48px Arial';
		ctx.textAlign = 'center';

		// Sol oyuncu skoru
		ctx.fillText(score.player1, this.screenSize.width / 4, 60);

		// Sağ oyuncu skoru
		ctx.fillText(score.player2, (this.screenSize.width * 3) / 4, 60);
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

export default GameRenderer;
