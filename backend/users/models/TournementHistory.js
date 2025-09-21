import { Sequelize, DataTypes, Model } from '@sequelize/core';

module.exports = (sequelize) => {

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
		modelName: 'TournamentHistory',
		tableName: 'tournament_histories'
	})
	
	return TournamentHistory
}
