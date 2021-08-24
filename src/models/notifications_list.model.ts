// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const NotificationsList = sequelize.define(
    "notifications_list",
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
        },
        user_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        role_id: {
            type: Sequelize.STRING(255), // patient,doctor,staff,pharmacy,lab
            allowNull: true,
        },
        is_admin: {
            type: Sequelize.TINYINT(1),
            allowNull: false,
            defaultValue: 0,
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
            type: Sequelize.JSON,
            allowNull: true,
        },

        // email_notification: {
        // 	type: Sequelize.TINYINT(1),
        // 	allowNull: false,
        // 	defaultValue: 0,
        // },
        // sms_notification: {
        // 	type: Sequelize.TINYINT(1),
        // 	allowNull: false,
        // 	defaultValue: 0,
        // },
        // push_notification: {
        // 	type: Sequelize.TINYINT(1),
        // 	allowNull: false,
        // 	defaultValue: 0,
        // },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        },

    },
    {
        timestamps: true,
        tableName: "notifications_list",
    }
);

export default NotificationsList;
