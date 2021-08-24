// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const MedicineAlias = sequelize.define(
	"medicine_alias",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		medicine_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		createdAt: {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
		},
		updatedAt: {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
		},
	},
	{
		timestamps: true,
		tableName: "medicine_alias",
	}
);

export default MedicineAlias;
