// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PatientLinkedAccount = sequelize.define(
	"patient_linked_account",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		requested_by_user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		requested_to_user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		manage_their_account: {
			type: Sequelize.INTEGER(1),
			allowNull: false,
			defaultValue: 0,
		},
		manage_your_account: {
			type: Sequelize.INTEGER(1),
			allowNull: false,
			defaultValue: 0,
		},
		manage_their_medical_history: {
			type: Sequelize.INTEGER(1),
			allowNull: false,
			defaultValue: 0,
		},
		manage_your_medical_history: {
			type: Sequelize.INTEGER(1),
			allowNull: false,
			defaultValue: 0,
		},
		manage_their_minor_account: {
			type: Sequelize.INTEGER(1),
			allowNull: false,
			defaultValue: 0,
		},
		manage_your_minor_account: {
			type: Sequelize.INTEGER(1),
			allowNull: false,
			defaultValue: 0,
		},
		// initially_generated_by: { //will store the user id according to which the permissions are your and their
		// 	type: Sequelize.INTEGER(11),
		// 	allowNull: false,
		// },
		is_edited: {
			type: Sequelize.INTEGER(1),
			defaultValue: 0,
		},

	},
	{
		timestamps: true,
		tableName: "patient_linked_account",
	}
);

export default PatientLinkedAccount;
