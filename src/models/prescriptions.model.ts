// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const Prescriptions = sequelize.define(
	"prescriptions",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		booking_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		diagnosis: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		comments: {
			type: Sequelize.STRING(1000),
			allowNull: true,
		},
		followUpDuration: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			defaultValue: 0,
		},
		followUpDurationType: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		is_expired: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		is_repeatable_prescriptions: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		user_upload_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		createdAt: {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
		},
		updatedAt: {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
		},
	},
	{
		timestamps: true,
		tableName: "prescriptions",
	}
);

export default Prescriptions;
