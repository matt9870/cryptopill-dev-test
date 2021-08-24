import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const AdminRoleAssigned = sequelize.define(
	"admin_role_assigned",
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
		role_id: {
			type: Sequelize.INTEGER(255),
			allowNull: false,
        },
	},
	{
		timestamps: true,
		tableName: "admin_role_assigned",
	}
);

export default AdminRoleAssigned;
