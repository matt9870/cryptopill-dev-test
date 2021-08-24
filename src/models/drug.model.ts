// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";
import DrugHistory from "./drug_history.model";

const Drug = sequelize.define(
	"drug",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		drug_name: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		also_known_as: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		drug_manufacturer: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		drug_unit: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		packaging: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		drug_salt: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		recommended_dose: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		// need to check field type
		strength: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		drug_route: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		habit_forming: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		narcotics: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		schedule_h: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		administration_rules: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		drug_status: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 1,
		},
		immunisation: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
			defaultValue: 0,
		},
		is_child: {
			type: Sequelize.TINYINT(1),
			defaultValue: 0,
		},
		parent_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
	},
	{
		timestamps: false,
		tableName: "drug",
	}
);

Drug.addHook('beforeUpsert', async (drug: any, opt: any) => {
	let existing: any = await Drug.findOne({ where: { id: drug.id } })
	let bulkData: any = [];
	if (!!existing) {
		let colsChange = Object.keys(existing).filter(el => {
			if (existing[el] != drug[el]) {
				bulkData.push({
					drug_id: drug.id,
					column_name: el,
					old_value: existing[el],
					new_value: drug[el],
					updated_by_user_id: drug.user_id
				})
			}
		})
	}
	await DrugHistory.bulkCreate(bulkData);
});



export default Drug;
