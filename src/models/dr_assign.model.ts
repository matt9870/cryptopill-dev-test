// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrAssign = sequelize.define(
	"dr_assign",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		dr_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
		assign_dr_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
		manage_appoiment: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		block_unblock_schedule: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		workplace_schedule: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
	},
	{
		timestamps: false,
		tableName: "dr_assign",
	}
);

export default DrAssign;
