import WebSocketClient from './WebSocketClient.js';
import EventEmitter from '../utils/EventEmitter.js';

class AiNetworkManager extends EventEmitter
{
	constructor()
	{
		super();
		this.socket = new WebSocketClient('ai-server', 3000);

		this.socket.onConnect('open', () => {
			console.log('🤖 Connected to AI server');
		});

		this.socket.onClose('close', () => {
			console.log('⚠️ Disconnected from AI server');
		});

		this.socket.onError('error', (error) => {
			console.error('❌ AI server connection error:', error);
		});

		this.socket.onMessage('message', (data) => {
			try
			{
				const message = JSON.parse(data);
				this.handleMessage(message);
			}
			catch (error)
			{
				console.error('❌ Error parsing AI server message:', error);
			}
		});

		this.socket.connect();
	}

	sendMessage(message)
	{
		if (this.socket.isConnected())
		{
			this.socket.send(message);
		}
		else
		{
			console.warn('⚠️ Cannot send message, AI server is not connected');
		}
	}

	initGame(difficulty, gameId, settings = {})
	{
		let data;
		data = {
			type: 'init_game',
			ai_config:
			{
				difficulty: difficulty
			},
			gameId: gameId,
		};
		if (difficulty === "custom")
			data.ai_config.settings = settings;
		this.sendMessage(JSON.stringify(data));
	}

	handleMessage(message)
	{
		switch (message.type)
		{
			case "game_initialized":
				this.emit('game_initialized', message.game_id);
				break;
			case "ai_decision":
				this.emit(`aiGame${message.game_id}_direction`, message.direction);
				break;
		}
	}

	sendData(gameData)
	{
		if (!this.socket.isConnected())
			throw new Error('AI server is not connected');
		if (!this.gameIds.has(gameId))
			throw new Error(`Game ID ${gameId} not recognized by AI Network Manager`);

		const message = {
			type: 'game_data',
			game_id: gameId,
			data: gameData,
		};
		this.sendMessage(JSON.stringify(message));
	}

}

const instance = new AiNetworkManager();

export default instance;
