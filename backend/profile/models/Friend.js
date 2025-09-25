export default (sequelize, DataTypes, Model) => {

    class Friend extends Model {}

    Friend.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userid: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'profiles',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        peerid: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'profiles',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['userid', 'peerid']
            }
        ],
        sequelize,
        modelName: 'Friend',
        tableName: 'friends'
    })

    return Friend
}
