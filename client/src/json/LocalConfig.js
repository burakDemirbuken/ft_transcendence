export default {
	canvasId: "renderCanvas",
	gameMode: "local",
	arcade:
	{
		position:
		{
			x: 0,
			y: 0,
			z: 0
		},
		machine:
		{
			path: "../models/arcade/classic/",
			model: "arcade.obj"
		}
	},
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
