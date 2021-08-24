import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrFeatures = sequelize.define(
	"dr_features",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		feature_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		}
	},
	{
		timestamps: false,
		tableName: "dr_features",
	}
);

export default DrFeatures;
