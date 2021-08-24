import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const RatingReview = sequelize.define(
	"rating_and_review",
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
		patient_id: {
			type: Sequelize.INTEGER(11),
			allowNull: false,
		},
		rating: {
			type: Sequelize.TINYINT(1),
			allowNull: true,
            defaultValue: 1
		},
		review: {
			type: Sequelize.STRING(3000),
			allowNull: true,
		},
	},
	{
		timestamps: true,
		tableName: "rating_and_review",
	}
);

export default RatingReview;
