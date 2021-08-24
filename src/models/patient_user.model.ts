import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PatientUser = sequelize.define(
    "patient_user",
    {
        id: {
            autoIncrement: true,
            type: Sequelize.INTEGER(11),
            allowNull: false,
            primaryKey: true,
        },
        user_id: {
            type: Sequelize.INTEGER(11),
            allowNull: false,
        },
        blood_group: {
            type: Sequelize.STRING(50),
            allowNull: true,
        },
        address_id: {
            type: Sequelize.INTEGER(11),
            allowNull: true
        }
    },
    {
        timestamps: false,
        tableName: "patient_user",
    }
);

export default PatientUser;
