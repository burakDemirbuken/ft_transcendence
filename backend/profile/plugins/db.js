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
			logging: false
		})

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
		Team.belongsTo(Profile, { as: 'PlayerOne', foreignKey: 'playerOneId', targetKey: 'id', onDelete: 'SET NULL' })
		Team.belongsTo(Profile, { as: 'PlayerTwo', foreignKey: 'playerTwoId', targetKey: 'id', onDelete: 'SET NULL' })

		Profile.hasOne(Stats, { foreignKey: 'userId', onDelete: 'CASCADE', hooks: true })
		Stats.belongsTo(Profile, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })

		Profile.hasOne(Achievements, { foreignKey: 'userId', onDelete: 'CASCADE', hooks: true })
		Achievements.belongsTo(Profile, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })

		Team.hasMany(MatchHistory, { foreignKey: 'teamOneId', onDelete: 'SET NULL', hooks: true })
		Team.hasMany(MatchHistory, { foreignKey: 'teamTwoId', onDelete: 'SET NULL', hooks: true })
		Team.hasMany(MatchHistory, { foreignKey: 'winnerTeamId', onDelete: 'SET NULL', hooks: true })
		MatchHistory.belongsTo(Team, { as: 'TeamOne', foreignKey: 'teamOneId', targetKey: 'id', onDelete: 'SET NULL' })
		MatchHistory.belongsTo(Team, { as: 'TeamTwo', foreignKey: 'teamTwoId', targetKey: 'id', onDelete: 'SET NULL' })
		MatchHistory.belongsTo(Team, { as: 'WinnerTeam', foreignKey: 'winnerTeamId', targetKey: 'id', onDelete: 'SET NULL' })

		TournamentHistory.hasMany(Round, { foreignKey: 'tournamentId', sourceKey: 'id', onDelete: 'SET NULL', hooks: true })
		Round.belongsTo(TournamentHistory, { foreignKey: 'tournamentId', targetKey: 'id', onDelete: 'SET NULL' })

		Round.hasMany(RoundMatch, { foreignKey: 'roundNumber', sourceKey: 'roundNumber', onDelete: 'SET NULL', hooks: true })
		RoundMatch.belongsTo(Round, { foreignKey: 'roundNumber', targetKey: 'roundNumber', onDelete: 'SET NULL' })

		await sequelize.sync({ force: false })

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
