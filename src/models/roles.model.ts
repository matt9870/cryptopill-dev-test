// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const Roles = sequelize.define(
	"roles",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		role: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "roles",
	}
);

export default Roles;
