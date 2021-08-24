// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const AddressHistory = sequelize.define(
	"address_history",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		address: {
			type: Sequelize.STRING(250),
			allowNull: false,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			//   model: {
			//     tableName: 'users',
			//   },
			//   key: 'id'
			// }
		},
		workplaces_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			//   model: {
			//     tableName: 'workplaces',
			//   },
			//   key: 'id'
			// }
		},
	},
	{
		timestamps: false,
		tableName: "address_history",
	}
);

export default AddressHistory;
