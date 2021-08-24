// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const Allergies = sequelize.define(
	"allergies",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		name: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		merge_allergies_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "allergies",
			// 	},
			// 	key: "id",
			// },
		},
		date_time: {
			type: Sequelize.DATE,
			allowNull: true,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
		// is_approv: {
		// 	type: Sequelize.INTEGER(1),
		// 	allowNull: true,
		// 	defaultValue: -1,
		// },
		status: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: -1,
		},
	},
	{
		timestamps: false,
		tableName: "allergies",
	}
);

export default Allergies;
