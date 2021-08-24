// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const TemporaryOrderSummary = sequelize.define(
	"temporary_order_summary",
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
		home_delivery: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		pharmacy_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		selected_medicines_price: {
			type: Sequelize.FLOAT,
			allowNull: false,
		},
		delivery_charges: {
			type: Sequelize.FLOAT,
			allowNull: true,
		},
		additional_delivery_charges: {
			type: Sequelize.FLOAT,
			allowNull: true,
		},
		gst: {
			type: Sequelize.FLOAT,
			allowNull: true,
		},
		discount: {
			type: Sequelize.FLOAT,
			allowNull: true,
		},
		total: {
			type: Sequelize.FLOAT,
			allowNull: true,
		},
		temporary_request_pharmacy_id: {
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
		tableName: "temporary_order_summary",
	}
);

export default TemporaryOrderSummary;
