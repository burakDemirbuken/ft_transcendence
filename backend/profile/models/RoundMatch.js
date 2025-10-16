export default (sequelize, DataTypes, Model) => {
	class RoundMatch extends Model {}

	RoundMatch.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		roundId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'Round',
				key: 'id'
			},
			onDelete: 'SET NULL'
		},
		roundNumber: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		matchNumber: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		playerOneID: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'Profile',
				key: 'id'
			},
			onDelete: 'SET NULL'
		},
		playerTwoID: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'Profile',
				key: 'id'
			},
			onDelete: 'SET NULL'
		},
		playerOneScore: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		playerTwoScore: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		winnerPlayerID: {
			type: DataTypes.INTEGER,
			allowNull: true,
			references: {
				model: 'Profile',
				key: 'id'
			},
			onDelete: 'SET NULL'
		}
	}, {
		sequelize,
		modelName: 'RoundMatch',
		tableName: 'round_matches'
	})

	return RoundMatch
}
