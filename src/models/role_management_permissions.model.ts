// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const RolePermissions = sequelize.define(
	"role_management_permissions",
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
		add_roles: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		edit_roles: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		delete_roles: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		manage_admins: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
	},
	{
		timestamps: false,
		tableName: "role_management_permissions",
	}
);

export default RolePermissions;
