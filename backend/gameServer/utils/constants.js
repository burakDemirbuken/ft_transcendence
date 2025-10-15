export const PADDLE_SPACE = 20;

export const DEFAULT_GAME_PROPERTIES = {
	canvasWidth: 800,
	canvasHeight: 600,

	paddleWidth: 10,
	paddleHeight: 100,
	paddleSpeed: 700,

	ballRadius: 7,
	ballSpeed: 600,
	ballSpeedIncrease: 100,

	maxScore: 1
};

export const TICK_RATE = 1000 / 60;

export const TOURNAMENT_GAME_PROPERTIES = {
	...DEFAULT_GAME_PROPERTIES
};
