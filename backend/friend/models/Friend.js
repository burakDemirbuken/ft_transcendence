export default (sequelize, DataTypes, Model) => {

    class Friend extends Model {}

    Friend.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        peerName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted'),
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['userName', 'peerName']
            }
        ],
        sequelize,
        modelName: 'Friend',
        tableName: 'friends'
    })

    return Friend
}
