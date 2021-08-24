// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const NotificationTemplates = sequelize.define(
	"notification_template",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		key: {
			type: Sequelize.STRING(255),
			allowNull: false,
			unique: true
		},
		role_id: {
			type: Sequelize.STRING(255), // patient,doctor,staff,pharmacy,lab
			allowNull: false,
		},
		is_admin: {
			type: Sequelize.TINYINT(1), //0- not, 1- yes
			allowNull: false,
			defaultValue: 0,
		},
		trigger_event_detail: {
			type: Sequelize.STRING(255),
			allowNull: true,
		},
		subject: {
			type: Sequelize.STRING(1000),
			allowNull: true,
		},
		message: {
			type: Sequelize.STRING(5000),
			allowNull: false,
		},
		values: {
			type: Sequelize.STRING(1000),
			allowNull: true,
		},
		email_notification: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: 0,
		},
		sms_notification: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: 0,
		},
		push_notification: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: 0,
		},
		modified_by: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			defaultValue: 3,
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
		tableName: "notification_template",
	}
);

export default NotificationTemplates;
