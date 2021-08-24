// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PharmacyDrug = sequelize.define(
    "pharmacy_drug",
    {
        id: {
            autoIncrement: true,
            type: Sequelize.INTEGER(11),
            allowNull: false,
            primaryKey: true,
        },
        drug_id: {
            type: Sequelize.INTEGER(11),
            allowNull: false,

        },
        pharmacy_id: {
            type: Sequelize.INTEGER(11),
            allowNull: true,
        },
        cost: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
    },
    {
        timestamps: false,
        tableName: "pharmacy_drug",
    }
);

export default PharmacyDrug;
