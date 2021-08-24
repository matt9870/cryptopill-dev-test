// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const Identity = sequelize.define(
	"identity",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		type: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		number: {
			type: Sequelize.STRING(100),
			allowNull: false,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
	},
	{
		timestamps: false,
		tableName: "identity",
	}
);

export default Identity;
