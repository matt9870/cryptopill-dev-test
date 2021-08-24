// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const HealthConcerns = sequelize.define(
	"health_concerns",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		name: {
			type: Sequelize.STRING(100),
			allowNull: true,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		date_time: {
			type: Sequelize.DATE,
			allowNull: true,
		},
		status: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: 1,
		},
	},
	{
		timestamps: false,
		tableName: "health_concerns",
	}
);

export default HealthConcerns;
