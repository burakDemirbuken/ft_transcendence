interface AiSettings {
	difficulty: string;
}

interface AiConfig {
	aiSettings: AiSettings;
}

const aiConfig: AiConfig = {
	aiSettings: {
		difficulty: 'hard',
	},
};

export default aiConfig;
