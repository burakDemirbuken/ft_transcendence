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
		teamOneID: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'teams',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		teamTwoID: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'teams',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		teamOneScore: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		teamTwoScore: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		winnerTeamID: {
			type: DataTypes.INTEGER,
			defaultValue: null,
			references: {
				model: 'teams',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		matchDate: {
			type: DataTypes.DATE,
		},
	}, {
		sequelize,
		modelName: 'Round',
		tableName: 'rounds'
	})

	return Round
}