// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const UserPermissions = sequelize.define(
	"user_management_permissions",
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
			// references: {
			// 	model: {
			// 		tableName: "roles",
			// 	},
			// 	key: "id",
			// },
		},
		patient: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		doctor_support_staff: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		pharmacists: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		laboratory_employees: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
	},
	{
		timestamps: false,
		tableName: "user_management_permissions",
	}
);

export default UserPermissions;
