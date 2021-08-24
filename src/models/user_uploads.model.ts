// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const UserUploads = sequelize.define(
    "user_uploads",
    {
        id: {
            autoIncrement: true,
            type: Sequelize.INTEGER(11),
            allowNull: false,
            primaryKey: true,
        },
        user_role_id: {
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
        document_type: {
            type: Sequelize.STRING(500),
            allowNull: true
        },
        key: {
            type: Sequelize.STRING(500),
            allowNull: true
        },
        entered_date: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        tableName: "user_uploads",
    }
);

export default UserUploads;
