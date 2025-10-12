export default (sequelize, DataTypes, Model) => {

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
                model: 'profiles',
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
        gameCurrentStreak: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        gameLongestStreak: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        gameTotalDuration: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        gameMinDuration: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        xp: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        ballHitCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        ballMissCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
	}, {
        sequelize,
        modelName: 'Stats',
        tableName: 'stats'
    })

    return Stats
}
