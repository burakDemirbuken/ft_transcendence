import EventEmitter from '../utils/EventEmitter.js';
import Ball from './Objects/Ball.js';
import Paddle from './Objects/Paddle.js';
import Collision2D from "./utils/Collision2D.js";
import { DEFAULT_GAME_PROPERTIES, PADDLE_SPACE } from '../utils/constants.js';

class PingPong extends EventEmitter
{
	constructor(property)
	{
		super();
		this.status = 'not initialized'; // 'waiting', 'countdown', 'playing', 'finished', 'not initialized'
		this.gameMode = "classic"; // 'local', 'online', 'tournament', 'ai'

		this.lastUpdateTime = 0;
		this.startTime = 0;
		this.finishTime = 0;
		this.gameTime = 0;


		this.timeout = null;
		this.state = {
			players: [],
		};
		this.settings = {
			...DEFAULT_GAME_PROPERTIES,
			...property,
		};
		this.maxPlayers = 2;

		this.ball = null;
		this.paddles = new Map(); // playerId -> Paddle instance
		this.players = []; // Player instances
		this.registeredPlayers = new Set(); // playerId set

		this.team = new Map(); // number -> { playersId: [], score: 0 }
		this.team.set(1, { playersId: [], score: 0 });
		this.team.set(2, { playersId: [], score: 0 });
		this.lastGoal = null;
	}

	addRegisteredPlayer(playerId)
	{
		if (this.registeredPlayers.size >= this.maxPlayers)
		{
			//* throw olarak yönet
			console.warn(`⚠️ Player ${playerId} cannot be registered. Max players reached.`);
			return;
		}
		if (this.registeredPlayers.has(playerId))
		{
			console.warn(`⚠️ Player ${playerId} is already registered`);
			return;
		}
		this.registeredPlayers.add(playerId);
		this.paddles.set(playerId, this.createPaddle(this.registeredPlayers.size));
		this.state.players.push({ id: playerId, kickBall: 0, missedBall: 0 });
		this.team.get(this.registeredPlayers.size % 2 ? 1 : 2).playersId.push(playerId);
		if (this.registeredPlayers.size === this.maxPlayers)
		{
			this.timeout = setTimeout(
				() =>
				{
					if (this.players.length !== this.maxPlayers)
					{
						if (this.players.length === 0)
						{
							this.status = 'canceled';
							return;
						}
						for (const id of this.registeredPlayers)
						{
							if (!this.players.find(p => p.id === id))
							{
								if (this.team.get(1).playersId.includes(id))
									this.team.get(2).score = this.settings.maxScore; // diğer takım kazanır
								else if (this.team.get(2).playersId.includes(id))
									this.team.get(1).score = this.settings.maxScore; // diğer takım kazanır
								this.finishedControls();
								break;
							}
						}

					}
				}, 5000
			);
		}
		console.log(`👤 Player ${playerId} registered for the game`);
	}

	removeRegisteredPlayer(playerId)
	{
		if (this.registeredPlayers.has(playerId))
			this.registeredPlayers.delete(playerId);
		else
			console.warn(`⚠️ Player ${playerId} is not registered`);
	}

	addPlayer(player)
	{
		if (this.registeredPlayers.has(player.id))
		{
			this.players.push(player);
			console.log(`👤 Player ${player.id} added to game`);
			if (this.players.length === this.maxPlayers)
			{
				if (this.timeout)
				{
					clearTimeout(this.timeout);
					this.timeout = null;
				}
				this.status = 'ready to start';
			}
		}
	}

	removePlayer(playerId)
	{
		const playerIndex = this.players.findIndex(p => p.id === playerId);
		if (playerIndex !== -1)
		{
			console.log(`👤 Player ${playerId} removed from game`);
			if (this.team.get(1).playersId.includes(playerId))
				this.team.get(2).score = this.settings.maxScore;
			else if (this.team.get(2).playersId.includes(playerId))
				this.team.get(1).score = this.settings.maxScore;
			this.finishedControls();
			console.log(`winner determined after player removal`);
			this.players.splice(playerIndex, 1);
		}
		else
			console.warn(`⚠️ Player ${playerId} not found in game`);
	}

	createPaddle(number)
	{
		let paddlePos = { x: 0, y: this.settings.canvasHeight / 2 - this.settings.paddleHeight / 2 };
		if (number === 1)
			paddlePos.x = PADDLE_SPACE;
		else if (number === 2)
			paddlePos.x = this.settings.canvasWidth - this.settings.paddleWidth - PADDLE_SPACE;
		else if (number === 3)
			paddlePos.x = 200;
		else if (number === 4)
			paddlePos.x = this.settings.canvasWidth - this.settings.paddleWidth - 200;
		return new Paddle(
			paddlePos.x,
			paddlePos.y,
			this.settings.paddleWidth,
			this.settings.paddleHeight,
			this.settings.paddleSpeed,
			{width: this.settings.canvasWidth, height: this.settings.canvasHeight}
		);
	}

