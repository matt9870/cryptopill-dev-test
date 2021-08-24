// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PatientAllergies = sequelize.define(
	"patient_allergies",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		allergies_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "patient_allergies",
	}
);

export default PatientAllergies;
