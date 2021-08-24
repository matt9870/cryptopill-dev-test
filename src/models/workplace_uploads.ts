// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const WorkplaceUploads = sequelize.define(
    "workplace_uploads",
    {
        id: {
            autoIncrement: true,
            type: Sequelize.INTEGER(11),
            allowNull: false,
            primaryKey: true,
        },
        workplace_id: {
            type: Sequelize.INTEGER(11),
            allowNull: true,
        },
        role_id: {
            type: Sequelize.INTEGER(11),
            allowNull: true,
        },
        file_name: {
            type: Sequelize.STRING(500),
            allowNull: false,
        },
        modified_name: {
            type: Sequelize.STRING(500),
            allowNull: false,
        },
        key: {
            type: Sequelize.STRING(1000),
            allowNull: false,
        },
        entered_date: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },

    },
    {
        timestamps: true,
        tableName: "workplace_uploads",
    }
);

export default WorkplaceUploads;
