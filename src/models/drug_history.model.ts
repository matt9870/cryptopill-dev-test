// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrugHistory = sequelize.define(
    "drug_history",
    {
        id: {
            autoIncrement: true,
            type: Sequelize.INTEGER(11),
            allowNull: false,
            primaryKey: true,
        },
        drug_id: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        column_name: {
            type: Sequelize.STRING(250),
            allowNull: true,
        },
        old_value: {
            type: Sequelize.STRING(250),
            allowNull: true,
        },
        new_value: {
            type: Sequelize.STRING(250),
            allowNull: false,
        },
        updated_by_user_id: {
            type: Sequelize.INTEGER(11),
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        },
    },
    {
        timestamps: false,
        tableName: "drug_history",
    }
);



export default DrugHistory;