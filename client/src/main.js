import Client from './Client.js';

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
				width: 8,
				height: 45,
			},
			ball:
			{
				radius: 6
			}

		},
	}
};

function gameStart()
{
	client.initialize(exampleGameConfig.payload);
	client.startGame();
	document.getElementById("startButton").style.display = "none"; // Hide the button after starting the game
}

// ES6 modüllerinde global fonksiyon yapmak için window objesine ekliyoruz
window.gameStart = gameStart;
