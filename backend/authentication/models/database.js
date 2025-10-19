import	{	Sequelize	}	from	'sequelize';
import		path			from	'path';

const sequelize = new Sequelize(
{
	dialect:						'sqlite',
	storage:						'./data/auth_database.sqlite',
	logging: 						false,

	pool:
	{
	  max:							5,
	  min:							0,
	  acquire:						30000,
	  idle:							10000
	},

	dialectOptions:
	{
		timeout:					20000,
		pragma:
		{
			journal_mode:			'WAL',
			synchronous:			'NORMAL',
			cache_size:				-64000,
			temp_store:				'MEMORY',
			foreign_keys:			true,
			busy_timeout: 			30000,
			wal_autocheckpoint:		1000
		}
	},
	retry:
	{
		match:
		[
			/SQLITE_BUSY/,
			/SQLITE_LOCKED/,
			/database is locked/,
			/ETIMEDOUT/,
		],
		max: 3
	}
});

export const testConnection = async () =>
{
  try
  {
    await sequelize.authenticate();
    console.log(' Auth database connection established successfully');
    return	(	true	);
  }
  catch (error)
  {
	console.error(' Unable to connect to auth database:', error);
	throw	(	error	);
  }
};

export			{	sequelize	};
export default		sequelize;
