import Paddle from '../Objects/Paddle.js';
import PingPongBase from "../core/PingPongBase";

const DEFAULT_PADDLE_WIDTH = 20;
const DEFAULT_PADDLE_HEIGHT = 100;
const DEFAULT_PADDLE_SPACE = 20;



class ClassicPingPong extends PingPongBase
{
	constructor(parameters)
	{
		super('classic', parameters);

	}

	initializeGame()
	{

	}

	addPlayer(player)
	{
		if (this.players.size >= this.maxPlayers)
			throw new Error('Maximum number of players reached');

		this.players.push(player);
		const paddle = null;
		if (this.players.length === 1)
			paddle = new Paddle(
				DEFAULT_PADDLE_SPACE,
				this.gameArea.height / 2 - DEFAULT_PADDLE_HEIGHT / 2,
				DEFAULT_PADDLE_WIDTH,
				DEFAULT_PADDLE_HEIGHT,
				this.gameArea
			);
		else if (this.players.length === 2)
			paddle = new Paddle(
				this.gameArea.width - DEFAULT_PADDLE_SPACE - DEFAULT_PADDLE_WIDTH,
				this.gameArea.height / 2 - DEFAULT_PADDLE_HEIGHT / 2,
				DEFAULT_PADDLE_WIDTH,
				DEFAULT_PADDLE_HEIGHT,
				this.gameArea
			);
		this.paddles.set(player.id, paddle);
	}

	
}

export default ClassicPingPong;
