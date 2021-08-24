// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrDocument = sequelize.define(
	"dr_document",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		document: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
		date: {
			type: Sequelize.DATEONLY,
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "dr_document",
	}
);

export default DrDocument;
