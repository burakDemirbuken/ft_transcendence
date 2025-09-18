import { Sequelize, DataTypes, Model } from '@sequelize/core';

module.exports = (sequelize) => {

    class Stats extends Model {}

    Stats.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        gamesPlayed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        gamesWon: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        gamesLost: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        xp: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        /*level: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }*/
	}, {
        sequelize,
        modelName: 'Stats',
        tableName: 'stats'
    })

    return Stats
}