	initializeGame()
	{
		this.ball = new Ball(
			this.settings.canvasWidth / 2 - this.settings.ballRadius / 2,
			this.settings.canvasHeight / 2 - this.settings.ballRadius / 2,
			this.settings.ballRadius,
			this.settings.ballSpeed,
			{width: this.settings.canvasWidth, height: this.settings.canvasHeight}
		);
		this.ball.launchBall({x: Math.random() < 0.5 ? -1 : 1, y: Math.random() - 0.5});
		this.eventListeners();
		this.status = 'waiting';
	}

	eventListeners()
	{
		this.ball.on('borderHit',
			(border) =>
			{
				if (this.checkCollisions() != null)
					return;
				if (border === 'left' || border === 'right')
				{
					if (border === 'right')
					{
						this.lastGoal = 'right';
						this.team.get(1).score++;
						this.team.get(2).playersId.forEach(playerId => {
							const playerState = this.state.players.find(p => p.id === playerId);
							if (playerState)
								playerState.missedBall += 1;
						});
					}
					else
					{
						this.lastGoal = 'left';
						this.team.get(2).score++;
						this.team.get(1).playersId.forEach(playerId => {
							const playerState = this.state.players.find(p => p.id === playerId);
							if (playerState)
								playerState.missedBall += 1;
						});
					}
					this.emit('goal', border);
					this.ball.reset();
					if (this.finishedControls())
						return;
					setTimeout(() =>
					{
						this.ball.launchBall({x: border == "left" ? -1 : 1, y: Math.random() - 0.5});
					}, 500);
				}
				else if (border === 'top')
				{
					this.ball.setPosition(this.ball.pos.x, this.ball.height + 1);
					this.ball.launchBall({x: this.ball.direction.x, y: Math.abs(this.ball.direction.y)});
				}
				else if (border === 'bottom')
				{
					this.ball.setPosition(this.ball.pos.x, 	this.ball.canvasSize.height - this.ball.height - 1);
					this.ball.launchBall({x: this.ball.direction.x, y: -Math.abs(this.ball.direction.y)});
				}
			}
		);
	}

	paddleControls()
	{
		for (const player of this.players)
		{
			const paddle = this.paddles.get(player.id);
			if (paddle)
			{
				paddle.up = player.inputGet('w') || player.inputGet('ArrowUp');
				paddle.down = player.inputGet('s') || player.inputGet('ArrowDown');
			}
		}
	}

	update(deltaTime)
	{
		this.paddleControls();
		this.paddles.forEach((paddle) => paddle.update(deltaTime));
		if (this.status === 'playing')
		{
			this.gameTime += deltaTime;
			this.lastUpdateTime = Date.now();

			this.ball.update(deltaTime);
			this.checkCollisions();
		}

		this.emit('update', { gameState: this.getGameState(), players: this.players });
	}

	finish()
	{
		this.status = 'finished';
		this.finishTime = Date.now();
		this.players.forEach(p => p.reset());
		this.emit('finished',
			{
				players: this.players,
				registeredPlayers: this.registeredPlayers,
				results:
				{
					status: 'completed',
					team1:
					{
						score: this.team.get(1).score,
						playersId: this.team.get(1).playersId
					},
					team2:
					{
						score: this.team.get(2).score,
						playersId: this.team.get(2).playersId
					},
					winner:
					{
						team: this.getWinnerTeam(),
						ids: this.getWinnerTeam().playersId,
					},
					loser:
					{
						team: this.getLoserTeam(),
						ids: this.getLoserTeam().playersId,
					},
					time:
					{
						start: this.startTime,
						finish: this.finishTime,
						duration: this.gameTime
					},
					matchType: this.gameMode,
					state: this.state
				},
			}
		);
	}

	finishedControls()
	{
		if (this.isFinished())
			return true;
		if (this.team.get(1).score >= this.settings.maxScore || this.team.get(2).score >= this.settings.maxScore)
		{
			this.finish();
			return true;
		}
		return false;
	}

	isFinished()
	{
		return this.status === 'finished';
	}

