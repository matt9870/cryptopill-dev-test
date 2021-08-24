// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";
import DrWorkplaceUsers from "./dr_workplace_users.model";
import DrPatientAppoiment from "./dr_patient_appoiment.model";

const dr_Workplaces = sequelize.define(
	"dr_workplaces",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		workplace_name: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
		time_per_appointment: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		consultation_fee: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		email: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		verify_email: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		workplace_contact_number: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		address_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		}
	},
	{
		timestamps: true,
		tableName: "dr_workplaces",
	}
);

export default dr_Workplaces;
