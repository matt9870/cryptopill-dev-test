import Users from "../../../models/users.model";
import Identity from "../../../models/identity.model";
import dr_Workplaces from "../../../models/dr_workplaces.model";
import { AddressService } from "../../shared/address.service";
import DrWorkplaceUsers from "../../../models/dr_workplace_users.model";
import { fn, col, Op } from "sequelize";
import Address from "../../../models/address.model";
import { UserService } from "../user/user.service";
import { BadRequestError } from "routing-controllers";
import { UserRoleService } from "../../shared/user-role.service";
import { Notifications, Utils } from "../../../helpers";
import { FileService } from "../../shared/file.service";
import { RolesEnum } from "../../../constants/roles.enum";
import DrDelegate from "../../../models/dr_delegate.model";
import { PatientService } from "../patient/patient.service";
import { ResponseMessageEnum } from "../../../constants/constant.enum";
import DrSchedule from "../../../models/dr_schedule.model";
import DrBlockedSchedule from "../../../models/dr_blockedSchedule";
import DrPatientAppoiment from "../../../models/dr_patient_appoiment.model";
import DrSpeciality from "../../../models/dr_speciality.model";
import Speciality from "../../../models/specialities_speciality.model";
import { StatusCode } from "../../../constants/status_code.enum";
import UserRole from "../../../models/user_role.model";
import { DoctorService } from "../doctor/doctor.service";
export class DoctorStaffService {
  async upsertSetUpProfile(staffInfo: any) {
    try {
      // for admin 
      if (!staffInfo.staffDetails.id) {
        const isExists: any = await new UserService().isUserExists(
          staffInfo.staffDetails.contact_number
        );

        if (isExists) {
          if (isExists.phone_verify) {
            throw new BadRequestError("User already Exists");
          }

          staffInfo.staffDetails.id = isExists.id;
        } else {
          const max = await Users.max("id");
          staffInfo.staffDetails.id = isNaN(max) ? 1 : max + 1;
        }

        staffInfo.staffDetails.password = Utils.encrypt(
          staffInfo.staffDetails.password
        );
        staffInfo.staffDetails.phone_verify = 1;
        const saveUser = await Users.upsert(staffInfo.staffDetails);
        const userRole = await new UserRoleService().upsertUserRole({
          user_id: staffInfo.staffDetails.id,
          role_id: 3,
          verify_account: 1,
          status_code: StatusCode.Verified
        });
      }

      let userInfo = await Users.update(
        {
          ...staffInfo.staffDetails,
        },
        {
          where: {
            id: staffInfo.staffDetails.id,
          },
        }
      );

      let worksplace = await this.staffWorksplace(
        staffInfo.staffDetails.id,
        staffInfo.workplaceInfo
      );

      let result = await this.Identity(
        staffInfo.staffDetails.id,
        staffInfo.documentDetails
      );

      await new UserService().updateProfileSetup(staffInfo.staffDetails.id, RolesEnum.Staff);

      return { msg: "Added doctor staff profile details" };
    } catch (error) {
      await this.removeSetUpProfileDetails(staffInfo.staffDetails.id);
      throw new Error(error);
    }
  }

  async removeSetUpProfileDetails(user_id: number) {
    await dr_Workplaces.destroy({ where: { user_id: user_id } });

    await dr_Workplaces.destroy({ where: { user_id: user_id } });

    await UserRole.update({ isSetupComplete: 0 }, { where: { user_id: user_id } });
  }

  public async processArray(workplace: any[], user_id: number) {
    for (let i = 0; i < workplace.length; i++) {

      let addedWkp: any = await this.addWorkplace(workplace[i]);
      await DrWorkplaceUsers.upsert({
        user_id: user_id,
        workplace_id: addedWkp.id,
      });
    }

    return { msg: "added data in dr_workpalce & address" };
  }

  public async staffWorksplace(userId: number, worksplace: any[]) {
    for (let index = 0; index < worksplace.length; index++) {
      const workplace_id = worksplace[index];

      await DrWorkplaceUsers.findOrCreate({
        where: {
          user_id: userId,
          workplace_id: workplace_id,
        }
      })

      // await DrWorkplaceUsers.upsert({

      // });

    }
    return 'adde'

    // return await this.processArray(worksplace, userId);
  }

