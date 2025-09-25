import {Sequelize, DataTypes, Model} from 'sequelize';
import fp from 'fastify-plugin';
import ProfileModel from '../models/Profile.js';
import TeamModel from '../models/Team.js';
import MatchHistoryModel from '../models/MatchHistory.js';
import TournamentHistoryModel from '../models/TournamentHistory.js';
import RoundModel from '../models/Round.js';
import FriendModel from '../models/Friend.js';
import StatsModel from '../models/Stats.js';

export default fp(async (fastify) => {
		const sequelize = new Sequelize({
			dialect: 'sqlite',
			storage: './database/database.sqlite',
			logging: false,
		})

		const Profile = ProfileModel(sequelize, DataTypes, Model);
		const Team = TeamModel(sequelize, DataTypes, Model);
		const MatchHistory = MatchHistoryModel(sequelize, DataTypes, Model);
		const TournamentHistory = TournamentHistoryModel(sequelize, DataTypes, Model);
		const Round = RoundModel(sequelize, DataTypes, Model);
		const Friend = FriendModel(sequelize, DataTypes, Model);
		const Stats = StatsModel(sequelize, DataTypes, Model);

		Profile.hasMany(Team, { foreignKey: 'playerOneId' })
		Profile.hasMany(Team, { foreignKey: 'playerTwoId' })
		Team.belongsTo(Profile, { as: 'PlayerOne', foreignKey: 'playerOneId', targetKey: 'id' })
		Team.belongsTo(Profile, { as: 'PlayerTwo', foreignKey: 'playerTwoId', targetKey: 'id' })

		Profile.hasOne(Stats, { foreignKey: 'userId' })
		Stats.belongsTo(Profile, { foreignKey: 'userId', targetKey: 'id' })

		Team.hasMany(MatchHistory, { foreignKey: 'teamOneID'})
		Team.hasMany(MatchHistory, { foreignKey: 'teamTwoID'})
		Team.hasMany(MatchHistory, { foreignKey: 'winnerTeamID'})
		MatchHistory.belongsTo(Team, { as: 'TeamOne', foreignKey: 'teamOneID', targetKey: 'id' })
		MatchHistory.belongsTo(Team, { as: 'TeamTwo', foreignKey: 'teamTwoID', targetKey: 'id' })
		MatchHistory.belongsTo(Team, { as: 'WinnerTeam', foreignKey: 'winnerTeamID', targetKey: 'id' })

		Team.hasMany(Round, { foreignKey: 'teamOneID'})
		Team.hasMany(Round, { foreignKey: 'teamTwoID'})
		Team.hasMany(Round, { foreignKey: 'winnerTeamID'})
		Round.belongsTo(Team, { as: 'TeamOne', foreignKey: 'teamOneID', targetKey: 'id' })
		Round.belongsTo(Team, { as: 'TeamTwo', foreignKey: 'teamTwoID', targetKey: 'id' })
		Round.belongsTo(Team, { as: 'WinnerTeam', foreignKey: 'winnerTeamID', targetKey: 'id' })

		Profile.hasMany(Friend, { foreignKey: 'userid'})
		Profile.hasMany(Friend, { foreignKey: 'peerid'})
		Friend.belongsTo(Profile, { as: 'User', foreignKey: 'userid', targetKey: 'id' })
		Friend.belongsTo(Profile, { as: 'Peer', foreignKey: 'peerid', targetKey: 'id' })

		Round.hasMany(TournamentHistory, { foreignKey: 'roundID' })
		TournamentHistory.belongsTo(Round, { foreignKey: 'roundID', targetKey: 'id' })

		await sequelize.sync({ alter: true })

		fastify.decorate('sequelize', sequelize)

		fastify.addHook('onClose', async (instance) => {
			fastify.log.info('Closing database connection...')
			try {
				await instance.sequelize.close()
				fastify.log.info('Database connection closed.')
			} catch (err) {
				fastify.log.error('Error closing database connection:', err)
			}
		})

	}, {
		name: 'myDBPlugin',
		fastify: '4.x'
	}
)
