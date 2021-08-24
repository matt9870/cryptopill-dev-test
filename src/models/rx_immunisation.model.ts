// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const RxImmunisation = sequelize.define(
	"rximmunisation",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		substitute_name: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		substitute_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		isSubstitute: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		medicine_name: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
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
			type: Sequelize.INTEGER(11),
			allowNull: false,
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
		is_repeatable_medicine: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
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
		repeat_after_type: {
			type: Sequelize.STRING(50),
			allowNull: true,
			defaultValue: "Days",
		},
	},
	{
		timestamps: false,
		tableName: "rximmunisation",
	}
);

export default RxImmunisation;