  public async Identity(user_id: number, identity: any) {
    identity.user_id = user_id;
    let isIdentityExists: any = await Identity.findOne({ where: { user_id: user_id } });
    if (isIdentityExists) {
      return await Identity.update({ ...identity }, { where: { user_id: user_id } });
    }
    return await Identity.create(identity);
  }

  async getStaffProfile(staff_id: number, role_id: number) {
    Users.hasOne(Identity, { foreignKey: "user_id" });
    Identity.belongsTo(Users, { foreignKey: "user_id" });

    // Fetches personal information
    const personal_information: any = await Identity.findOne({
      where: {
        user_id: staff_id,
      },
      attributes: [
        [fn("", col("first_name")), "first_name"],
        [fn("", col("last_name")), "last_name"],
        [fn("", col("gender")), "gender"],
        [fn("", col("birth_date")), "birth_date"],
        [fn("", col("email")), "email"],
        [fn("", col("profile_image")), "profile_image"],
        [fn("", col("profile_image_verify")), "profile_image_verify"],
        [fn("", col("email_verify")), "email_verify"],
        [fn("", col("phone_verify")), "phone_verify"],
        ["type", "identity_type"],
        ["number", "identity_number"],
      ],
      include: [
        {
          model: Users,
          required: true,
          attributes: [],
        },
      ],
      raw: true,
    });

    if (personal_information && personal_information.profile_image)
      personal_information.profile_image = await new FileService().getProfileImageLink(
        staff_id,
        role_id,
        personal_information.profile_image
      );

    dr_Workplaces.belongsTo(DrWorkplaceUsers, { foreignKey: "workplace_id" });
    DrWorkplaceUsers.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });

    // Fetches workplace related information
    const workplace_information: any = await DrWorkplaceUsers.findAll({
      where: {
        user_id: staff_id,
      },
      attributes: [
        ["workplace_id", "id"],
        [fn("", col("workplace_name")), "name"],
        [fn("", col("address_id")), "address_id"],
      ],
      include: [
        {
          model: dr_Workplaces,
          attributes: [],
        },
      ],
      raw: true,
    });

    for (let i = 0; i < workplace_information.length; i++) {
      const address_information: any = await Address.findOne({
        where: {
          id: workplace_information[i].address_id,
        },
        attributes: {
          exclude: ["id"],
        },
      });

      const latitude = address_information.location.coordinates[0];
      const longitude = address_information.location.coordinates[1];

      address_information.location = {};
      address_information.location.latitude = latitude;
      address_information.location.longitude = longitude;

      workplace_information[i].workplace = address_information;
    }

    return { personal_information, workplace_information };
  }

  async addWorkplace(workplace: any) {
    const addressObj = {
      location: {
        latitude: workplace.latitude,
        longitude: workplace.longitude,
      },
      address: workplace.address,
      city: workplace.city,
      pincode: workplace.pin_code,
      locality: workplace.locality,
    };

    const address = await new AddressService().addAddress(addressObj);

    let worksplaceData: any = {
      workplace_name: workplace.workplace_name,
      email: workplace.email,
      address_id: address.id,
    };

    let workplaceResult: any = await dr_Workplaces.create(worksplaceData);

    if (!workplaceResult) {
      throw new Error("Error while adding workplace data");
    }

    return workplaceResult;
  }

  async updateWorkplace(workplace: any) {

    let addressObj: any = {
      location: {
        latitude: workplace.latitude,
        longitude: workplace.longitude,
      },
      address: workplace.address,
      city: workplace.city,
      pincode: workplace.pin_code,
      locality: workplace.locality,
    };

    let locationInfo: any = { ...addressObj.location };
    const coordinates: number[] = [locationInfo.latitude, locationInfo.longitude];
    const point = { type: "Point", coordinates: coordinates };
    addressObj.location = point;
    await Address.update({ ...addressObj }, { where: { id: workplace.address_id } });

    let worksplaceData: any = {
      workplace_name: workplace.workplace_name,
      email: workplace.email,
      address_id: workplace.address_id
    };

    await dr_Workplaces.update({ ...worksplaceData }, { where: { id: workplace.workplace_id } });

  }
  async updateStaffWorkplace(workplace: any[], staff_id: number) {
    let staffWorkplaces: any[] = await DrWorkplaceUsers.findAll({ where: { user_id: staff_id }, raw: true });

    let addedElemets = workplace.filter(el => !(staffWorkplaces.map(inner => inner.workplace_id)).includes(el));

    let removedElement: any[] = [];
    let existingElements: any[] = [];
    staffWorkplaces.forEach(el => {
      if (workplace.indexOf(el.workplace_id) == -1) {
        removedElement.push(el);
      } else {
        existingElements.push(el)
      }
    });

    existingElements.forEach(el => {
      if (!el.active_workplace) {
        el.active_workplace = 1;
        DrWorkplaceUsers.upsert(el);
      }
    })

    addedElemets.forEach(el => {
      const obj = {
        workplace_id: el,
        user_id: staff_id,
        active_status: 1
      };

      DrWorkplaceUsers.create({
        workplace_id: el,
        user_id: staff_id,
        active_workplace: 1,
        id: null
      });
    })

    removedElement.forEach(el => {
      if (el.active_workplace) {
        el.active_workplace = 0;
        DrWorkplaceUsers.upsert(el)
      }
    })
  }

  async updateStaffProfile(staffInfo: any, user_id: number) {

    let result = await Utils.setTransaction(async () => {
      try {
        await Users.update(
          {
            ...staffInfo.staffDetails,
          },
          {
            where: {
              id: user_id,
            },
          }
        );
        // workplace will not be updated as there is some changes in flow
        await this.updateStaffWorkplace(staffInfo.workplaceInfo, user_id);

        await this.Identity(
          user_id,
          staffInfo.documentDetails
        );

        await new UserService().updateProfileSetup(user_id, RolesEnum.Staff);
        return { msg: "Updated doctor Staff profile details" };
      } catch (error) {
        console.error(`Error in updateDoctorStaffDetails ==> ${error}`);
        throw new Error(error);
      }
    });

    return result;

  }


  async getMyListDoctors(staffID: number) {
    Users.hasOne(DrDelegate, { foreignKey: "doctor_id" });
    DrDelegate.belongsTo(Users, { foreignKey: "doctor_id" });
    dr_Workplaces.hasOne(DrDelegate, { foreignKey: "workplaces_id" });
    DrDelegate.belongsTo(dr_Workplaces, { foreignKey: "workplaces_id" });
    Address.hasOne(dr_Workplaces, { foreignKey: "address_id" });
    dr_Workplaces.belongsTo(Address, { foreignKey: "address_id" });

    Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
    DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
    Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
    DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

    let doctors: any[] = await DrDelegate.findAll({
      where: { staff_id: staffID, active_workplace: true },
      attributes: [
        "doctor_id",
        "workplaces_id",
        "manageAppoinment",
        "blockUnblockSchedue",
        "changeSchedule",
        [fn("", col("first_name")), "first_name"],
        [fn("", col("last_name")), "last_name"],
        [fn("", col("gender")), "gender"],
        [fn("", col("profile_image")), "profile_image"],
        [fn("", col("birth_date")), "birth_date"],
        [fn("", col("workplace_name")), "workplace_name"],
        [fn("", col("time_per_appointment")), "time_per_appointment"],
        [fn("", col("workplace_contact_number")), "workplace_contact_number"],
        [fn("", col("contact_number")), "contact_number"],
        [fn("", col("address_id")), "address_id"],
        [fn("", col("locality")), "locality"],
        [fn("", col("address")), "address"],
        [fn("", col("city")), "city"],
        [fn("", col("pincode")), "pincode"],
        [fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
      ],
      include: [
        {
          model: Users,
          attributes: [],
          required: true,
          include: [
            {
              model: DrSpeciality,
              attributes: [],
              include: [
                {
                  model: Speciality,
                  attributes: []
                }
              ],
            },
          ]
        },
        {
          model: dr_Workplaces,
          attributes: [],
          include: [
            {
              model: Address,
              attributes: []
            }
          ]
        }
      ],
      raw: true,
      group: ['workplaces_id']
    });

    let doctorList = [];
    for (let doctor of doctors) {
      doctor.specialities = !!doctor.specialities ? doctor.specialities.split(",") : doctor.specialities;
      if (doctor && doctor.profile_image)
        doctor.profile_image = await new FileService().getProfileImageLink(
          doctor.doctor_id,
          RolesEnum.Doctor,
          doctor.profile_image
        );

      doctorList.push(doctor);
    }

    return { doctorList };
  }

  async getMyDoctorSchedule(staffID: number, doctorID: number, appointment_date: string, appointment_day: string) {
    let assignedWorkplaces: any[] = await DrDelegate.findAll({ where: { doctor_id: doctorID, staff_id: staffID }, raw: true });
    if (!assignedWorkplaces.length) {
      throw new BadRequestError(ResponseMessageEnum.NONEWWORKPLACEFOUND);
    }

    let mapWkpIDs: any[] = assignedWorkplaces.map((obj) => { return obj.workplaces_id });

    Users.hasOne(DrPatientAppoiment, { foreignKey: "patient_id" });
    DrPatientAppoiment.belongsTo(Users, { foreignKey: "patient_id" });
    DrPatientAppoiment.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
    DrWorkplaceUsers.belongsTo(DrPatientAppoiment, { foreignKey: "workplace_id", targetKey: "workplace_id" });
    DrSchedule.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
    DrWorkplaceUsers.belongsTo(DrSchedule, { foreignKey: "workplace_id", targetKey: "workplaces_id" });
    dr_Workplaces.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
    DrWorkplaceUsers.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
    Address.hasOne(dr_Workplaces, { foreignKey: "address_id" });
    dr_Workplaces.belongsTo(Address, { foreignKey: "address_id" });

    let dateCase: any = appointment_date ? { date: appointment_date } : true;
    let dayCase: any = appointment_day ? { day: appointment_day } : true;
    const workplaces: any = await DrWorkplaceUsers.findAll({
      where: {
        user_id: doctorID,
        workplace_id: {
          [Op.in]: mapWkpIDs
        },
        active_workplace: 1
      },
      attributes: [
        "workplace_id",
        [fn("", col("workplace_name")), "workplace_name"],
        [fn("", col("address")), "address"],
        [fn("", col("city")), "city"],
        [fn("", col("pincode")), "pincode"],
        [fn("", col("time_per_appointment")), "time_per_appointment"],
        [fn("GROUP_CONCAT", fn("DISTINCT", col("dr_schedule.id"))), "schedules"],
        [fn("GROUP_CONCAT", fn("DISTINCT", col("dr_patient_appoiment.id"))), "bookings"],
      ],
      include: [
        {
          model: dr_Workplaces,
          attributes: [],
          include: [
            {
              model: Address,
              attributes: [],
            }
          ]
        },
        {
          model: DrPatientAppoiment,
          attributes: [],
          required: false,
          where: {
            doctor_id: doctorID,
            is_cancelled: 0,
            ...dateCase
          },
        },
        {
          model: DrSchedule,
          attributes: [],
          where: {
            doctor_id: doctorID,
            slot_available: 1, // only active slots will be shown
            ...dayCase
          }
        }
      ],
      group: ["workplace_id"],
      raw: true,
    });

    return await Promise.all(workplaces.map(async (wkp: any) => {
      const slot_id = wkp.schedules;
      const booking_id = wkp.bookings;

      const slotIds = slot_id ? slot_id.split(",") : '';
      const bookingIds = booking_id ? booking_id.split(",") : '';

      //for permissions
      let staffpermission = assignedWorkplaces.find((obj) => { return obj.workplaces_id === wkp.workplace_id });
      let { manageAppoinment, blockUnblockSchedue, changeSchedule } = staffpermission;
      wkp.permission = { manageAppoinment, blockUnblockSchedue, changeSchedule };

      // List out all the slot details
      const slots: any = await DrSchedule.findAll({
        where: {
          id: {
            [Op.in]: slotIds
          }
        },
        attributes: ["id", "day", "start_time", "end_time"]
      });

      // List out blocked slots
      for (let slot of slots) {
        const blockedSlots = await DrBlockedSchedule.findAll({
          where: {
            schedule_date: appointment_date,
            schedule_id: slot.id,
          },
          attributes: ["from_time", "to_time", "blocking_reason"],
        });

        slot.blocked_slots = blockedSlots;
      }

      // List out all the patient appointments
      const patient_details: any = await DrPatientAppoiment.findAll({
        where: {
          id: {
            [Op.in]: bookingIds
          },
        },
        attributes: [
          ["id", "booking_id"],
          "patient_id",
          "start_time",
          "end_time",
          "schedule_id",
          [fn("CONCAT", col("first_name"), " ", col("last_name")), "full_name"],
        ],
        include: [
          {
            model: Users,
            attributes: [],
          },
        ],
        raw: true,
      });

      delete wkp.schedules;
      delete wkp.bookings;

      wkp.slots = slots;
      wkp.patient_details = patient_details;

      return wkp;
    }));
  }

  async changeSchedule(changeScheduleObj: any, staffID: number, role: string, user: any) {
    const response = await Utils.setTransaction(async () => {
      let { doctor_id, workplace_id, schedules_changed = [], schedules_added = [], bookings_cancelled = [] } = changeScheduleObj;

      if (schedules_changed.length === 0 && schedules_added.length === 0)
        throw new BadRequestError("There are no changes in old schedule");

      //does the delegate have Change Schedule Premission if not throw error
      let staffPerimission: any = await DrDelegate.findOne({
        where: {
          doctor_id: doctor_id,
          staff_id: staffID,
          workplaces_id: workplace_id,
          active_workplace: 1,
          changeSchedule: 1
        },
        raw: true
      });

      if (!staffPerimission || !staffPerimission.id) {
        throw new BadRequestError("This Staff do not have such permision to do following Changes");
      }

      let changeschedulePromises: any = [];
      let addschedulePromises: any = [];
      let cancellAppointmentPromises: any = [];
      //is there changes in schedule if yes update those changes
      if (schedules_changed.length) {
        for (let chngschObj of schedules_changed) {
          changeschedulePromises.push(DrSchedule.upsert({ ...chngschObj, workplaces_id: workplace_id, doctor_id }));
        }
      }

      //is there new shcedule added if yes then add it to db
      if (schedules_added.length) {
        for (let addschObj of schedules_added) {
          addschedulePromises.push(DrSchedule.create({ ...addschObj, workplaces_id: workplace_id, doctor_id }));
        }
      }

      //is there any cancelled appointments if yes cancelled them all 
      if (bookings_cancelled.length) {
        for (let booking of bookings_cancelled) {
          cancellAppointmentPromises.push(new DoctorService().cancelBooking(staffID, role, booking.booking_id, booking.reason));
        }
      }

      await Promise.all([...changeschedulePromises, ...addschedulePromises, ...cancellAppointmentPromises]);
      //send notification to doctor
      const doctorDetail: any = await Users.findOne({
        where: {
          id: doctor_id
        },
        attributes: [
          "contact_number"
        ],

      });

      let doctorDynamicData = { staffName: user.first_name + " " + user.last_name }
      let doctorMsgSent = await new Notifications().sendNotification("DOCTOR_DELEGATE_SCHEDULE_CHANGED", doctorDynamicData, { contact_number: [doctorDetail.contact_number] });
      return { msg: "Doctor Workplace Schedule Changed Successfully" };
    });

    return response;
  }

  async getStaffWorkplaces(staff_id: number, doctor_id: number) {
    return this.getMyDoctorSchedule(staff_id, doctor_id, null, null);
  }
}
