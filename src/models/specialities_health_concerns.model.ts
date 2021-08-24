// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const SpecalitiesHealthConcerns = sequelize.define(
	"specialities_health_concerns",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
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
		tableName: "specialities_health_concerns",
	}
);

export default SpecalitiesHealthConcerns;
