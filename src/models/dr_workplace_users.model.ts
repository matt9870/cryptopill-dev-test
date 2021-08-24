// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrWorkplaceUsers = sequelize.define(
    "dr_workplace_users",
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
        },
        active_workplace: {
            type: Sequelize.INTEGER(1),
            allowNull: true,
            defaultValue: 1,
        }
    },
    {
        timestamps: true,
        tableName: "dr_workplace_users",
    }
);

export default DrWorkplaceUsers;
