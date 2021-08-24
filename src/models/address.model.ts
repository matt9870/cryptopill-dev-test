// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";
import { GEOMETRY } from "sequelize";

const Address = sequelize.define(
	"address",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		location: {
			type: GEOMETRY,
			allowNull: false,
		},
		locality: {
			type: Sequelize.STRING(250),
			allowNull: false
		},
		address: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		city: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		pincode: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
	},
	{
		timestamps: false,
		tableName: "address",
	}
);

export default Address;
