import {Sequelize, DataTypes, Model} from 'sequelize'
import fp from 'fastify-plugin'
import ProfileModel from '../models/Profile.js'
import TeamModel from '../models/Team.js'
import MatchHistoryModel from '../models/MatchHistory.js'
import TournamentHistoryModel from '../models/TournamentHistory.js'
import RoundModel from '../models/Round.js'
import RoundMatchModel from '../models/RoundMatch.js'
import StatsModel from '../models/Stats.js'
import AchievementsModel from '../models/Achievements.js'

export default fp(async (fastify) => {
		const sequelize = new Sequelize({
			dialect: 'sqlite',
			storage: './database/database.sqlite',
			logging: true
		})

		await sequelize.authenticate()
		await sequelize.query('PRAGMA foreign_keys = ON')

		const Profile = ProfileModel(sequelize, DataTypes, Model)
		const Team = TeamModel(sequelize, DataTypes, Model)
		const MatchHistory = MatchHistoryModel(sequelize, DataTypes, Model)
		const TournamentHistory = TournamentHistoryModel(sequelize, DataTypes, Model)
		const Round = RoundModel(sequelize, DataTypes, Model)
		const RoundMatch = RoundMatchModel(sequelize, DataTypes, Model)
		const Stats = StatsModel(sequelize, DataTypes, Model)
		const Achievements = AchievementsModel(sequelize, DataTypes, Model)
 

		// hasmnyler hasone olabilr
		
		Profile.hasMany(Team, { foreignKey: 'playerOneId', onDelete: 'SET NULL', hooks: true })
		Profile.hasMany(Team, { foreignKey: 'playerTwoId', onDelete: 'SET NULL', hooks: true })
		Team.belongsTo(Profile, { as: 'PlayerOne', foreignKey: 'playerOneId', onDelete: 'SET NULL' })
		Team.belongsTo(Profile, { as: 'PlayerTwo', foreignKey: 'playerTwoId', onDelete: 'SET NULL' })

		Profile.hasOne(Stats, { foreignKey: 'userId', hooks: true })
		Stats.belongsTo(Profile, { foreignKey: 'userId', onDelete: 'CASCADE' })
		Profile.hasOne(Achievements, { foreignKey: 'userId', hooks: true })
		Achievements.belongsTo(Profile, { foreignKey: 'userId', onDelete: 'CASCADE' })

		Team.hasMany(MatchHistory, { foreignKey: 'teamOneId', onDelete: 'SET NULL', hooks: true })
		Team.hasMany(MatchHistory, { foreignKey: 'teamTwoId', onDelete: 'SET NULL', hooks: true })
		Team.hasMany(MatchHistory, { foreignKey: 'winnerTeamId', onDelete: 'SET NULL', hooks: true })
		MatchHistory.belongsTo(Team, { as: 'TeamOne', foreignKey: 'teamOneId', onDelete: 'SET NULL' })
		MatchHistory.belongsTo(Team, { as: 'TeamTwo', foreignKey: 'teamTwoId', onDelete: 'SET NULL' })
		MatchHistory.belongsTo(Team, { as: 'WinnerTeam', foreignKey: 'winnerTeamId', onDelete: 'SET NULL' })

		TournamentHistory.hasMany(Round, { foreignKey: 'tournamentId', onDelete: 'CASCADE', hooks: true })
		Round.belongsTo(TournamentHistory, { foreignKey: 'tournamentId', onDelete: 'CASCADE' })

		Round.hasMany(RoundMatch, { foreignKey: 'roundId', onDelete: 'CASCADE', hooks: true })
		RoundMatch.belongsTo(Round, { foreignKey: 'roundId', onDelete: 'CASCADE' })

		RoundMatch.belongsTo(Profile, { foreignKey: 'playerOneID', onDelete: 'SET NULL'  })
		RoundMatch.belongsTo(Profile, { foreignKey: 'playerTwoID', onDelete: 'SET NULL' })
		RoundMatch.belongsTo(Profile, { foreignKey: 'winnerPlayerID', onDelete: 'SET NULL' })

		TournamentHistory.belongsTo(Profile, { foreignKey: 'winnerPlayer', onDelete: 'SET NULL' })

		Profile.hasMany(RoundMatch, { as: 'playerOne', foreignKey: 'playerOneID' })
		Profile.hasMany(RoundMatch, { as: 'playerTwo', foreignKey: 'playerTwoID' })
		Profile.hasMany(RoundMatch, { as: 'winner', foreignKey: 'winnerPlayerID' })

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
