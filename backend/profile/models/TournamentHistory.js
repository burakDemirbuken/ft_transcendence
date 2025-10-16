export default (sequelize, DataTypes, Model) => {

	class TournamentHistory extends Model {}

	TournamentHistory.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		winnerPlayer: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'Profile',
				key: 'id'
			},
			onDelete: 'SET NULL'
		},
		tournamentDate: {
			type: DataTypes.DATE,
			allowNull: false
		}
	}, {
		sequelize,
		modelName: 'TournamentHistory',
		tableName: 'tournament_histories'
	})

	return TournamentHistory
}
