import gameConfig from './GameConfig.js';

interface TournamentSettings {
	name: string;
	maxPlayers: number;
}

interface TournamentConfig {
	tournamentSettings: TournamentSettings;
	gameSettings?: any;
}

const tournamentConfig: TournamentConfig = {
	...gameConfig,
	tournamentSettings:
	{
		name: 'Default Tournament',
		maxPlayers: 4,
	}
};

export default tournamentConfig;
