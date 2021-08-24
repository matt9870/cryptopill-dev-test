// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const Tests = sequelize.define(
	"tests",
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
		date_time: {
			type: Sequelize.DATE,
			allowNull: true,
		},
		also_known_as: {
			type: Sequelize.STRING(100),
			allowNull: true,
		},
		home_collection: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		status: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: 1,
		},
	},
	{
		timestamps: false,
		tableName: "tests",
	}
);

export default Tests;
