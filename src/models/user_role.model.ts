// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const UserRole = sequelize.define(
	"user_role",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		role_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		isSetupComplete: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		verify_account: {
			type: Sequelize.INTEGER,
			allowNull: true,
			defaultValue: 0,
		},
		active_status: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 1,
		},
		isWorkplaceAdmin: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		status_code: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			defaultValue: 0,
		},
		verified_on:{
			type: Sequelize.DATE,
			allowNull: true
		}
	},
	{
		timestamps: false,
		tableName: "user_role",
	}
);

export default UserRole;
