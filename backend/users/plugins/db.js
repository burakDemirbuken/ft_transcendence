import Sequelize from 'sequelize';
import fp from 'fastify-plugin';
import UserModel from '../models/User.js';
import TeamModel from '../models/Team.js';
import MatchHistoryModel from '../models/MatchHistory.js';
import TournamentModel from '../models/TournamentHistory.js';
import RoundModel from '../models/Round.js';
import FriendModel from '../models/Friend.js';
import StatsModel from '../models/Stats.js';

export default fp(async (fastify) => {
	const sequelize = new Sequelize({
		dialect: 'sqlite',
		storage: './database/database.sqlite',
	})

	const User = UserModel(sequelize);
	const Team = TeamModel(sequelize);
	const MatchHistory = MatchHistoryModel(sequelize);
	const Tournament = TournamentModel(sequelize);
	const Round = RoundModel(sequelize);
	const Friend = FriendModel(sequelize);
	const Stats = StatsModel(sequelize);


	User.hasMany(Team, { foreignKey: 'playerOneId' })
	User.hasMany(Team, { foreignKey: 'playerTwoId' })
	Team.belongsTo(User)

	Team.hasMany(MatchHistory, { foreignKey: 'teamOneID'})
	Team.hasMany(MatchHistory, { foreignKey: 'teamTwoID'})
	Team.hasMany(MatchHistory, { foreignKey: 'winnerTeamID'})
	MatchHistory.belongsTo(Team)

	Team.hasMany(Round, { foreignKey: 'teamOneID'})
	Team.hasMany(Round, { foreignKey: 'teamTwoID'})
	Team.hasMany(Round, { foreignKey: 'winnerTeamID'})
	Round.belongsTo(Team)

	User.hasMany(Friend, { foreignKey: 'userid'})
	User.hasMany(Friend, { foreignKey: 'peerid'})
	Friend.belongsTo(User)

	Round.hasMany(TournamentHistory, { foreignKey: 'roundID' })
	TournamentHistory.belongsTo(Round)

	await sequelize.sync({ alter: true })
	

})
