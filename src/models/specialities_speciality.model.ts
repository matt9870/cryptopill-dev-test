// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";
import DrSpeciality from "./dr_speciality.model";

const Speciality = sequelize.define(
	"specialities_speciality",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		is_approv: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: -1,
		},
		name: {
			type: Sequelize.STRING(100),
			allowNull: true,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
		medical_conventions_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "medical_conventions",
			// 	},
			// 	key: "id",
			// },
		},
		date_time: {
			type: Sequelize.DATE,
			allowNull: true,
		},
		status: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: -1,
		},
	},
	{
		timestamps: false,
		tableName: "specialities_speciality",
	}
);

export default Speciality;
