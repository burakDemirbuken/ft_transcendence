export default (sequelize, DataTypes, Model) => {

    class Profile extends Model {}

    Profile.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        displayName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        avatarUrl: {
            type: DataTypes.STRING,
            defaultValue: '/static/default/'
        },
        bio: {
            type: DataTypes.TEXT,
            defaultValue: 'Hi!'
        },
	}, {
        sequelize,
        modelName: 'Profile',
        tableName: 'profiles'
    })
    return Profile
}
