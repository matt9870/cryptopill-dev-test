// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrSchedule = sequelize.define(
	"dr_schedule",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		day: {
			type: Sequelize.STRING(50),
			allowNull: false,
		},
		start_time: {
			type: Sequelize.TIME,
			allowNull: false,
		},
		end_time: {
			type: Sequelize.TIME,
			allowNull: false,
		},
		workplaces_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "workplaces",
			// 	},
			// 	key: "id",
			// },
		},
		doctor_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		slot_available: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		}
	},
	{
		timestamps: false,
		tableName: "dr_schedule",
	}
);

export default DrSchedule;
