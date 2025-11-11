export default (sequelize, DataTypes, Model) => {

	class MatchHistory extends Model {}

	MatchHistory.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		teamOneId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'teams',
				key: 'id'
			},
			onDelete: 'SET NULL'
		},
		teamTwoId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'teams',
				key: 'id'
			},
			onDelete: 'SET NULL'
		},
		teamOneScore: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		teamTwoScore: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		winnerTeamId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'teams',
				key: 'id'
			},
			onDelete: 'SET NULL'/*  */
		},
		matchStartDate: {
			type: DataTypes.DATE
		},
		matchEndDate: {
			type: DataTypes.DATE
		},
		matchType: {
			type: DataTypes.STRING,
			allowNull: false
		},
		matchSettings: {
			type: DataTypes.JSON,
			allowNull: true
		}
	}, {
		sequelize,
		modelName: 'MatchHistory',
		tableName: 'match_histories'
	})

	return MatchHistory
}
