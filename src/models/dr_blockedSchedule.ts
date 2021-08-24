import sequelize from "../db/sequalise";
import * as Sequelize from "sequelize";

const DrBlockedSchedule = sequelize.define(
  "dr_blocked_schedule",
  {
    id: {
      autoIncrement: true,
      type: Sequelize.INTEGER(11),
      allowNull: false,
      primaryKey: true,
    },
    schedule_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    workplace_id: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
    },
    schedule_id: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
    },
    // is_slot: {
    //   type: Sequelize.INTEGER(1),
    //   defaultValue: 1,
    //   allowNull: false,
    // },
    blocking_reason: {
      type: Sequelize.STRING(250),
      allowNull: true,
    },
    from_time: {
      type: Sequelize.TIME,
      allowNull: false,
      defaultValue: '00:00:00'
    },
    to_time: {
      type: Sequelize.TIME,
      allowNull: false,
      defaultValue: '24:00:00'
    },
  },
  {
    timestamps: false,
    tableName: "dr_blocked_schedule",
  }
);

export default DrBlockedSchedule;
