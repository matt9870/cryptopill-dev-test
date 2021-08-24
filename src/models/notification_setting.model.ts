// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const NotificationSetting = sequelize.define(
	"notification_setting",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		email_notification: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		sms_notification: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
		},
		push_notification: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 1,
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
		role_id: {
			type: Sequelize.INTEGER,
			allowNull: false,
		},
		is_admin: {
			type: Sequelize.TINYINT(1),
			allowNull: false,
			defaultValue: 0,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
	},
	{
		timestamps: false,
		tableName: "notification_setting",
	}
);

export default NotificationSetting;
