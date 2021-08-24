// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const Timeouts = sequelize.define(
    "timeouts",
    {
        id: {
            autoIncrement: true,
            type: Sequelize.INTEGER(11),
            allowNull: false,
            primaryKey: true,
        },
        timeout_for: {
            type: Sequelize.STRING(250),
            allowNull: false,
            unique: true
        },
        time_minutes: {
            type: Sequelize.INTEGER(5),
            allowNull: false,
        },

    },
    {
        timestamps: false,
        tableName: "timeouts",
    }
);

export default Timeouts;
