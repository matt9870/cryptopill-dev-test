// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const Symptoms = sequelize.define(
	"symptoms",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		name: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		status: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: 1,
		},
	},
	{
		timestamps: false,
		tableName: "symptoms",
	}
);

export default Symptoms;
