// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const RequestLab = sequelize.define(
	"request_lab",
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
		patient_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		order_type: {
			type: Sequelize.ENUM("request", "accept"),
			allowNull: false,
			defaultValue: "request",
		},
		accept_order_lab: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: 0,
		},
		accept_order_patient: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: 0,
		},
		is_cancelled: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		lab_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		order_status: {
			type: Sequelize.ENUM("pickup", "delivery"),
			allowNull: false,
			defaultValue: "delivery",
		},
		order_status_code: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
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
		tableName: "request_lab",
	}
);

export default RequestLab;
