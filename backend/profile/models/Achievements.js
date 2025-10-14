export default (sequelize, DataTypes, Model) => {

    class Achievements extends Model {}

    Achievements.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'profiles',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        firstWin: {
            type: DataTypes.DATE,
            allowNull: true
        },
        hundredWins: {
            type: DataTypes.DATE,
            allowNull: true
        },
        fiveHundredWins: {
            type: DataTypes.DATE,
            allowNull: true
        },
        firstTenStreak: {
            type: DataTypes.DATE,
            allowNull: true        
        },
        twentyFiveTenStreak: {
            type: DataTypes.DATE,
            allowNull: true
        },
        lessThanThreeMin: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Achievement',
        tableName: 'achievements'
    })

    return Achievements
}
