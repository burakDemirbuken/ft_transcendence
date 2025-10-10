export default (sequelize, DataTypes, Model) => {

	class TournamentHistory extends Model {}

	TournamentHistory.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		roundID: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'rounds',
				key: 'id'
			},
			onDelete: 'SET NULL'
		},
		tournementDate: {
			type: DataTypes.DATE,
		}
	}, {
		sequelize,
		modelName: 'TournamentHistory',
		tableName: 'tournament_histories'
	})
	
	return TournamentHistory
}
