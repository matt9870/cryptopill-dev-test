// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const Qualifications = sequelize.define(
	"qualifications",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		education: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "qualifications",
	}
);

export default Qualifications;
