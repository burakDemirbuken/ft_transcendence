import Room from "./Room.js";

export default class AIRoom extends Room
{

	constructor(name, gameSettings, aiSettings)
	{
		if (!aiSettings)
			throw new Error('AI settings must be provided for AI rooms');
		super(name, gameSettings);
		this.gameMode = 'ai';
		this.maxPlayers = 1;
		this.aiSettings = aiSettings;
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
