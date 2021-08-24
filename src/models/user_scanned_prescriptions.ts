// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const UserScannedDocument = sequelize.define(
    "user_scanned_documents",
    {
        id: {
            autoIncrement: true,
            type: Sequelize.INTEGER(11),
            allowNull: false,
            primaryKey: true,
        },
        user_id: {
            type: Sequelize.INTEGER(11),
            allowNull: true,
        },
        // role_id: {
        //     type: Sequelize.INTEGER(11),
        //     allowNull: true,
        // },
        medical_record_date: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        original_file_name: {
            type: Sequelize.STRING(500),
            allowNull: false,
        },
        file_name: {
            type: Sequelize.STRING(500),
            allowNull: false,
        },
        group_id: {
            type: Sequelize.STRING(500),
            allowNull: true
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
        }
    },
    {
        timestamps: true,
        tableName: "user_scanned_documents",
    }
);

export default UserScannedDocument;
