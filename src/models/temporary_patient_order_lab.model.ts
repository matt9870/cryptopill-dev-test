// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const TemporaryPatientOrderLab = sequelize.define(
	"temporarypatient_order_lab",
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
		prescription_type: {
			type: Sequelize.ENUM("electronic", "scanned"),
			//type: Sequelize.STRING(250),
			allowNull: false,
			defaultValue: "electronic",
		},
		custom_order: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		patient_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		lab_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		booking_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		prescription_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		scanned_doc_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		doctor_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		is_repeatable_prescriptions: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		temporary_request_lab_id: {
			type: Sequelize.INTEGER(11),
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
		tableName: "temporarypatient_order_lab",
	}
);

export default TemporaryPatientOrderLab;
