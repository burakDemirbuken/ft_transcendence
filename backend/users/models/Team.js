import { Sequelize, DataTypes, Model } from '@sequelize/core';

module.exports = (sequelize) => {

	class Team extends Model {}

	Team.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		playerOneId: {
			type: DataTypes.STRING,
			allowNull: false,
			references: {
				model: 'Users',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		playerTwoId: {
			type: DataTypes.STRING,
			allowNull: false,
			references: {
				model: 'Users',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
	}, {
		sequelize,
		modelName: 'Team',
		tableName: 'teams'
	})

	return Team
}