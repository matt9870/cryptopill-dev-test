// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const SpecialitiesSymptoms = sequelize.define(
	"specialities_symptoms",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		symptoms_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "symptoms",
			// 	},
			// 	key: "id",
			// },
		},
		speciality_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "specialities_speciality",
			// 	},
			// 	key: "id",
			// },
		},
		health_concerns_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "specialities_health_concerns",
			// 	},
			// 	key: "id",
			// },
		},
	},
	{
		timestamps: false,
		tableName: "specialities_symptoms",
	}
);

export default SpecialitiesSymptoms;
