// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const Drugs = sequelize.define(
	"drugs",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		manufacturer_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
			// references: {
			// 	model: {
			// 		tableName: "drug_manufacturer",
			// 	},
			// 	key: "id",
			// },
		},
		name: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		unit_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "drug_unit",
			// 	},
			// 	key: "id",
			// },
		},
		status: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		packaging1: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		packaging2: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		narcotic: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		schedule_h: {
			type: Sequelize.INTEGER(1),
			allowNull: true,
			defaultValue: 0,
		},
		salt: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		strength: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		strength_unit: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		route_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "drug_route",
			// 	},
			// 	key: "id",
			// },
		},
		mrp: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		recommended_dose: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		administration_rules: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		source_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "workplaces",
			// 	},
			// 	key: "id",
			// },
		},
	},
	{
		timestamps: false,
		tableName: "drugs",
	}
);

export default Drugs;
