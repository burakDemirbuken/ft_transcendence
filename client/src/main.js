import Client from './Client.js';
import * as constants from './utils/constants.js';

let client = new Client("renderCanvas");

const exampleGameConfig = {
	type: "config",

	payload:
	{
		gameMode: "multiple", // "local", "online", "tournament", "ai"

		arcade:
		{
			position:
			{
				x: 0,
				y: 0,
				z: 0
			},
			type: "classic", // "classic", "modern", "pong1971"
			machine:
			{
				path: "../models/arcade/classic/",
				model: "arcade.obj",
				colors:
				{
					body: "#FF0000",
					sides: "#00FF00",
					joystick: "#0000FF",
					buttons: "#FFFF00"
				}
			}
		},
		gameRender:
		{
			colors:
			{
				background: "#000000",
				paddle: "#FFFFFF",
				ball: "#FFFFFF",
				text: "#FFFFFF",
				accent: "#00FF00"
			},
			paddleSize:
			{
				width: constants.PADDLE_WIDTH,
				height: constants.PADDLE_HEIGHT,
			},
			ball:
			{
				radius: constants.BALL_RADIUS
			}
		},
	}
};

function gameStart()
{
	document.getElementById("startButton").style.display = "none";
	document.getElementById("localgame").style.display = "none";
	document.getElementById("customgame").style.display = "none";
	try
	{
		client.initialize(exampleGameConfig.payload);
	}
	catch (error)
	{
		console.error('❌ Error initializing client:', error);
		return;
	}
	client.startGame();
}

function localGameStart()
{
	exampleGameConfig.payload.gameMode = "local";
	gameStart();
}

function customGameStart()
{
	exampleGameConfig.payload.gameMode = "custom";
	gameStart();
}

window.gameStart = gameStart;
window.localGameStart = localGameStart;
window.customGameStart = customGameStart;
