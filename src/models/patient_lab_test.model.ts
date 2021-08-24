// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PatientLabTest = sequelize.define(
	"patient_lab_test",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		test_name: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		details: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		test_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		lab_test_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		patient_home_collection: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		prescriptions_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		order: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		// patient_id: {
		// 	type: Sequelize.INTEGER(11),
		// 	allowNull: false,
		// 	// references: {
		// 	// 	model: {
		// 	// 		tableName: "users",
		// 	// 	},
		// 	// 	key: "id",
		// 	// },
		// },
		// doctor_id: {
		// 	type: Sequelize.INTEGER(11),
		// 	allowNull: false,
		// 	// references: {
		// 	// 	model: {
		// 	// 		tableName: "users",
		// 	// 	},
		// 	// 	key: "id",
		// 	// },
		// },
		image: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		booking_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "patient_lab_test",
	}
);

export default PatientLabTest;
