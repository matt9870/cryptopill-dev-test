// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PatientVitals = sequelize.define(
	"patient_vitals",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		blood_pressure: {
			type: Sequelize.STRING(250),
			allowNull: true,
			defaultValue: 0,
		},
		heart_rate: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			defaultValue: 0,
		},
		height: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			defaultValue: 0,
		},
		weight: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			defaultValue: 0,
		},
		temp: {
			type: Sequelize.STRING(50),
			allowNull: true,
			defaultValue: 0,
		},
		booking_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "patient_vitals",
	}
);

export default PatientVitals;
