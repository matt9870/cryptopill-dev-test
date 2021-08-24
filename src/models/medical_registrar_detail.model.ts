// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const MedicalRegistrarDetail = sequelize.define(
  "medical_registrar_detail",
  {
    id: {
      autoIncrement: true,
      type: Sequelize.INTEGER(11),
      allowNull: false,
      primaryKey: true,
    },
    registration_number: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    registration_year: {
      type: Sequelize.INTEGER(5),
      allowNull: false,
    },
    council_id: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
    },
    doctor_id: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
    },
    organization: {
      type: Sequelize.STRING(250),
      allowNull: true,
    },
  },
  {
    timestamps: false,
    tableName: "medical_registrar_detail",
  }
);

export default MedicalRegistrarDetail;
