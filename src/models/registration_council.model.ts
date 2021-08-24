// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const RegistrationCouncil = sequelize.define(
	"registration_council",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		name: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "registration_council",
	}
);

export default RegistrationCouncil;
