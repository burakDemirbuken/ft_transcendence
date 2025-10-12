export default (sequelize, DataTypes, Model) => {

    class Profile extends Model {}

    Profile.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            unique: true
        },
        userName: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        displayName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        avatarUrl: {
            type: DataTypes.STRING
            //defaultValue: null
        },
        bio: {
            type: DataTypes.TEXT
        },
	}, {
        sequelize,
        modelName: 'Profile',
        tableName: 'profiles'
    })
    return Profile
}
