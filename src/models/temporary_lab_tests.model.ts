// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const TemporaryLabTests = sequelize.define(
	"temporarylabtests",
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
		test_name: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},

		details: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},

		booking_id: {
			// Doctor appoiment Booking ID
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		prescriptions_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		// order: {
		// 	type: Sequelize.TINYINT(1),
		// 	allowNull: true,
		// 	defaultValue: 0,
		// },
		// pharmacy_id: {
		// 	type: Sequelize.INTEGER(11),
		// 	allowNull: false,
		// },

		doctor_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
		lab_test_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "drugs",
			// 	},
			// 	key: "id",
			// },
		},
		mrp: {
			type: Sequelize.FLOAT,
			allowNull: false,
		},
		is_home_collection: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 1,
		},
		home_collection_charges: {
			type: Sequelize.FLOAT,
			allowNull: true,
		},
		is_lab_selected: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 1,
		},
		temporary_patient_order_lab_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		lab_test_report: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		report_name: {
			type: Sequelize.STRING(250),
			allowNull: true,
		}
	},
	{
		timestamps: false,
		tableName: "temporarylabtests",
	}
);

export default TemporaryLabTests;
