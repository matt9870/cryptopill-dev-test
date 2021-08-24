// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";
import Prescriptions from "./prescriptions.model";

const DrPatientAppoiment = sequelize.define(
	"dr_patient_appoiment",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		doctor_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
		patient_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
		workplace_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "workplaces",
			// 	},
			// 	key: "id",
			// },
		},
		is_offline: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		date: {
			type: Sequelize.DATEONLY,
			allowNull: true,
		},
		start_time: {
			type: Sequelize.TIME,
			allowNull: false,
		},
		end_time: {
			type: Sequelize.TIME,
			allowNull: false,
		},
		status: {
			type: Sequelize.STRING(50),
			allowNull: true,
			defaultValue: 'Accepted'
		},
		schedule_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		is_cancelled: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		cancelled_reason: {
			type: Sequelize.STRING(1000),
			allowNull: true,
		},
		bookedby: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		cancellby: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		video_call: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0
		},
		audio_call: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0
		},
		physical_examination: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0
		},
		medical_history_shared: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0
		},
		is_patient_recording: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: -1
		},
		is_doctor_recording: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: -1
		},
		recording_url: {
			type: Sequelize.STRING(250),
			allowNull: true,
		}
	},
	{
		timestamps: false,
		tableName: "dr_patient_appoiment",
	}
);

export default DrPatientAppoiment;
