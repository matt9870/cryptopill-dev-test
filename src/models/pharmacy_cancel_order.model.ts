// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PharmacyCancelOrder = sequelize.define(
	"pharmacy_cancel_order",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		order_id: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
		pharmacy_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		cancel_reason: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
		order_request_pharmacy_id: {
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
		tableName: "pharmacy_cancel_order",
	}
);

export default PharmacyCancelOrder;
