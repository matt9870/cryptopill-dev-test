// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const UserEmergencyContact = sequelize.define(
    "user_emergency_contact",
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
        last_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        contact_number: {
            type: Sequelize.STRING(20),
            allowNull: false,
        },
        user_id: {
            type: Sequelize.INTEGER(),
            allowNull: false
        }
    },
    {
        timestamps: false,
        tableName: "user_emergency_contact",
    }
);

export default UserEmergencyContact;


