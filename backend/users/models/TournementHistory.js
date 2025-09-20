import { Sequelize, DataTypes, Model } from '@sequelize/core';

module.exports = (sequelize) => {

	class TournementHistory extends Model {}

	TournementHistory.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		roundID: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'Rounds',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		tournementDate: {
			type: DataTypes.DATE,
		}
	}, {
		sequelize,
		modelName: 'TournementHistory',
		tableName: 'tournement_histories'
	})
	
	return TournementHistory
}
