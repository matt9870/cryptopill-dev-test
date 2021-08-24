// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrUsers = sequelize.define(
	"dr_users",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		experience: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		medical_convention: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		prescription_limit: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		prescription_days_week_month: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		doctor_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
		is_Profession_Verified: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		profession_status_code: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			defaultValue: 0,
		},
		video_call: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0
		},
		audio_call: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0
		},
		physical_examination: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0
		},
	},
	{
		timestamps: false,
		tableName: "dr_users",
	}
);

export default DrUsers;
