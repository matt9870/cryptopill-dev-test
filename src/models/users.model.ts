// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";
import DrUsers from "./dr_users.model";
import UserRole from "./user_role.model";
import DrWorkplaceUsers from "./dr_workplace_users.model";
import DrSpeciality from "./dr_speciality.model";
import DrPatientAppoiment from "./dr_patient_appoiment.model";
import LabWorkplaceUsers from "./lab_workplace_users.model";

const Users = sequelize.define(
	"users",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		first_name: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
		middle_name: {
			type: Sequelize.STRING(255),
			allowNull: true,
		},
		last_name: {
			type: Sequelize.STRING(255),
			allowNull: false,
		},
		password: {
			type: Sequelize.STRING(255),
			allowNull: true,
		},
		email: {
			type: Sequelize.STRING(255),
			allowNull: true,
		},
		gender: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		birth_date: {
			type: Sequelize.DATEONLY,
			allowNull: true,
		},
		profile_image: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		new_profile_image: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		contact_number: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		created_at: {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
		},
		updated_at: {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
		},
		otp_timer: {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
		},
		account_activation: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			// TODO: account activation set to 1 temp .. need to work
			defaultValue: 1,
		},
		profile_image_verify: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		lab_or_pharma_employement_number: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		email_verify: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		phone_otp: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},

		token: {
			type: Sequelize.STRING(3000),
			allowNull: true,
		},
		phone_verify: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		default_role: {
			type: Sequelize.INTEGER,
			allowNull: true,
		},
		isAdmin: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		deviceToken: {
			type: Sequelize.STRING(1000),
			allowNull: true,
		},
		deviceType: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		fcmToken: {
			type: Sequelize.STRING(1000),
			allowNull: true,
		},
		image_status_code: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			defaultValue: 0,
		},
		is_minor_account: {
			type: Sequelize.TINYINT(1),
			defaultValue: 0,
		},
		parent_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
	},
	{
		timestamps: false,
		tableName: "users",
	}
);

export default Users;
