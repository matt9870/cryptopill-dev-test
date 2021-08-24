// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const AppPermissions = sequelize.define(
	"app_management_permissions",
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
		addresses: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		drug_information: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		allergies: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		specialities: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		lab_tests: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		medical_conventions: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
	},
	{
		timestamps: false,
		tableName: "app_management_permissions",
	}
);

export default AppPermissions;