	checkCollisions()
	{
		for (const [playerId, paddle] of this.paddles.entries())
		{
			const collisionDetails = Collision2D.trajectoryRectangleToRectangle(this.ball, paddle, true);
			if (collisionDetails && collisionDetails.colliding)
			{
				const side = collisionDetails.side;
				this.separateBallFromPaddle(this.ball, paddle, side);
				if (side === "top" || side === "bottom")
					this.ball.launchBall({x: this.ball.direction.x, y: -this.ball.direction.y});
				else if (side === "left" || side === "right")
					this.adjustBallAngle(paddle);
				const playerState = this.state.players.find(p => p.id === playerId);
				if (playerState)
					playerState.kickBall += 1;
				return collisionDetails.colliding;
			}
		}
		return null;
	}

	adjustBallAngle(paddle)
	{
		const relativeIntersectY = (paddle.pos.y + paddle.height / 2) - this.ball.pos.y + this.ball.height / 2;
		const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.height / 2);
		this.ball.launchBall({x: -this.ball.direction.x, y: -normalizedRelativeIntersectionY},
										this.ball.defaultSpeed + this.settings.ballSpeedIncrease * Math.abs(normalizedRelativeIntersectionY));
	}

	separateBallFromPaddle(ball, paddle, side)
	{
		let newX = ball.pos.x;
		let newY = ball.pos.y;

		if (side === 'left' || side === 'right')
		{
			if (ball.direction.x < 0)
				newX = paddle.pos.x + paddle.width + 1;
			else
				newX = paddle.pos.x - ball.width - 1;
		}
		else if (side === 'top')
			newY = paddle.pos.y - ball.height - 1;
		else if (side === 'bottom')
			newY = paddle.pos.y + paddle.height + 1;
		ball.setSafePosition(newX, newY);
	}

	start()
	{
		this.startTime = Date.now();
		if (this.status === "finished")
		{
			console.warn('⚠️ Game has already finished. Cannot start again.');
			return ;
		}
		if (this.status === 'canceled')
		{
			this.emit('finished',
				{
					players: this.players,
					registeredPlayers: this.registeredPlayers,
					results:
					{
						status: 'canceled',
						team1:
						{
							score: 0,
							playersId: this.team.get(1).playersId
						},
						team2:
						{
							score: 0,
							playersId: this.team.get(2).playersId
						},
						winner: null,
						loser: null,
						time:
						{
							start: this.startTime,
							finish: this.finishTime,
							duration: this.gameTime
						},
						matchType: this.gameMode,
						state: this.state
					}
				}
			);
			console.log(`🏁 Game🏁🏁🏁🏁🏁🏁🏁 canceled! Not enough players joined.`);
			this.status = 'canceled';
			return;
		}
		if (this.status === 'not initialized')
		{
			this.initializeGame();
		}
		console.log('▶️ Starting game...');
		this.status = 'countdown';
		setTimeout(() =>
		{
			if (this.status === 'countdown')
				this.status = 'playing';
		}, 2000);
	}

	isRunning()
	{
		return this.status === 'playing' || this.status === 'countdown';
	}

	getGameState()
	{
		const playerStates = [];

		for (const player of this.players)
		{
			playerStates.push({
				id: player.id,
				name: player.name,
				...this.paddles.get(player.id).getState(),
			});
		}

		if (this.status === 'canceled')
			return { currentState: this.status, gameData: null };
		if (this.status === 'finished')
		{
			const retState = {
				currentState: this.status,
				gameData:
				{
					players: playerStates,
					score : {
						team1: this.team.get(1).score,
						team2: this.team.get(2).score
					},
					winner:
					{
						names: playerStates.filter(p => this.getWinnerTeam().playersId.includes(p.id)).map(p => p.name),
					},
				}
			};
			return retState;
		}
		return {
			currentState: this.status, // 'waiting', 'running', 'finished'
			gameData:
			{
				players: playerStates,
				ball: {
					...this.ball.getState(),
				},
				score: {
					team1: this.team.get(1).score,
					team2: this.team.get(2).score
				},
			}
		};
	}

	hasPlayer(playerId)
	{
		return this.players.some(p => p.id === playerId);
	}

	isFull()
	{
		return this.players.length === this.maxPlayers;
	}

	getWinnerTeam()
	{
		if (!this.isFinished())
			return null;
		return this.team.get(1).score >= this.settings.maxScore ? this.team.get(1) : this.team.get(2);
	}

	getLoserTeam()
	{
		if (!this.isFinished())
			return null;
		return this.team.get(1).score >= this.settings.maxScore ? this.team.get(2) : this.team.get(1);
	}

	getScore()
	{
		return {
			team1: this.team?.get(1)?.score || 0,
			team2: this.team?.get(2)?.score || 0
		};
	}

	dispose()
	{
		this.ball = null;
		this.paddles.clear();
		this.players = [];
		this.status = 'not initialized';
		this.gameTime = 0;
		this.lastUpdateTime = 0;
		console.log('🗑️ Game disposed');
	}
}

export default PingPong;
