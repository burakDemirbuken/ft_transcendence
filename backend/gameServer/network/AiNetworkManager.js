import WebSocketClient from './WebSocketClient.js';
import EventEmitter from '../utils/EventEmitter.js';

class AiNetworkManager extends EventEmitter
{
	constructor()
	{
		try
		{
			super();
			this.reconnectTimeout = null;
			this.socket = new WebSocketClient('ai-server', 3003);

			this.socket.onConnect(() => {
				console.log('🤖 Connected to AI server');
				if (this.reconnectTimeout) {
					clearTimeout(this.reconnectTimeout);
					this.reconnectTimeout = null;
				}
			});

			this.socket.onClose(() => {
				console.log('⚠️ Disconnected from AI server');
				if (!this.reconnectTimeout) {
					this.reconnectTimeout = setTimeout(() => {
						this.reconnectTimeout = null;
						this.socket.connect();
					}, 5000);
				}
			});

			this.socket.onError((error) => {
				console.error('❌ AI server connection error:', error);
				if (!this.reconnectTimeout) {
					this.reconnectTimeout = setTimeout(() => {
						this.reconnectTimeout = null;
						this.socket.connect();
					}, 5000);
				}
			});

			this.socket.onMessage((data) => {
				try
				{
					this.handleMessage(data);
				}
				catch (error)
				{
					console.error('❌ Error parsing AI server message:', error);
				}
			});

			this.socket.connect();

		}
		catch (error)
		{
			console.error('❌ Failed to initialize AI Network Manager:', error);
		}
	}

	sendMessage(message)
	{
		if (this.socket.isConnect())
		{
			this.socket.sendRaw(message);
		}
		else
		{
			console.warn('⚠️ Cannot send message, AI server is not connected');
		}
	}

	initGame(difficulty, gameId, settings = {})
	{
		let data = {
			type: 'init_game',
			ai_config: {
				difficulty: difficulty
			},
			game_id: gameId  // Game server'dan gelen ID'yi gönder
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
				this.emit('game_initialized', message);
				break;
			case "ai_decision":
				this.emit(`aiGame${message.game_id}_target`, message.target_y);
				break;
			case "error":
				console.error('❌ AI server error:', message.error);
				break;
		}
	}

	sendData(gameId, gameData)
	{
		if (!this.socket.isConnect())
			throw new Error('AI server is not connected');
		const message = {
			type: 'game_data',
			game_id: gameId,
			...gameData,
		};
		this.sendMessage(JSON.stringify(message));
	}

}

const instance = new AiNetworkManager();

export default instance;
