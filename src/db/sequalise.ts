import { Sequelize } from "sequelize";
import * as config from "config";
import * as clsHook from "cls-hooked";

//Added for issue related to GeoFromText method deprecation form mysql version > 5.6.7
const Wkt = require('terraformer-wkt-parser');
Sequelize.GEOMETRY.prototype._stringify = (value: any, options: any) => 'ST_GeomFromText(' + options.escape(Wkt.convert(value)) + ')'

// creating namepsace from cls changes done by @Krishank
export const namepsace: any = clsHook.createNamespace("cryptopill");
Sequelize.useCLS(namepsace);

const {
	MYSQL_CONFIG: { DATABASE, DIALECT, USERNAME, PASSWORD },

	SERVER,
}: any = config.get("APP");

const sequelize = new Sequelize({
	database: DATABASE,
	dialect: DIALECT,
	username: USERNAME,
	password: PASSWORD,
	query: {
		raw: true,
	},
	define: {
		underscored: false,
		freezeTableName: true,
	},
	operatorsAliases: false,
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000,
	},
	//logging: console.log,
	logging: function (str: any) {
		console.log(str);
		// 	//   console.log(ENVCONFIG.DB_DATABASE)
	},
});

// sequelize.authenticate();

sequelize
	//.authenticate()
	.sync()
	.then(() => {
		console.log("Connection has been established successfully.");
	})
	.catch((err) => {
		console.error("Unable to connect to the database:", err);
	});

export default sequelize;
