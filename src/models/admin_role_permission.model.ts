import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const AdminRolePermission = sequelize.define(
	"admin_role_permission",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
        role_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
        },
        permission_id: {
            type: Sequelize.INTEGER(11),
            allowNull: false,
        },
        permission_name: {
			type: Sequelize.STRING(255),
			allowNull: false,
        },
	},
	{
		timestamps: true,
		tableName: "admin_role_permission",
	}
);

export default AdminRolePermission;
