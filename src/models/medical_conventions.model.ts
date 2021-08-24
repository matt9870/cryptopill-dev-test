// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const MedicalConventions = sequelize.define(
	"medical_conventions",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		name: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		date_time: {
			type: Sequelize.DATE,
			allowNull: true,
		},
		status: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: 1,
		},
	},
	{
		timestamps: false,
		tableName: "medical_conventions",
	}
);

export default MedicalConventions;
