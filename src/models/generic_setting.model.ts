// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const GenericSetting = sequelize.define(
	"generic_setting",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		order_response_time: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		dr_ph_lab_response_time: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		role_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "roles",
			// 	},
			// 	key: "id",
			// },
		},
	},
	{
		timestamps: false,
		tableName: "generic_setting",
	}
);

export default GenericSetting;
