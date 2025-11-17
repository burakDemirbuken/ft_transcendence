import Room from "./Room.js";
import aiNetwork from "./AiNetworkManager.js";
export default class AIRoom extends Room
{

	constructor(gameSettings, aiSettings, id)
	{
		if (!aiSettings)
			throw new Error('AI settings must be provided for AI rooms');
		super(gameSettings);
		this.gameMode = 'ai';
		this.id = id;
		this.maxPlayers = 1;
		this.aiSettings = { difficulty: aiSettings.difficulty, custom: {...aiSettings}};
		console.log('🤖 AI Settings:', this.aiSettings); // DEBUG
		this.createdAt = Date.now();
	}

	getState()
	{
		const baseState = super.getState();
		return {
			...baseState,
			aiSettings: this.aiSettings,
		};
	}

	startGame(playerId)
	{
		if (!this.aiSettings)
			throw new Error('AI settings are missing, cannot start AI game');
		aiNetwork.initGame(this.aiSettings.difficulty, this.id, this.aiSettings.custom);
		return super.startGame(playerId);
	}
}
