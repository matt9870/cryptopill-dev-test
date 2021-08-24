// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrDelegate = sequelize.define(
    "dr_delegate",
    {
        id: {
            autoIncrement: true,
            type: Sequelize.INTEGER(11),
            allowNull: false,
            primaryKey: true,
        },
        doctor_id: {
            type: Sequelize.INTEGER(11),
            allowNull: false,
        },
        staff_id: {
            type: Sequelize.INTEGER(11),
            allowNull: false,
        },
        workplaces_id: {
            type: Sequelize.INTEGER(11),
            allowNull: false,
        },
        active_workplace: {
            type: Sequelize.INTEGER(1),
            allowNull: true,
            defaultValue: 1,
        },
        manageAppoinment: {
            type: Sequelize.INTEGER(1),
            allowNull: true,
            defaultValue: 0,
        },
        blockUnblockSchedue: {
            type: Sequelize.INTEGER(1),
            allowNull: true,
            defaultValue: 0,
        },
        changeSchedule: {
            type: Sequelize.INTEGER(1),
            allowNull: true,
            defaultValue: 0,
        }
    },
    {
        timestamps: true,
        tableName: "dr_delegate",
    }
);

export default DrDelegate;
