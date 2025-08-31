import { Sequelize, DataTypes, Model } from '@sequelize/core';

module.exports = (sequelize) => {

    class User extends Model {}

    User.init({
        id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        displayName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        avatarUrl: {
            type: DataTypes.STRING
        },
        bio: {
            type: DataTypes.TEXT
        },
        sequelize,
        modelName: 'User',
        tableName: 'users'
    })
    return User
}
