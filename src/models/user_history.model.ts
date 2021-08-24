// import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";
import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const UserHistory = sequelize.define(
	"user_history",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		email: {
			type: Sequelize.STRING(250),
			allowNull: true,
		},
		contact_number: {
			type: Sequelize.STRING(50),
			allowNull: true,
		},
		user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
			// references: {
			// 	model: {
			// 		tableName: "users",
			// 	},
			// 	key: "id",
			// },
		},
	},
	{
		timestamps: false,
		tableName: "user_history",
	}
);

export default UserHistory;
