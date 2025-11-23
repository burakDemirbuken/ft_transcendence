interface GameSettings {
	paddleWidth: number;
	paddleHeight: number;
	paddleSpeed: number;
	ballRadius: number;
	ballSpeed: number;
	ballSpeedIncrease: number;
	maxScore: number;
}

interface GameConfig {
	gameSettings: GameSettings;
}

const gameConfig: GameConfig = {
	gameSettings:
	{
		paddleWidth: 10,
		paddleHeight: 100,
		paddleSpeed: 700,
		ballRadius: 7,
		ballSpeed: 600,
		ballSpeedIncrease: 100,
		maxScore: 11
	}
};

export default gameConfig;
