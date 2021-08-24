import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const AdminRoles = sequelize.define(
	"admin_roles",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		updated_by_user_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
        },
		role_name: {
			type: Sequelize.STRING(255),
			allowNull: false,
        },
        decription: {
			type: Sequelize.STRING(1000),
			allowNull: true,
		},
	},
	{
		timestamps: true,
		tableName: "admin_roles",
	}
);

export default AdminRoles;
