// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const TemporaryRxImmunisation = sequelize.define(
	"temporaryrximmunisation",
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
		medicine_name: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		// substitute_name: {
		// 	type: Sequelize.STRING(250),
		// 	allowNull: true,
		// },
		strength: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		duration: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		frequency: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		instructions: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		method_of_use: {
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
		medicine_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "drugs",
			// 	},
			// 	key: "id",
			// },
		},
		immunisation: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		repeat_after: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			defaultValue: 0,
		},
		is_substituted: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		substituted: {
			type: Sequelize.JSON,
			allowNull: true,
		},
		is_repeatable_medicine: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		repeat_after_type: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		accepted_risk: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		drug_unit: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		packaging: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		mrp: {
			type: Sequelize.FLOAT,
			allowNull: false,
		},
		// order_type: {
		// 	// type: Sequelize.STRING(250),
		// 	// allowNull: true,
		// 	type: Sequelize.ENUM("Pickup", "Delivery"),
		// 	allowNull: true,
		// 	defaultValue: "Pickup",
		// },
		// full_order: {
		// 	type: Sequelize.TINYINT(1),
		// 	allowNull: true,
		// 	defaultValue: 1,
		// },
		// partial_order: {
		// 	type: Sequelize.TINYINT(1),
		// 	allowNull: true,
		// 	defaultValue: 0,
		// },
		// substituted_medicines: {
		// 	type: Sequelize.TINYINT(1),
		// 	allowNull: true,
		// 	defaultValue: 0,
		// },
		is_pharmacy_selected: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 1,
		},
		temporary_patient_order_pharmacy_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
	},
	{
		timestamps: false,
		tableName: "temporaryrximmunisation",
	}
);

export default TemporaryRxImmunisation;
