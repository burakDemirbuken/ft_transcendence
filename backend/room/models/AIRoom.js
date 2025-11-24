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
		aiNetwork.initGame(this.aiSettings.difficulty, this.id, this.aiSettings.custom);
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

}
