import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const ProfileDetails = sequelize.define(
	"profile_details",
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
            type: Sequelize.INTEGER(1),
            allowNull: false,
        },
        profile_data: {
            type: Sequelize.JSON,
            allowNull: true,
            //defaultValue: '{}',
            // get(): JSON {
            //     return (this.getDataValue('profile_data') && JSON.parse(this.getDataValue('profile_data')))
            // },
            // set(value: any){
            //     this.setDataValue('profile_data', JSON.stringify(value))
            // }
        },
        new_profile_data: {
            type: Sequelize.JSON,
            allowNull: true,
            //defaultValue: '{}',
            // get(): JSON {
            //     return (this.getDataValue('new_profile_data') && JSON.parse(this.getDataValue('new_profile_data')))
            // },
            // set(value: any){
            //     this.setDataValue('new_profile_data', JSON.stringify(value))
            // }
        },
        status_code: {
            type: Sequelize.INTEGER(1),
            allowNull: false,
            defaultValue: 2   
        },
        createdAt: {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
		},
		updatedAt: {
			type: Sequelize.DATE,
			allowNull: false,
			defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
		},
	},
	{
		timestamps: true,
		tableName: "profile_details",
	}
);

export default ProfileDetails;