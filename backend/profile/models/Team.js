export default (sequelize, DataTypes, Model) => {

	class Team extends Model {}

	Team.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		playerOneId: {
			type: DataTypes.STRING,
			allowNull: true,
			references: {
				model: 'profiles',
				key: 'id'
			},
			onDelete: 'SET NULL'
		},
		playerTwoId: {
			type: DataTypes.STRING,
			allowNull: true,
			references: {
				model: 'profiles',
				key: 'id'
			},
			onDelete: 'SET NULL'
		},
	}, {
		sequelize,
		modelName: 'Team',
		tableName: 'teams'
	})

	return Team
}