export default (sequelize, DataTypes, Model) => {

	class Stats extends Model {}

	Stats.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'profiles',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		gamesPlayed: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		gamesWon: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		gamesLost: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		gameCurrentStreak: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		gameLongestStreak: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		gameTotalDuration: {
			type: DataTypes.BIGINT,
			defaultValue: 0
		},
		fastestWinDuration: {
			type: DataTypes.BIGINT,
			defaultValue: 0
		},
		longestMatchDuration: {
			type: DataTypes.BIGINT,
			defaultValue: 0
		},
		gameMinDuration: {
			type: DataTypes.BIGINT,
			defaultValue: 0
		},
		xp: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		ballHitCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		ballMissCount: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		}
	}, {
		indexes: [
			{
				unique: true,
				fields: ['userId']
			}
		],
		sequelize,
		modelName: 'Stat',
		tableName: 'stats'
	})

	return Stats
}
