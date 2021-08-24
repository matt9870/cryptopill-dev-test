// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const LabWorkplaceUsers = sequelize.define(
    "lab_workplace_users",
    {
        id: {
            autoIncrement: true,
            type: Sequelize.INTEGER(11),
            allowNull: false,
            primaryKey: true,
        },
        workplace_id: {
            type: Sequelize.INTEGER(11),
            allowNull: false,
        },
        user_id: {
            type: Sequelize.INTEGER(11),
            allowNull: false,
        }
    },
    {
        timestamps: true,
        tableName: "lab_workplace_users",
    }
);

export default LabWorkplaceUsers;
