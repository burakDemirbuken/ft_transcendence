import { Sequelize, DataTypes, Model } from '@sequelize/core';

module.exports = (sequelize) => {

    class MatchHistory extends Model {}

    MatchHistory.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        teamOneID: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'Teams',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		teamTwoID: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'Teams',
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
				model: 'Teams',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
        matchStartDate: {
            type: DataTypes.DATE
        },
		matchEndDate: {
			type: DataTypes.DATE
		},
        matchtype: {
            type: DataTypes.STRING,
            allowNull: false
        },
	}, {
        sequelize,
        modelName: 'MatchHistory',
        tableName: 'match_histories'
    })

    return MatchHistory
}
