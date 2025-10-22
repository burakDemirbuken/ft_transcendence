export default (sequelize, DataTypes, Model) => {

	class Round extends Model {}

	Round.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		roundNumber: {
			type: DataTypes.INTEGER,
			foreignKey: true,
			allowNull: false
		},
		tournamentId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'tournament_histories',
				key: 'id'
			},
			onDelete: 'CASCADE'
		}
	}, {
		indexes: [
  			{
				unique: true,
				fields: ['tournamentId', 'roundNumber']
			},
		],
		sequelize,
		modelName: 'Round',
		tableName: 'rounds'
	})

	return Round
}
