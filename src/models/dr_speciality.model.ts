// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrSpeciality = sequelize.define(
	"dr_speciality",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		d_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		speciality_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "specialities_speciality",
			// 	},
			// 	key: "id",
			// },
		},
	},
	{
		timestamps: false,
		tableName: "dr_speciality",
	}
);

export default DrSpeciality;
