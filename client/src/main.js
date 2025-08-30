import * as constants from './utils/constants.js';
import App from './App.js';
import tournamentConfig from './json/TournamentConfig.json' assert { type: 'json' };
import localconfig from './json/LocalConfig.json' assert { type: 'json' };
import aiConfig from './json/AiConfig.json' assert { type: 'json' };
import customConfig from './json/CustomConfig.json' assert { type: 'json' };
import multiplayerConfig from './json/MultiplayerConfig.json' assert { type: 'json' };


const app = new App();
let gameState = {
	isInGame: false,
	gameMode: null,
	tournamentData: null
};

const ip = window.location.hostname;
const port = 3030;


const exampleGameConfig =
{
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

const exampleCustomProperties =
{
	canvasWidth: 800,
	canvasHeight: 600,

	paddleWidth: 10,
	paddleHeight: 100,
	paddleSpeed: 700,

	ballRadius: 7,
	ballSpeed: 600,
	ballSpeedIncrease: 100,

	maxPlayers: 2,

	maxScore: 11
};

localGameStart()
{
	app.localGameStart();
}

function nABERmUDUR()
{
	app.startGame();
}

// Call app initialization when DOM is ready
if (document.readyState === 'loading')
	document.addEventListener('DOMContentLoaded', () => {
		console.log('🚀 DOM loaded, App already initialized');
	});
else
	console.log('🚀 DOM already loaded, App already initialized');

// Note: All functions are now exported by App.js
// App.js handles all game initialization and room management
// Global exports are handled automatically by App._setupGlobalExports()

// Export game state for other modules
window.gameState = gameState;
window.app = app;
window.nABERmUDUR = nABERmUDUR;
