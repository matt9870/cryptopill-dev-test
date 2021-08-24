// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PatientOrderPharmacy = sequelize.define(
	"patient_order_pharmacy",
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
		// order_type: {
		// 	type: Sequelize.ENUM("request", "accept"),
		// 	//type: Sequelize.STRING(250),
		// 	allowNull: false,
		// 	defaultValue: "request",
		// },
		prescription_type: {
			type: Sequelize.ENUM("electronic", "scanned"),
			//type: Sequelize.STRING(250),
			allowNull: false,
			defaultValue: "electronic",
		},
		// full_order: {
		// 	type: Sequelize.TINYINT(1),
		// 	allowNull: false,
		// 	defaultValue: 0,
		// },
		// partial_order: {
		// 	type: Sequelize.TINYINT(1),
		// 	allowNull: false,
		// 	defaultValue: 0,
		// },
		// substituted_medicines: {
		// 	type: Sequelize.TINYINT(1),
		// 	allowNull: false,
		// 	defaultValue: 0,
		// },
		// is_cancelled: {
		// 	type: Sequelize.TINYINT(1),
		// 	allowNull: true,
		// 	defaultValue: 0,
		// },
		// order_status: {
		// 	type: Sequelize.ENUM("pickup", "delivery"),
		// 	//type: Sequelize.STRING(50),
		// 	allowNull: false,
		// 	defaultValue: "delivery",
		// },
		patient_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		pharmacy_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
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
		request_pharmacy_id: {
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
		tableName: "patient_order_pharmacy",
	}
);

export default PatientOrderPharmacy;
