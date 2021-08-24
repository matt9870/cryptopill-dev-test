// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PharmacyInformation = sequelize.define(
	"pharmacy_information",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		delivery_customer: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		delivery_distance: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		minimum_order_amount: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		minimum_delivery_charges: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		additional_charges: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		minimum_additional_charges: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		workplaces_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
	},
	{
		timestamps: false,
		tableName: "pharmacy_information",
	}
);

export default PharmacyInformation;
