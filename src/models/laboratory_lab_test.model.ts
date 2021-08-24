// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const LaboratoryLabTests = sequelize.define(
	"laboratorylabtests",
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
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		prescriptions_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		doctor_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		lab_test_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
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
		patient_order_lab_id: {
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
		tableName: "laboratorylabtests",
	}
);

export default LaboratoryLabTests;
