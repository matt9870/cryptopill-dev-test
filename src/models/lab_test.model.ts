// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const LabTest = sequelize.define(
  "lab_test",
  {
    id: {
      autoIncrement: true,
      type: Sequelize.INTEGER(11),
      allowNull: false,
      primaryKey: true,
    },
    cost: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
    },
    home_collection_charges: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
    },
    lab_id: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
      // references: {
      // 	model: {
      // 		tableName: "workplaces",
      // 	},
      // 	key: "id",
      // },
    },
    tests_id: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
      // references: {
      // 	model: {
      // 		tableName: "tests",
      // 	},
      // 	key: "id",
      // },
    },
    home_collection: {
      type: Sequelize.INTEGER(1),
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    timestamps: false,
    tableName: "lab_test",
  }
);

export default LabTest;
