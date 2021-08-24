// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const PharmacyWorkplaces = sequelize.define(
	"pharmacy_workplaces",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		workplace_name: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		is_franchise: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		franchise_name: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		new_franchise_name: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		phone_number: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		license_number: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		new_license_number: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		gst_number: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		new_gst_number: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		address_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
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
		discount: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			defaultValue: 0,
		},
		status_code: {
			type: Sequelize.INTEGER(1),
			allowNull: true
		}
	},
	{
		timestamps: true,
		tableName: "pharmacy_workplaces",
	}
);

export default PharmacyWorkplaces;
