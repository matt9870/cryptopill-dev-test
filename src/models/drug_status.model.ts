// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrugStatus = sequelize.define(
	"drug_status",
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
	},
	{
		timestamps: false,
		tableName: "drug_status",
	}
);

export default DrugStatus;
