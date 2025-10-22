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

		await sequelize.authenticate()

		/* await sequelize.sync()  */

		fastify.decorate('sequelize', sequelize)

		addFourPeople(sequelize)

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


async function addFourPeople(sequelize) {
	// Seed profiles with associated stats and achievements for local development
	const statsSeed = [
		{ gamesPlayed: 10, gamesWon: 6, gamesLost: 4, gameCurrentStreak: 2, gameLongestStreak: 4, gameTotalDuration: 360, gameMinDuration: 5, xp: 120, ballHitCount: 250, ballMissCount: 40 },
		{ gamesPlayed: 25, gamesWon: 18, gamesLost: 7, gameCurrentStreak: 6, gameLongestStreak: 8, gameTotalDuration: 900, gameMinDuration: 4, xp: 420, ballHitCount: 520, ballMissCount: 90 },
		{ gamesPlayed: 5, gamesWon: 2, gamesLost: 3, gameCurrentStreak: 1, gameLongestStreak: 2, gameTotalDuration: 180, gameMinDuration: 6, xp: 80, ballHitCount: 120, ballMissCount: 55 },
		{ gamesPlayed: 40, gamesWon: 30, gamesLost: 10, gameCurrentStreak: 9, gameLongestStreak: 12, gameTotalDuration: 1500, gameMinDuration: 3, xp: 780, ballHitCount: 890, ballMissCount: 110 }
	]

	const achievementsSeed = [
		{ firstWin: new Date(), hundredWins: null, fiveHundredWins: null, firstTenStreak: null, twentyFiveTenStreak: null, lessThanThreeMin: null },
		{ firstWin: new Date(), hundredWins: new Date(), fiveHundredWins: null, firstTenStreak: new Date(), twentyFiveTenStreak: null, lessThanThreeMin: null },
		{ firstWin: new Date(), hundredWins: null, fiveHundredWins: null, firstTenStreak: null, twentyFiveTenStreak: null, lessThanThreeMin: null },
		{ firstWin: new Date(), hundredWins: new Date(), fiveHundredWins: new Date(), firstTenStreak: new Date(), twentyFiveTenStreak: new Date(), lessThanThreeMin: new Date() }
	]

	for (let i = 0; i < 4; i++) {
		const [profile] = await sequelize.models.Profile.findOrCreate({
			where: {
				userName: `test${i}`,
				displayName: `test_display${i}`
			}
		})

		await sequelize.models.Stat.upsert({
			userId: profile.id,
			...statsSeed[i]
		})

		await sequelize.models.Achievement.upsert({
			userId: profile.id,
			...achievementsSeed[i]
		})
	}
}


