import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const Referral = sequelize.define(
	"referral",
	{
		id: {
			autoIncrement: true,
			type: Sequelize.INTEGER(11),
			allowNull: false,
			primaryKey: true,
		},
		doctor_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		booking_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		prescriptions_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		referral_name: {
			type: Sequelize.STRING(255),
			allowNull: true,
		},
		workplace_id: {
			type: Sequelize.INTEGER(11),
			allowNull: true,
		},
		workplaceName: {
			type: Sequelize.STRING(255),
			allowNull: true,
		},
		speciality: {
			type: Sequelize.STRING(1000),
			allowNull: true,
		},
	},
	{
		timestamps: false,
		tableName: "referral",
	}
);

export default Referral;
