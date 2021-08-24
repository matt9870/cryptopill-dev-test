// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PatientLinkedAccountTemprory = sequelize.define(
    "patient_linked_account_temprory",
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
        linked_account_id: {
            type: Sequelize.INTEGER(11),
            allowNull: true,
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
        is_active_link: {
            type: Sequelize.INTEGER(1),
            defaultValue: 0,
        },
        is_edited: {
            type: Sequelize.INTEGER(1),
            defaultValue: 0,
        },

    },
    {
        timestamps: true,
        tableName: "patient_linked_account_temprory",
    }
);

export default PatientLinkedAccountTemprory;
