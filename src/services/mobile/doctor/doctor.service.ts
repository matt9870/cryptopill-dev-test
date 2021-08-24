import { BadRequestError, UnauthorizedError } from "routing-controllers";
import DrQualifications from "../../../models/dr_qualifications.model";
import DrSchedule from "../../../models/dr_schedule.model";
import DrSpeciality from "../../../models/dr_speciality.model";
import DrUsers from "../../../models/dr_users.model";
import dr_Workplaces from "../../../models/dr_workplaces.model";
import DrWorkplaceUsers from "../../../models/dr_workplace_users.model";
import Identity from "../../../models/identity.model";
import MedicalRegistrarDetail from "../../../models/medical_registrar_detail.model";
import Speciality from "../../../models/specialities_speciality.model";
import Users from "../../../models/users.model";
import DrPatientAppoiment from "../../../models/dr_patient_appoiment.model";
import Qualifications from "../../../models/qualifications.model";
import RegistrationCouncil from "../../../models/registration_council.model";
import Address from "../../../models/address.model";

import { AddressService } from "../../shared/address.service";
import { UserService } from "../user/user.service";
import { fn, col, Op, Sequelize } from "sequelize";
import { UserRoleService } from "../../shared/user-role.service";
import { Notifications, Utils } from "../../../helpers";
import { FileService } from "../../shared/file.service";
import DrDelegate from "../../../models/dr_delegate.model";
import { ResponseMessageEnum } from "../../../constants/constant.enum";
import { RolesEnum } from "../../../constants/roles.enum";
import UserRole from "../../../models/user_role.model";
import DrBlockedSchedule from "../../../models/dr_blockedSchedule";
import ProfileDetails from "../../../models/profile_details.model";
import { StatusCode } from "../../../constants/status_code.enum";
import Referral from "../../../models/referral.model";
import Prescriptions from "../../../models/prescriptions.model";
import RxImmunisation from "../../../models/rx_immunisation.model";
import PatientLabTest from "../../../models/patient_lab_test.model";
import PatientVitals from "../../../models/vitals.model";
import Drug from "../../../models/drug.model";
import { PatientService } from "../patient/patient.service";
import moment = require("moment");
import sequelize = require("sequelize");
import PatientLinkedAccount from "../../../models/patient_linked_account.model";
import PatientUser from "../../../models/patient_user.model";
import * as config from "config";
import MedicalConventions from "../../../models/medical_conventions.model";

const envData: any = config.get("APP");



export class DoctorService {
	async professionalInfo(drInfo: any) {
		let drExperience: any = {
			doctor_id: drInfo.user.id,
			experience: drInfo.experience,
		};

		let personal: any = await Users.update(
			{
				birth_date: drInfo.birth_date,
				gender: drInfo.gender,
			},
			{
				where: {
					id: drInfo.user.id,
				},
			}
		);

		return await this.drUser(drExperience);
	}

	async education(drEducation: any) {
		let drqualifications: any = {
			doctor_id: drEducation.doctor_id,
			qualification_id: drEducation.qualification_id,
			year: drEducation.year,
			university_id: drEducation.university_id,
		};
		return await DrQualifications.create(drqualifications);
	}

	async getEducation(doctor_id: number) {
		return await DrQualifications.findAll({
			where: {
				doctor_id: doctor_id,
			},
		});
	}

	async updateEducation(education_id: number, body: any) {
		return await DrQualifications.update(
			{ ...body },
			{
				where: {
					id: education_id,
				},
			}
		);
	}

	async drSpecility(doctor_id: number, drSpeciality: any[]) {
		const speciality: any[] = await DrSpeciality.findAll({
			where: { d_id: doctor_id },
		});
		if (speciality.length > 0) {
			await DrSpeciality.destroy({
				where: {
					d_id: doctor_id,
				},
			});
		}
		for (let i = 0; i < drSpeciality.length; i++) {
			let drspecialitys: any = {
				d_id: doctor_id,
				speciality_id: drSpeciality[i],
			};
			await DrSpeciality.create(drspecialitys);
		}
	}

	async mciRegistory(mciInfo: any) {
		let mciData: any = {
			registration_number: mciInfo.registration_number,
			registration_year: mciInfo.registration_year,
			council_id: mciInfo.council_id,
			doctor_id: mciInfo.doctor_id,
			organization: mciInfo.organization,
		};
		return await MedicalRegistrarDetail.create(mciData);
	}

	async upsertSetUpProfileDetails(setupProfileObj: any) {
		let ID: any = {};

		try {
			const profresult = await this.addProfessionalDetails(
				setupProfileObj.professionalInformation,
				setupProfileObj.otherInformation.conventionDetails.medical_convention
			);

			ID = { ...profresult, ...ID };
			const eduresult = await this.addEducationalDetails({
				...setupProfileObj.educationalQualification,
				doctor_id: ID.doctor_id,
			});

			await DrUsers.update(
				{
					profession_status_code: StatusCode.Unverified_new,
				},
				{
					where: {
						doctor_id: ID.doctor_id,
					},
				}
			);

			// add profile data inside json for data retrival
			let {
				professionalInformation,
				educationalQualification,
			} = setupProfileObj;
			let obj: any = {
				user_id: ID.doctor_id,
				role_id: RolesEnum.Doctor,
				status_code: StatusCode.Unverified_new,
				new_profile_data: { professionalInformation, educationalQualification },
			};
			await ProfileDetails.create({ ...obj });

			/*let data: any = await ProfileDetails.findOne({where: {user_id: ID.doctor_id,
				role_id: RolesEnum.Doctor}, raw: true});*/

			ID = { ...eduresult, ...ID };
			const wkpResult = await this.addWorkPlaceDetails({
				...setupProfileObj.workplaceInformation,
				doctor_id: ID.doctor_id,
			});

			ID = { ...wkpResult, ...ID };
			const profileResult = await this.addOtherProfileDetails({
				...setupProfileObj.otherInformation,
				doctor_id: ID.doctor_id,
			});

			if (!profileResult) {
				throw new Error("Issue while adding setup prfoile details");
			}

			ID = { ...profileResult, ...ID };

			let userRole = {
				user_id: ID.doctor_id,
				default_role: setupProfileObj.user_role,
			};
			const user = new UserService().updateUserRole(userRole);
			await new UserService().updateProfileSetup(ID.doctor_id, RolesEnum.Doctor);
			await UserRole.update({
				status_code: StatusCode.Unverified_new
			}, {
				where: {
					user_id: ID.doctor_id,
					role_id: RolesEnum.Doctor
				}
			})
			return { msg: "Doctor Profile created Successfully", ...ID };
		} catch (error) {
			if (ID.doctor_id) {
				await this.DeleteAllProfileDetails(ID);
			}
			throw error;
		}
	}
	private async DeleteAllProfileDetails(ID: any) {
		await DrUsers.destroy({
			where: {
				doctor_id: ID.doctor_id,
			},
		});

		await DrSpeciality.destroy({
			where: {
				d_id: ID.doctor_id,
			},
		});

		await MedicalRegistrarDetail.destroy({
			where: {
				doctor_id: ID.doctor_id,
			},
		});

		await DrQualifications.destroy({
			where: {
				doctor_id: ID.doctor_id,
			},
		});

		if (ID.doctorWorkplaces && ID.doctorWorkplaces.length > 0) {
			for (let i = 0; i < ID.doctorWorkplaces.length; i++) {
				let workplaceID = ID.doctorWorkplaces[i];
				await DrSchedule.destroy({
					where: {
						workplaces_id: workplaceID,
					},
				});

				await dr_Workplaces.destroy({
					where: {
						id: workplaceID,
					},
				});
			}
		}

		await Identity.destroy({
			where: {
				user_id: ID.doctor_id,
			},
		});

		await Speciality.update(
			{ user_id: null },
			{
				where: {
					user_id: ID.doctor_id,
				},
			}
		);
	}

	private async addOtherProfileDetails(otherInformation: any) {
		const {
			conventionDetails,
			documentDetails,
			features,
			doctor_id,
		} = otherInformation;

		if (!doctor_id) {
			throw new Error("doctorId not found while adding other profile details");
		}

		let dr_result: any = await DrUsers.update(
			{
				...conventionDetails,
				...features,
			},
			{
				where: {
					doctor_id: doctor_id,
				},
			}
		);

		if (!dr_result) {
			throw new Error("Issue while adding doctory other profile details");
		}

		let docIdentity: any = await Identity.findOne({
			where: { user_id: doctor_id },
			raw: true,
		});
		// add identiy entry
		if (docIdentity) {
			await Identity.update(documentDetails, { where: { user_id: doctor_id } });
		} else {
			await Identity.create({ ...documentDetails, user_id: doctor_id });
		}

		return { doctor_id: doctor_id };
	}
	private async addWorkPlaceDetails(workplaceInformation: any) {
		const { workplaces, doctor_id } = workplaceInformation;
		const ID: any = [];
		if (!doctor_id) {
			throw new Error("doctorId not found while adding workplace details");
		}
		for (const wkobj of workplaces) {
			const { address } = wkobj;

			const addressEntry: any = await new AddressService().addAddress(address);

			const wkpResult: any = await dr_Workplaces.create(
				{
					...wkobj.workplace,
					address_id: addressEntry.id,
				},
				{
					raw: true,
				}
			);

			if (wkpResult.id) {
				const saveDrandWorkplace = await DrWorkplaceUsers.create({
					user_id: doctor_id,
					workplace_id: wkpResult.id,
					id: null,
					active_workplace: 1,
				});

				//push entry for workspace
				ID.push(wkpResult.id);

				//fetch workplace id from above & add schedule according to it
				for (const scobj of wkobj.schedule) {
					const scheduleResult: any = await DrSchedule.create({
						...scobj,
						workplaces_id: wkpResult.id,
						doctor_id: doctor_id,
					});
				}
			}
		}

		if (ID.length <= 0) {
			throw new Error("Issue while adding workplace for Doctor");
		}

		return { doctorWorkplaces: ID };
	}

	private async addEducationalDetails(eduObj: any) {
		const { mrdData, educationDetails, doctor_id } = eduObj;

		if (!doctor_id) {
			throw new Error("doctorId not found while adding Education details");
		}

		//add MCI related entry
		let mciDataExits: any = await MedicalRegistrarDetail.findOne({
			where: { doctor_id: doctor_id },
			raw: true,
		});
		if (mciDataExits) {
			await MedicalRegistrarDetail.update(
				{ ...mrdData },
				{ where: { doctor_id: doctor_id } }
			);
		} else {
			mciDataExits = await MedicalRegistrarDetail.create({
				...mrdData,
				doctor_id: doctor_id,
			});
		}

		//for DrQualification entry
		const qualifications: any[] = await DrQualifications.findAll({
			where: { doctor_id: doctor_id },
		});
		if (qualifications.length > 0) {
			await DrQualifications.destroy({
				where: {
					doctor_id: doctor_id,
				},
			});
		}
		for (const education of educationDetails) {
			await DrQualifications.create({
				...education,
				doctor_id: doctor_id,
			});
		}
		return { medicalRegistrarId: mciDataExits.id };
	}
	private async addProfessionalDetails(professionalInfo: any, medical_convention: string) {
		const { specialites, otherSpecialities, drInfo } = professionalInfo;
		let med_conv_details: any = medical_convention ? await MedicalConventions.findOne({
			where: {
				name: {
					[Op.like]: `%${medical_convention}%`
				}
			}, raw: true
		}) : null;
		// for admin add Doctor
		if (!drInfo.user.id) {
			const isExists: any = await new UserService().isUserExists(
				drInfo.user.contact_number
			);

			if (isExists) {
				if (isExists.phone_verify) {
					throw new BadRequestError(ResponseMessageEnum.USER_ALREADY_EXISTS);
				}

				drInfo.user.id = isExists.id;
			} else {
				const max = await Users.max("id");
				drInfo.user.id = isNaN(max) ? 1 : max + 1;
			}

			drInfo.user.password = Utils.encrypt(drInfo.user.password);
			drInfo.user.phone_verify = 1;
			const saveUser = await Users.upsert(drInfo.user);
			const userRole = await new UserRoleService().upsertUserRole({
				user_id: drInfo.user.id,
				role_id: 2,
				verify_account: 1,
				active_status: 1,
				isWorkplaceAdmin: 1,
				status_code: StatusCode.Verified,
			});
		}

		let drExperience: any = {
			doctor_id: drInfo.user.id,
			experience: drInfo.experience,
		};

		let personal: any = await Users.update(
			{
				birth_date: drInfo.birth_date,
				gender: drInfo.gender,
				email: drInfo.email,
			},
			{
				where: {
					id: drInfo.user.id,
				},
			}
		);

		const result = await this.drUser(drExperience);

		if (!personal || !result) {
			throw new Error("Issue while entring doctor personal details");
		}

		let drSpecialitylist: any[] = [];

		let existSpeciality: any = await DrSpeciality.findAll({
			where: { d_id: drInfo.user.id },
		});
		if (existSpeciality) {
			await DrSpeciality.destroy({
				where: {
					d_id: drInfo.user.id,
				},
			});
		}

		for (let i = 0; i < specialites.length; i++) {
			let specialityObj = {
				d_id: drInfo.user.id,
				speciality_id: specialites[i],
			};
			drSpecialitylist.push(specialityObj);
		}

		//Add all new Manual speciality added by patient in db
		if (otherSpecialities.length > 0) {
			let specialityArray = [];
			for (let i = 0; i < otherSpecialities.length; i++) {
				let spec_obj: any = {
					status: -1,
					name: otherSpecialities[i],
					date_time: moment().format('YYYY-MM-DD hh:mm:ss'),
					user_id: drInfo.user.id,
					medical_conventions_id: med_conv_details && med_conv_details.id ? med_conv_details.id : 0
				}
				specialityArray.push(spec_obj);
			}

			await Speciality.bulkCreate(specialityArray);

			let newlyAddedSpecialityList: any[] = await Speciality.findAll({
				attributes: ["id"],
				where: {
					name: {
						[Op.in]: otherSpecialities
					}
				},
				raw: true
			});

			if (newlyAddedSpecialityList.length > 0)
				for (let j = 0; j < newlyAddedSpecialityList.length; j++) {
					let specialityObj = {
						d_id: drInfo.user.id,
						speciality_id: newlyAddedSpecialityList[j].id,
					};
					drSpecialitylist.push(specialityObj);
				}
		}

		await DrSpeciality.bulkCreate(drSpecialitylist);
		return { doctor_id: drInfo.user.id };
	}
	private async updateUserProfie(userObj: any) {
		let userResult = await Users.upsert(
			{
				id: userObj.user_id,
				gender: userObj.gender,
				birth_date: userObj.birth_date,
			},
			{ returning: true }
		);

		if (userResult === undefined) {
			throw new Error("user data not update please check your userId");
		}
	}

	private async drUser(drExperience: any) {
		let drInfo = await DrUsers.findOne({
			where: {
				doctor_id: drExperience.doctor_id,
			},
		});
		let drResult;
		if (!drInfo) {
			drResult = await DrUsers.create(drExperience);
		} else {
			drResult = await DrUsers.update(
				{ experience: drExperience.experience },
				{
					where: {
						doctor_id: drExperience.doctor_id,
					},
				}
			);
		}

		return drResult;
	}

	async friendlyRollback(ID: any) {
		await this.DeleteAllProfileDetails(ID);
	}

	async getSchedules(drDetails: any) {
		const { doctor_id, appointment_date, appointment_day } = drDetails;

		dr_Workplaces.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
		DrWorkplaceUsers.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		DrPatientAppoiment.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
		DrWorkplaceUsers.belongsTo(DrPatientAppoiment, {
			foreignKey: "workplace_id",
			targetKey: "workplace_id",
		});
		DrSchedule.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
		DrWorkplaceUsers.belongsTo(DrSchedule, {
			foreignKey: "workplace_id",
			targetKey: "workplaces_id",
		});
		Users.hasOne(DrPatientAppoiment, { foreignKey: "patient_id" });
		DrPatientAppoiment.belongsTo(Users, { foreignKey: "patient_id" });

		const workplaces: any = await DrWorkplaceUsers.findAll({
			where: {
				user_id: doctor_id,
			},
			attributes: [
				"workplace_id",
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("time_per_appointment")), "time_per_appointment"],
				[
					fn("GROUP_CONCAT", fn("DISTINCT", col("dr_schedule.id"))),
					"schedules",
				],
				[
					fn("GROUP_CONCAT", fn("DISTINCT", col("dr_patient_appoiment.id"))),
					"bookings",
				],
			],
			include: [
				{
					model: dr_Workplaces,
					attributes: [],
				},
				{
					model: DrPatientAppoiment,
					attributes: [],
					required: false,
					where: {
						doctor_id,
						date: appointment_date,
						is_cancelled: 0,
					},
				},
				{
					model: DrSchedule,
					attributes: [],
					where: {
						day: appointment_day,
						doctor_id,
						slot_available: 1 // only active slots are shown
					},
				},
			],
			group: ["workplace_id"],
			raw: true,
		});

		return await Promise.all(
			workplaces.map(async (wkp: any) => {
				const slot_id = wkp.schedules;
				const booking_id = wkp.bookings;

				const slotIds = slot_id ? slot_id.split(",") : "";
				const bookingIds = booking_id ? booking_id.split(",") : "";

				// List out all the slot details
				const slots: any = await DrSchedule.findAll({
					where: {
						id: {
							[Op.in]: slotIds,
						},
					},
					attributes: ["id", "start_time", "end_time"],
				});

				// List out blocked slots
				for (let slot of slots) {
					const blockedSlots = await DrBlockedSchedule.findAll({
						where: {
							schedule_date: appointment_date,
							schedule_id: slot.id,
						},
						attributes: ["from_time", "to_time"],
					});

					slot.blocked_slots = blockedSlots;
				}

				// List out all the patient appointments
				const patient_details: any = await DrPatientAppoiment.findAll({
					where: {
						id: {
							[Op.in]: bookingIds,
						},
					},
					attributes: [
						["id", "booking_id"],
						"patient_id",
						"start_time",
						"end_time",
						"schedule_id",
						[
							fn("CONCAT", col("first_name"), " ", col("last_name")),
							"full_name",
						],
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
			})
		);
	}

	async getSetupProfile(
		doctor_id: number,
		role_id: number,
		isPatientSearch: boolean = false
	) {
		Users.hasOne(DrUsers, { foreignKey: "doctor_id" });
		DrUsers.belongsTo(Users, { foreignKey: "doctor_id" });

		// Fetches personal information
		const basic_information: any = await DrUsers.findOne({
			where: {
				doctor_id,
			},
			attributes: [
				"experience",
				"video_call",
				"audio_call",
				"physical_examination",
				"prescription_limit",
				["prescription_days_week_month", "prescription_validity"],
				[fn("", col("first_name")), "first_name"],
				[fn("", col("last_name")), "last_name"],
				[fn("", col("email")), "email"],
				[fn("", col("gender")), "gender"],
				[fn("", col("birth_date")), "birth_date"],
				[fn("", col("profile_image")), "profile_image"],
				[fn("", col("new_profile_image")), "new_profile_image"],
				[fn("", col("profile_image_verify")), "profile_image_verify"],
				[fn("", col("email_verify")), "email_verify"],
				[fn("", col("phone_verify")), "phone_verify"],
				[fn("", col("contact_number")), "contact_number"],
			],
			include: [
				{
					model: Users,
					attributes: [],
				},
			],
			raw: true,
		});

		const profileImageName =
			basic_information.new_profile_image || basic_information.profile_image;
		if (!!profileImageName) {
			basic_information.profile_image = await new FileService().getProfileImageLink(
				doctor_id,
				role_id,
				profileImageName
			);
		}

		const user_identity: any = await Identity.findOne({
			where: {
				user_id: doctor_id,
			},
			attributes: [
				["type", "identity_type"],
				["number", "identity_number"],
			],
		});

		const personal_information = {
			...basic_information,
			...user_identity,
		};

		// Fetches professional information
		const specialties: any = await DrSpeciality.findAll({
			where: {
				d_id: doctor_id,
			},
			attributes: ["speciality_id"],
		});

		Qualifications.hasOne(DrQualifications, { foreignKey: "qualification_id" });
		DrQualifications.belongsTo(Qualifications, {
			foreignKey: "qualification_id",
		});

		const qualifications: any = await DrQualifications.findAll({
			where: {
				doctor_id,
			},
			attributes: [
				"university_id",
				"year",
				["qualification_id", "id"],
				[fn("", col("education")), "education"],
			],
			include: [
				{
					model: Qualifications,
					attributes: [],
				},
			],
			raw: true,
		});

		RegistrationCouncil.hasOne(MedicalRegistrarDetail, {
			foreignKey: "council_id",
		});
		MedicalRegistrarDetail.belongsTo(RegistrationCouncil, {
			foreignKey: "council_id",
		});

		const mci_registration: any = await MedicalRegistrarDetail.findOne({
			where: {
				doctor_id,
			},
			attributes: [
				"registration_number",
				"registration_year",
				"council_id",
				[fn("", col("name")), "council_name"],
			],
			include: [
				{
					model: RegistrationCouncil,
					attributes: [],
				},
			],
			raw: true,
		});

		dr_Workplaces.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
		DrWorkplaceUsers.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });

		DrSchedule.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
		DrWorkplaceUsers.belongsTo(DrSchedule, {
			foreignKey: "workplace_id",
			targetKey: "workplaces_id",
		});

		// Fetches workplace information
		const workplace_information: any[] = await DrWorkplaceUsers.findAll({
			where: {
				user_id: doctor_id,
			},
			attributes: [
				["workplace_id", "id"],
				[fn("", col("workplace_name")), "name"],
				[fn("", col("time_per_appointment")), "time_per_appointment"],
				[fn("", col("consultation_fee")), "consultation_fee"],
				[fn("", col("address_id")), "address_id"],
				[
					fn("GROUP_CONCAT", fn("DISTINCT", col("dr_schedule.id"))),
					"schedules",
				],
			],
			include: [
				{
					model: dr_Workplaces,
					attributes: [],
				},
				{
					model: DrSchedule,
					attributes: [],
					where: {
						doctor_id,
						slot_available: 1 // only active slots are shown
					},
				},
			],
			group: ["workplace_id"],
			raw: true,
		});

		await Promise.all(
			workplace_information.map(async (wkp: any) => {
				const slot_id = wkp.schedules;
				const slotIds = slot_id ? slot_id.split(",") : "";

				const workplace_address: any = await Address.findOne({
					where: {
						id: wkp.address_id,
					},
					attributes: {
						exclude: ["id"],
					},
				});

				const latitude = workplace_address.location.coordinates[0];
				const longitude = workplace_address.location.coordinates[1];

				workplace_address.location = {};
				workplace_address.location.latitude = latitude;
				workplace_address.location.longitude = longitude;

				wkp.workplace = workplace_address;

				// List out all the slot details
				let [slots, bookings] = await Promise.all([DrSchedule.findAll({
					where: {
						id: {
							[Op.in]: slotIds,
						},
					},
					attributes: ["id", "day", "start_time", "end_time"],
				}),
				this.getCurrentActiveBookings(doctor_id, wkp.id)
				]) as any;

				wkp.schedules = slots;
				wkp.bookings = bookings;
			})
		);

		let profileData: any = await ProfileDetails.findAll({
			where: {
				user_id: doctor_id,
				role_id: RolesEnum.Doctor,
				status_code: {
					[Op.in]: [StatusCode.Verified, StatusCode.Unverified_edit],
				},
			},
			order: [["createdAt", "DESC"]],
			attributes: [
				"profile_data",
				"new_profile_data",
				"status_code",
				"createdAt",
				"updatedAt",
			],
			raw: true,
		});

		let professional_information = {};

		if (
			isPatientSearch ||
			!profileData[0] ||
			!profileData[0].new_profile_data
		) {
			// show data from table incase of patientSearch or no unverfied edit data
			professional_information = {
				specialties,
				qualifications,
				mci_registration,
			};
			return {
				personal_information,
				professional_information,
				workplace_information,
			};
		}

		//profile data from json
		let { new_profile_data } = profileData[0];
		let {
			professionalInformation,
			educationalQualification,
		} = new_profile_data;
		personal_information.experience = professionalInformation.drInfo.experience;
		personal_information.email = professionalInformation.drInfo.email;
		personal_information.gender = professionalInformation.drInfo.gender;
		personal_information.birth_date = professionalInformation.drInfo.birth_date;

		let specialities = professionalInformation.specialites.map(
			(specialityID: number) => {
				return { speciality_id: specialityID };
			}
		);

		let qualifyArr: any = [];
		for (let qualify of educationalQualification.educationDetails) {
			let qualification: any = await Qualifications.findOne({
				attributes: ["education"],
				where: { id: qualify.qualification_id },
			});
			let quobj = {
				university_id: qualify.university_id,
				year: qualify.year,
				id: qualify.qualification_id,
				education: qualification.education,
			};
			qualifyArr.push(quobj);
		}

		let mciData = educationalQualification.mrdData;
		let council: any = await RegistrationCouncil.findOne({
			attributes: ["name"],
			where: { id: mciData.council_id },
		});
		mciData.council_name = council.name;

		professional_information = {
			specialties: specialities,
			qualifications: qualifyArr,
			mci_registration: mciData,
		};

		return {
			personal_information,
			professional_information,
			workplace_information,
		};
	}

	async updateWorkplacesDetails(doctorDetails: any, user_id: number, user: any) {
		if (doctorDetails.workplaces.length < 1) {
			throw new Error("Need to add atleast one workplace entry for Pharmacy");
		}
		const ID: any = [];
		for (let wkobj of doctorDetails.workplaces) {
			const { address, workplace } = wkobj;

			let workplace_id = workplace.workplace_id;
			let address_id = address.address_id;

			delete address.address_id;
			delete workplace.workplace_id;

			if (workplace_id && address_id) {
				//add entry first in adress filed
				let locationInfo: any = { ...address.location };
				const coordinates: number[] = [
					locationInfo.latitude,
					locationInfo.longitude,
				];
				const point = { type: "Point", coordinates: coordinates };
				address.location = point;
				await Address.update({ ...address }, { where: { id: address_id } });

				//add workplace in pharmacy_workplace
				await dr_Workplaces.update(
					{ ...workplace, address_id: address_id },
					{ where: { id: workplace_id } }
				);
			} else {
				const addressEntry: any = await new AddressService().addAddress(
					address
				);

				const wkpResult: any = await dr_Workplaces.create(
					{
						...wkobj.workplace,
						address_id: addressEntry.id,
					},
					{
						raw: true,
					}
				);

				workplace_id = wkpResult.id;
				address_id = addressEntry.id;
			}

			ID.push(workplace_id);

			//update workplace schedule
			let cancelledSlots = [];
			let updateSlotsPromises: any = [];
			let scheduleList: any = [];
			let cancellbookingPromises: any = [];
			for (const scobj of wkobj.schedule) {
				let schObj = {
					id: scobj.id,
					day: scobj.day,
					start_time: scobj.start_time,
					end_time: scobj.end_time,
					workplaces_id: workplace_id,
					doctor_id: user_id,
					slot_available: scobj.slot_available === 0 ? 0 : 1
				};

				scheduleList.push(schObj);
				if (scobj.id && scobj.slot_available === 0) {
					cancelledSlots.push(scobj.id);
				}
			}

			//update all slot promise
			for (let schedule of scheduleList) {
				updateSlotsPromises.push(DrSchedule.upsert(schedule));
			}

			//Cancell upcoming booking for all slots that are cancelled
			let bookingsFound: any[] = await DrPatientAppoiment.findAll({
				attributes: ["id"],
				where: {
					doctor_id: user_id,
					workplace_id: workplace_id,
					schedule_id: {
						[Op.in]: cancelledSlots
					},
					status: "Accepted",
					is_cancelled: 0,
					date: {
						[Op.gte]: moment().add(1, 'days').format('YYYY-MM-DD')
					}
				},
				raw: true
			});

			if (bookingsFound.length > 0) {
				for (const booking of bookingsFound) {
					cancellbookingPromises.push(
						this.cancelBooking(
							user_id,
							'doctor',
							booking.id,
							ResponseMessageEnum.DOCTOR_SCHEDULE_CHANGE
						)
					);
				}
			}

			await Promise.all([...updateSlotsPromises, ...cancellbookingPromises]);

			let isEmployeExists: any = await DrWorkplaceUsers.findOne({
				where: { workplace_id: workplace_id, user_id: user_id },
				raw: true,
			});
			//check if user with workplaces exists if not add it
			if (!isEmployeExists) {
				let wkpUserObj: any = { workplace_id: workplace_id, user_id: user_id };
				await DrWorkplaceUsers.create(wkpUserObj);
			}
		}

		//send notification to staff members
		let delegateList: any = await DrDelegate.findAll({
			where: { doctor_id: user_id, active_workplace: true },
			raw: true,
		});
		let contactList: any = [];
		let delegateListPromise = await delegateList.map((singleDelegate: any) => {

			contactList.push(singleDelegate.contact_number);
		});
		await Promise.all(delegateListPromise)
		let delegateDynamicData = { doctorName: user.first_name + " " + user.last_name }
		let msgSent = await new Notifications().sendNotification("DELEGATE_DOCTOR_SCHEDULE_CHANGED", delegateDynamicData, { contact_number: contactList });


		return { doctorWorkplaces: ID };
	}

	async updateDoctorProfile(setupProfileObj: any, user: any) {
		let user_id: number = user.id;
		const updateResult: any = await Utils.setTransaction(async () => {
			try {
				console.log(user_id, "User found");
				setupProfileObj.professionalInformation.drInfo.user = { id: user_id };
				// await this.addProfessionalDetails(
				// 	setupProfileObj.professionalInformation
				// );

				// await this.addEducationalDetails({
				// 	...setupProfileObj.educationalQualification,
				// 	doctor_id: user_id,
				// });

				console.log(user_id, "users to update");
				await this.updateWorkplacesDetails(
					{
						...setupProfileObj.workplaceInformation,
					},
					user_id,
					user
				);

				await this.addOtherProfileDetails({
					...setupProfileObj.otherInformation,
					doctor_id: user_id,
				});

				let userRole = {
					user_id: user_id,
					default_role: setupProfileObj.user_role,
				};
				await new UserService().updateUserRole(userRole);
				await new UserService().updateProfileSetup(user_id, RolesEnum.Doctor);

				//update profile details json
				let {
					professionalInformation,
					educationalQualification,
				} = setupProfileObj;
				professionalInformation.drInfo.user = { id: user_id };

				if (professionalInformation.hasOwnProperty("isProfessionEdited") && professionalInformation.isProfessionEdited) {
					let profileData: any = await ProfileDetails.findAll({
						where: { user_id: user_id, role_id: RolesEnum.Doctor },
						order: [["createdAt", "DESC"]],
						attributes: [
							"id",
							"profile_data",
							"new_profile_data",
							"status_code",
							"createdAt",
							"updatedAt",
						],
						raw: true,
					});

					if (
						profileData[0].status_code === StatusCode.Unverified_edit ||
						profileData[0].status_code === StatusCode.Unverified_new
					) {
						let obj: any = {
							status_code: profileData[0].status_code,
							new_profile_data: {
								professionalInformation,
								educationalQualification,
							},
						};
						await ProfileDetails.update(
							{ ...obj },
							{ where: { id: profileData[0].id } }
						);
						await UserRole.update(
							{ status_code: profileData[0].status_code },
							{ where: { user_id: user_id, role_id: RolesEnum.Doctor } }
						);
						await DrUsers.update(
							{ profession_status_code: profileData[0].status_code },
							{ where: { doctor_id: user_id } }
						);
					} else if (profileData[0].status_code === StatusCode.Verified) {
						let obj: any = {
							status_code: StatusCode.Unverified_edit,
							new_profile_data: {
								professionalInformation,
								educationalQualification,
							},
							user_id: user_id,
							role_id: RolesEnum.Doctor,
						};
						await ProfileDetails.create({ ...obj });
						await UserRole.update(
							{ status_code: StatusCode.Unverified_edit },
							{ where: { user_id: user_id, role_id: RolesEnum.Doctor } }
						);
						await DrUsers.update(
							{ profession_status_code: StatusCode.Unverified_edit },
							{ where: { doctor_id: user_id } }
						);
					} else if (profileData[0].status_code === StatusCode.Declined) {
						let profilWasVerfied = profileData.filter((obj: any) => {
							return obj.status_code === StatusCode.Verified;
						});
						let obj: any = {
							status_code: StatusCode.Unverified_new,
							new_profile_data: {
								professionalInformation,
								educationalQualification,
							},
							user_id: user_id,
							role_id: RolesEnum.Doctor,
						};
						if (profilWasVerfied) {
							obj.status_code = StatusCode.Unverified_edit;
						}
						await DrUsers.update(
							{ profession_status_code: StatusCode.Unverified_edit },
							{ where: { doctor_id: user_id } }
						);
						await ProfileDetails.create({ ...obj });
					}
				}
				return { msg: "Doctor Profile updated Successfully" };
			} catch (error) {
				console.error(`Error in updateDoctorDetails ==> ${error}`);
				throw new Error(error);
			}
		});

		return updateResult;
	}

	async findDrWorkplaces(doctor_id: number) {
		dr_Workplaces.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
		DrWorkplaceUsers.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });

		const drWorkplaces: any = await DrWorkplaceUsers.findAll({
			where: {
				user_id: doctor_id,
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

		return drWorkplaces;
	}

	async getAllWorkplaces(doctor_id?: number) {
		if (!doctor_id)
			return await dr_Workplaces.findAll({
				attributes: ["id", "workplace_name", "address_id"],
			});

		const workplacesList = await this.findDrWorkplaces(doctor_id);
		return workplacesList;
	}

	async getAllDelegates(doctor_id?: number) {
		Users.hasOne(DrDelegate, { foreignKey: "staff_id" });
		DrDelegate.belongsTo(Users, { foreignKey: "staff_id" });

		let delegates: any[] = await DrDelegate.findAll({
			where: { doctor_id: doctor_id, active_workplace: true },
			attributes: [
				"staff_id",
				"workplaces_id",
				"manageAppoinment",
				"blockUnblockSchedue",
				"changeSchedule",
				[fn("", col("first_name")), "first_name"],
				[fn("", col("last_name")), "last_name"],
				[fn("", col("email")), "email"],
				[fn("", col("gender")), "gender"],
				[fn("", col("birth_date")), "birth_date"],
				[fn("", col("contact_number")), "contact_number"],
				[fn("", col("profile_image")), "profile_image"],
			],
			include: [
				{
					model: Users,
					attributes: [],
				},
			],
			raw: true,
		});

		let delgatesList = [];
		for (let delegate of delegates) {
			const workplace: any = await dr_Workplaces.findOne({
				attributes: [
					"workplace_name",
					"time_per_appointment",
					"workplace_contact_number",
					"address_id",
				],
				where: {
					id: delegate.workplaces_id,
				},
				raw: true,
			});

			// Append the workplace details with delegates
			delegate.workplaceInfo = workplace;
			if (delegate.profile_image)
				delegate.profile_image = await new FileService().getProfileImageLink(
					delegate.staff_id,
					RolesEnum.Staff,
					delegate.profile_image
				);

			delgatesList.push(delegate);
		}

		return { delgatesList };
	}
	async addDelegates(delegateObj: any, doctor_id?: number) {
		let isCreate = false;
		//check if delegate exists
		let delegate: any = await DrDelegate.findOne({
			where: { staff_id: delegateObj.staff_id, active_workplace: true },
			raw: true,
		});
		if (delegate) {
			if (delegateObj.workplaces_id != delegate.workplaces_id) {
				throw new BadRequestError(
					ResponseMessageEnum.STAFF_ASSIGNEE_TO_OTHER_WORKPLACE
				);
			}

			let alreadyAdelegate: any = await DrDelegate.findOne({
				where: { doctor_id: doctor_id, staff_id: delegateObj.staff_id, active_workplace: true },
				raw: true,
			});
			if (alreadyAdelegate) {
				delegate = alreadyAdelegate;
				//update delegate permissions
				let {
					manageAppoinment,
					blockUnblockSchedue,
					changeSchedule,
				} = delegateObj;
				await DrDelegate.update(
					{ manageAppoinment, blockUnblockSchedue, changeSchedule },
					{
						where: {
							doctor_id: doctor_id,
							staff_id: delegateObj.staff_id,
							workplaces_id: delegateObj.workplaces_id,
						},
					}
				);
			} else {
				delegate = await DrDelegate.create({
					...delegateObj,
					doctor_id: doctor_id,
				});
				isCreate = true;
			}
		} else {
			delegate = await DrDelegate.create({
				...delegateObj,
				doctor_id: doctor_id,
			});
			isCreate = true;
		}

		if (isCreate) {
			let [staffDetail, doctorDetail] = await Promise.all([Users.findOne({
				where: {
					id: delegateObj.staff_id
				},
				attributes: [
					[
						fn("CONCAT", col("first_name"), " ", col("last_name")),
						"name",
					],
					"contact_number",
				],
			}),
			Users.findOne({
				where: {
					id: doctor_id
				},
				attributes: [
					[
						fn("CONCAT", col("first_name"), " ", col("last_name")),
						"name",
					],
					"contact_number",
				],
			})
			]) as any;


			let dynamicData = { staffName: staffDetail.name }
			let delegateDynamicData = { doctorName: doctorDetail.name }

			await Promise.all([new Notifications().sendNotification("DOCTOR_DELEGATE_ADDED", dynamicData, { contact_number: [doctorDetail.contact_number] }),
			new Notifications().sendNotification("DELEGATE_DOCTOR_ADDED_DELEGATE", delegateDynamicData, { contact_number: [staffDetail.contact_number] })
			]);
		}

		return {
			msg: ResponseMessageEnum.ADD_DELEGATES_SUCCESS,
			delegate_id: delegate.id,
		};
	}

	async getStaffInfo(workplace_id: number) {
		Users.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });

		DrWorkplaceUsers.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(DrWorkplaceUsers, {
			foreignKey: "user_id",
			targetKey: "user_id",
		});

		const staffUser: any = await UserRole.findAll({
			where: {
				role_id: RolesEnum.Staff,
				isWorkplaceAdmin: 0,
			},
			attributes: [
				"user_id",
				[fn("", col("workplace_id")), "workplace_id"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "full_name"],
				[fn("", col("contact_number")), "contact_number"],
				[fn("", col("profile_image")), "profile_image"],
			],
			include: [
				{
					model: Users,
					required: true,
					attributes: [],
				},
				{
					model: DrWorkplaceUsers,
					attributes: [],
					where: {
						workplace_id,
					},
				},
			],
			raw: true,
		});

		for (let user of staffUser) {
			if (user.profile_image) {
				user.profile_image = await new FileService().getProfileImageLink(
					user.user_id,
					RolesEnum.Staff,
					user.profile_image
				);
			}
		}

		return staffUser;
	}

	async editDelegates(delegateObj: any, doctor_id?: number) {
		let alreadyAdelegate: any = await DrDelegate.findOne({
			where: {
				doctor_id: doctor_id,
				staff_id: delegateObj.staff_id,
				workplaces_id: delegateObj.workplaces_id,
				active_workplace: true
			},
			raw: true,
		});
		if (!alreadyAdelegate) {
			throw new BadRequestError(ResponseMessageEnum.DELEGATE_NOT_EXITS);
		}
		//update delegate permissions
		let { manageAppoinment, blockUnblockSchedue, changeSchedule } = delegateObj;
		await DrDelegate.update(
			{ manageAppoinment, blockUnblockSchedue, changeSchedule },
			{
				where: {
					doctor_id: doctor_id,
					staff_id: delegateObj.staff_id,
					workplaces_id: delegateObj.workplaces_id,
				},
			}
		);

		return { msg: ResponseMessageEnum.UPDATE_DELEGATES_SUCCESS };
	}

	async removeDelegates(
		workplace_id: number,
		staff_id: number,
		doctor_id?: number
	) {
		let isDelgateExists: any = await DrDelegate.findOne(
			{
				where: {
					doctor_id: doctor_id,
					staff_id: staff_id,
					workplaces_id: workplace_id,
					active_workplace: true
				}
			}
		);
		if (!isDelgateExists) throw new BadRequestError(ResponseMessageEnum.NO_SUCH_DELEGATES);

		await DrDelegate.update(
			{
				active_workplace: false
			},
			{
				where: {
					doctor_id: doctor_id,
					staff_id: staff_id,
					workplaces_id: workplace_id,
				}
			});

		//send notification
		let [staff, dctr] = await Promise.all([
			Users.findOne({
				where: {
					id: staff_id
				},
				attributes: [
					[
						fn("CONCAT", col("first_name"), " ", col("last_name")),
						"name",
					],
					"contact_number",
				],
			}),
			Users.findOne({
				where: {
					id: doctor_id
				},
				attributes: [
					[
						fn("CONCAT", col("first_name"), " ", col("last_name")),
						"name",
					],
					"contact_number",
				],
			})
		])
		let staffDetail: any = staff;
		let doctorDetail: any = dctr;
		let dynamicData = { staffName: staffDetail.name }
		let delegateDynamicData = { doctorName: doctorDetail.name }

		await Promise.all([new Notifications().sendNotification("DOCTOR_DELEGATE_REMOVED", dynamicData, { contact_number: [doctorDetail.contact_number] }),
		new Notifications().sendNotification("DELEGATE_DOCTOR_REMOVED", delegateDynamicData, { contact_number: [staffDetail.contact_number] })])


		return { msg: ResponseMessageEnum.REMOVE_DELEGATES_SUCCESS };
	}

	async blockDrSchedules(body: any, user: any, is_staff: boolean) {
		const { blocked_dates, block_reason } = body;
		let isWorkingSchedule = false;
		let doctor_id = is_staff ? body.doctor_id : user.id;

		/**
		 * find all the related schedules
		 * Updating the dr_patient_appointment table
		 * creating a record on dr_blocked_schedule
		 */
		for (let schedule of blocked_dates) {
			const drSchedules: any = await DrSchedule.findAll({
				where: { doctor_id: doctor_id, day: schedule.day },
				attributes: ["id", "workplaces_id"],
			});

			if (drSchedules.length) {
				isWorkingSchedule = true;

				const isAppointmentExist: any = await DrPatientAppoiment.findOne({
					where: { date: schedule.date, doctor_id: doctor_id },
				});

				if (isAppointmentExist) {
					await DrPatientAppoiment.update(
						{
							is_cancelled: 1,
							cancelled_reason: block_reason,
							cancellby: user.role,
						},
						{ where: { date: schedule.date, doctor_id: doctor_id } }
					);
				}

				drSchedules.forEach(async (elem: any) => {
					const blockedScheduleBody: any = {
						schedule_date: schedule.date,
						workplace_id: elem.workplaces_id,
						schedule_id: elem.id,
						blocking_reason: block_reason,
						from_time: "00:00:00",
						to_time: "24:00:00",
					};

					const isAlreadyBlocked: any = await DrBlockedSchedule.findOne({
						where: {
							schedule_date: schedule.date,
							schedule_id: elem.id,
						},
					});

					if (isAlreadyBlocked) {
						await DrBlockedSchedule.destroy({
							where: { schedule_date: schedule.date, schedule_id: elem.id },
						});
					}

					await DrBlockedSchedule.create(blockedScheduleBody);
				});
			}
		}

		if (!isWorkingSchedule) {
			throw new Error(ResponseMessageEnum.NO_SCHEDULE_FOUND);
		}
	}

	async blockDrSlots(body: any, role: string) {
		const { blocked_dates, schedules, block_reason } = body;
		const date = blocked_dates[0].date;
		let isBlocked = false;

		for (let schedule of schedules) {
			for (let slots of schedule.time_slots) {
				const blockedScheduleBody: any = {
					schedule_date: date,
					workplace_id: schedule.workplace_id,
					schedule_id: schedule.id,
					blocking_reason: block_reason,
					from_time: slots.from_time,
					to_time: slots.end_time,
				};

				const isAlreadyBlocked: any = await DrBlockedSchedule.findOne({
					where: {
						schedule_date: date,
						schedule_id: schedule.id,
						from_time: {
							[Op.in]: [slots.from_time, "00:00:00"],
						},
						to_time: {
							[Op.in]: [slots.end_time, "24:00:00"],
						},
					},
				});

				if (!isAlreadyBlocked) {
					isBlocked = true;
					await DrBlockedSchedule.create(blockedScheduleBody);

					const isAppointmentExist: any = await DrPatientAppoiment.findOne({
						where: {
							date: date,
							schedule_id: schedule.id,
							start_time: slots.from_time,
							end_time: slots.end_time,
						},
					});

					if (isAppointmentExist) {
						await DrPatientAppoiment.update(
							{
								is_cancelled: 1,
								cancelled_reason: block_reason,
								cancellby: role,
							},
							{
								where: {
									date,
									schedule_id: schedule.id,
									start_time: slots.from_time,
									end_time: slots.end_time,
								},
							}
						);
					}
				}
			}
		}

		if (!isBlocked) {
			throw new Error(ResponseMessageEnum.BLOCK_SCHEDULE_FAILURE);
		}
	}

	async blockSchedules(user: any, body: any, is_staff: boolean = false) {
		const { type } = body;
		if (type == "slots" && !body.schedules) {
			throw new BadRequestError(ResponseMessageEnum.INVALID_SCHEDULE_TYPE);
		}

		try {
			if (type == "schedule") {
				await this.blockDrSchedules(body, user, is_staff);
			} else {
				await this.blockDrSlots(body, user.role);
			}

			if (is_staff) {
				//send notification to doctor
				const doctorDetail: any = await Users.findOne({
					where: {
						id: body.doctor_id
					},
					attributes: [
						"contact_number"
					],

				});

				let doctorDynamicData = { staffName: user.first_name + " " + user.last_name }
				let doctorMsgSent = await new Notifications().sendNotification("DOCTOR_DELEGATE_BOCKED_SCHEDULE", doctorDynamicData, { contact_number: [doctorDetail.contact_number] });
			}
			else {

				//send notification to staff members

				let delegateList: any = await DrDelegate.findAll({
					where: { doctor_id: body.doctor_id, active_workplace: true },
					raw: true,
				});
				let contactList: any = [];

				let delegateListPromise = await delegateList.map((singleDelegate: any) => {

					contactList.push(singleDelegate.contact_number);
				});

				await Promise.all(delegateListPromise)

				let delegateDynamicData = { doctorName: user.first_name + " " + user.last_name }
				let msgSent = await new Notifications().sendNotification("DELEGATE_DOCTOR_SCHEDULE_BLOCKED", delegateDynamicData, { contact_number: contactList });

			}

			return {
				message: "The given date or slot has been blocked successfully",
			};
		} catch (error) {
			console.log(error);
			throw new UnauthorizedError(error.message);
		}
	}

	async getBlockedSchedules(user_id: number) {
		DrSchedule.hasOne(DrBlockedSchedule, { foreignKey: "schedule_id" });
		DrBlockedSchedule.belongsTo(DrSchedule, { foreignKey: "schedule_id" });

		const blockedScheduleList: any = await DrBlockedSchedule.findAll({
			include: [
				{
					model: DrSchedule,
					attributes: [],
					where: {
						doctor_id: user_id,
						slot_available: 1 // only active slots are shown
					},
				},
			],
			raw: true,
		});

		return blockedScheduleList;
	}

	async unBlockSchedule(body: any, doctor_id: number) {
		const { dates } = body;
		let isUnblocked = false;

		for (let obj of dates) {
			const drSchedules: any = await DrSchedule.findAll({
				where: {
					doctor_id,
					day: obj.day,
				},
				attributes: ["id", "workplaces_id"],
			});

			for (let schedule of drSchedules) {
				isUnblocked = true;
				await DrBlockedSchedule.destroy({
					where: {
						schedule_id: schedule.id,
						schedule_date: obj.date,
					},
				});
			}
		}

		if (!isUnblocked) throw new Error("No working schedule found");
	}

	async unBlockSlots(body: any) {
		const { dates, schedules } = body;
		const date = dates[0].date;
		let isSlotExist = false;

		for (let schedule of schedules) {
			for (let slots of schedule.time_slots) {
				const isSlotAvailable: any = await DrBlockedSchedule.findOne({
					where: {
						schedule_id: schedule.id,
						schedule_date: date,
						from_time: slots.from_time,
						to_time: slots.end_time,
					},
				});

				if (isSlotAvailable) {
					isSlotExist = true;
					await DrBlockedSchedule.destroy({
						where: {
							schedule_id: schedule.id,
							schedule_date: date,
							from_time: slots.from_time,
							to_time: slots.end_time,
						},
					});
				}
			}
		}

		if (!isSlotExist) {
			throw new Error(ResponseMessageEnum.NO_SLOTS_FOUND);
		}
	}

	async unBlockSchedules(doctor_id: number, body: any, loggedInUser: any, isBlockedByStaff: boolean = false) {
		const { type } = body;
		if (type == "slots" && !body.schedules) {
			throw new BadRequestError(ResponseMessageEnum.INVALID_SCHEDULE_TYPE);
		}

		try {
			if (type == "schedule") {
				await this.unBlockSchedule(body, doctor_id);
			} else {
				await this.unBlockSlots(body);
			}

			if (isBlockedByStaff) {
				//send notification to doctor
				const doctorDetail: any = await Users.findOne({
					where: {
						id: doctor_id
					},
					attributes: [
						"contact_number"
					],

				});

				let doctorDynamicData = { staffName: loggedInUser.first_name + " " + loggedInUser.last_name }
				let doctorMsgSent = await new Notifications().sendNotification("DOCTOR_DELEGATE_UNBLOCKED_SCHEDULE", doctorDynamicData, { contact_number: [doctorDetail.contact_number] });
			}
			else {

				//send notification to staff members

				let delegateList: any = await DrDelegate.findAll({
					where: { doctor_id: doctor_id, active_workplace: true },
					raw: true,
				});
				let contactList: any = [];

				let delegateListPromise = await delegateList.map((singleDelegate: any) => {

					contactList.push(singleDelegate.contact_number);
				});

				await Promise.all(delegateListPromise)

				let delegateDynamicData = { doctorName: loggedInUser.first_name + " " + loggedInUser.last_name }
				let msgSent = await new Notifications().sendNotification("DELEGATE_DOCTOR_SCHEDULE_UNBLOCKED", delegateDynamicData, { contact_number: contactList });
			}

			return { message: "The given date or slot has unblocked successfully" };
		} catch (error) {
			console.log(error);
			throw new UnauthorizedError(error.message);
		}
	}

	async cancelBooking(
		userId: number,
		role: string,
		booking_id: number,
		cancelReason: string,
		isReschedule: boolean = false
	) {
		//check is bookingId Exists
		let booking: any = await DrPatientAppoiment.findOne({
			where: { id: booking_id },
			raw: true,
		});

		if (!booking) {
			throw new Error("Invalid Booking Id");
		}

		//update booking with cancel status & blocked status & message in exists
		let cancelledBooking: any = await DrPatientAppoiment.update(
			{
				...booking,
				is_cancelled: 1,
				cancelled_reason: cancelReason,
				cancellby: role,
			},
			{ where: { id: booking_id } }
		);

		if (!cancelledBooking) {
			throw new Error("Issue while cancelling the booking");
		}

		if (!isReschedule) {

			//send notification

			let [wrkplace, dctr, patient] = await Promise.all([dr_Workplaces.findOne({
				attributes: [
					"workplace_name",
				],
				where: {
					id: booking.workplace_id,
				},
				raw: true,
			}),
			Users.findOne({
				attributes: [
					[fn("CONCAT", col("first_name"), " ", col("last_name")), "doctor_name"],
					"contact_number"
				],
				where: {
					id: booking.doctor_id,
				},
			}),
			Users.findOne({
				attributes: [
					[fn("CONCAT", col("first_name"), " ", col("last_name")), "patient_name"],
					"contact_number"
				],
				where: {
					id: booking.patient_id,
				},
			})
			])
			let patientDetail: any = patient;
			let doctorDetail: any = dctr;
			let workplace: any = wrkplace;
			//send notification to patinet
			let patientDynamicData = { doctorName: doctorDetail.doctor_name, workplace: workplace.workplace_name, date: booking.date, time: booking.start_time, bookingId: booking_id, reason: cancelReason }
			let patientMsgSent = await new Notifications().sendNotification(role.toLowerCase() === "patient" ? "PATIENT_APPOINTMENT_CANCELLATION" : "PATIENT_APPOINTMENT_DOCTOR_CANCELLATION", patientDynamicData, { contact_number: [patientDetail.contact_number] });

			if (role.toLowerCase() === "patient") {

				//send notification to doctor
				let doctorDynamicData = { patientName: patientDetail.doctor_name, workplace: workplace.workplace_name, date: booking.date, time: booking.start_time, bookingId: booking_id }


				//send notification delegate
				let delegateList: any = await DrDelegate.findAll({
					where: { doctor_id: booking.doctor_id, workplaces_id: booking.workplace_id, active_workplace: true },
					raw: true,
				});
				let contactList: any = [];

				let delegateListPromise = await delegateList.map((singleDelegate: any) => {

					contactList.push(singleDelegate.contact_number);
				});

				await Promise.all(delegateListPromise)

				let delegateDynamicData = { doctorName: doctorDetail.doctor_name, patientName: patientDetail.doctor_name, workplace: workplace.workplace_name, date: booking.date, time: booking.start_time, bookingId: booking_id }
				await Promise.all([new Notifications().sendNotification("DOCTOR_APPOINTMENT_CANCELLED_BY_PATIENT", doctorDynamicData, { contact_number: [doctorDetail.contact_number] }),
				new Notifications().sendNotification("DELEGATE_APPOINTMENT_CANCELLED_BY_PATIENT", delegateDynamicData, { contact_number: contactList })
				]);
			}

		}


		return { msg: `BookingId ${booking_id} is cancelled` };
	}

	async getDrProfile(doctor_id: number) {
		Users.hasMany(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });
		const isDoctorExist: any = await Users.findOne({
			where: {
				id: doctor_id,
			},
			include: [
				{
					model: UserRole,
					attributes: [],
					where: {
						user_id: doctor_id,
						role_id: RolesEnum.Doctor,
						active_status: 1 // User Current Role Profile is Active
					}
				}
			],
			raw: true
		});

		if (!isDoctorExist) throw new BadRequestError("Doctor doesn't exist");

		return await this.getSetupProfile(doctor_id, RolesEnum.Doctor, true);
	}
	async verifyProffessionalInfo(
		doctor_id: number,
		isVerified: boolean,
		profile_id: number
	) {
		await DrUsers.update(
			{
				is_Profession_Verified: isVerified,
				profession_status_code: isVerified
					? StatusCode.Verified
					: StatusCode.Declined,
			},
			{
				where: {
					doctor_id: doctor_id,
				},
			}
		);

		// For Profile details value update case
		let profileData: any = await ProfileDetails.findOne({
			where: { id: profile_id },
			order: [["createdAt", "DESC"]],
			attributes: [
				"id",
				"profile_data",
				"new_profile_data",
				"status_code",
				"createdAt",
				"updatedAt",
			],
			raw: true,
		});

		if (isVerified && profileData) {
			await ProfileDetails.update(
				{ status_code: StatusCode.Verified },
				{ where: { id: profile_id } }
			);
			await DrUsers.update(
				{ profession_status_code: StatusCode.Verified },
				{ where: { doctor_id: doctor_id } }
			);
			await new UserRoleService().upsertUserRole({
				user_id: doctor_id,
				role_id: RolesEnum.Doctor,
				status_code: StatusCode.Verified,
				verified_on: new Date()
			});
			let { new_profile_data } = profileData;
			//update proffesional info
			await this.addProfessionalDetails(
				new_profile_data.professionalInformation,
				new_profile_data.otherInformation.conventionDetails.medical_convention
			);
			//update education info
			await this.addEducationalDetails({
				...new_profile_data.educationalQualification,
				doctor_id: doctor_id,
			});
		} else {
			if (profileData.status_code === StatusCode.Unverified_new) {
				await ProfileDetails.update(
					{ status_code: StatusCode.Declined },
					{ where: { id: profile_id } }
				);
				await UserRole.update(
					{ status_code: StatusCode.Declined },
					{ where: { user_id: doctor_id, role_id: RolesEnum.Doctor } }
				);
				await DrUsers.update(
					{ profession_status_code: StatusCode.Declined },
					{ where: { doctor_id: doctor_id } }
				);
			} else if (profileData.status_code === StatusCode.Unverified_edit) {
				await ProfileDetails.update(
					{ status_code: StatusCode.Declined },
					{ where: { id: profile_id } }
				);
				await DrUsers.update(
					{ profession_status_code: StatusCode.Declined },
					{ where: { doctor_id: doctor_id } }
				);
			}
		}

		const data = await new UserRoleService().isUserRoleExists(
			doctor_id,
			RolesEnum.Doctor
		);

		// if (isVerified) {
		// 	console.log(data , "data");
		// 	if (data && data.status_code == StatusCode.Unverified_new) {
		// 		await new UserRoleService().upsertUserRole({
		// 			user_id: doctor_id,
		// 			role_id: RolesEnum.Doctor,
		// 			status_code: isVerified ? StatusCode.Verified : StatusCode.Declined,
		// 			verified_on: moment().format('YYYY-MM-DD hh:mm'),
		// 		});
		// 	}
		// }

		return isVerified ? "Verified Successfully" : "Unverified Successfully";
	}

	async getVerficationStatus(doctor_id: number) {
		let roleResult: any = await UserRole.findOne(
			{
				where: {
					user_id: doctor_id,
					role_id: RolesEnum.Doctor
				},
				raw: true
			});

		if (!roleResult) {
			throw new BadRequestError('User Role does not Exists');
		}

		let userStatus = {} as any;

		if (roleResult.status_code === StatusCode.Unverified_new) {
			userStatus.status_code = roleResult.status_code
			userStatus.message = ResponseMessageEnum.UNVERIFIED_NEW_MESSAGE
		} else if (roleResult.status_code === StatusCode.Verified || roleResult.status_code === StatusCode.Unverified_edit) {
			userStatus.status_code = StatusCode.Verified
			userStatus.message = ResponseMessageEnum.VERIFIED_MESSAGE
		} else if (roleResult.status_code === StatusCode.Declined) {
			userStatus.status_code = roleResult.status_code
			userStatus.message = ResponseMessageEnum.DECLINED_MESSAGE
		}

		return userStatus;
	}

	async getPatientBookingDetails(bookingID: number, limit: number, offset: number) {
		let booking: any = await DrPatientAppoiment.findOne({ where: { id: bookingID }, raw: true });
		if (!booking) throw new BadRequestError(ResponseMessageEnum.INVALID_BOOKING_ID);

		//let workplace: any = await dr_Workplaces.findOne({attributes: ['workplace_name'], where: {id: booking.workplace_id}, raw: true});
		let [patient_details, workplace, prescriptionDetails, doctorDetails] = await Promise.all([
			Users.findOne({
				attributes: ['first_name', 'last_name', 'gender', 'birth_date'],
				where: { id: booking.patient_id }, raw: true
			}),
			dr_Workplaces.findOne({
				attributes: ['workplace_name', 'address_id'],
				where: { id: booking.workplace_id }, raw: true
			}),
			Prescriptions.findOne({ where: { booking_id: bookingID }, raw: true }),
			this.getDoctorBasicDetails(booking.doctor_id)
		]) as any;

		//latest patient details
		if (patient_details) booking.patient_details = patient_details;

		//doctor details
		if (doctorDetails) booking.doctorDetails = doctorDetails;

		//latest workplace details
		if (!workplace) throw new BadRequestError(ResponseMessageEnum.INVALID_DR_WORKPLACE);
		booking.workplace_name = workplace.workplace_name;

		//Workplace Addresss
		let addressDetails: any = await Address.findOne({ attributes: ['address'], where: { id: workplace.address_id }, raw: true });
		booking.workplace_address = addressDetails.address;

		//is prescription added then get prescription data
		if (prescriptionDetails) {
			booking.isPrescribed = true;
			booking.prescription = prescriptionDetails;
		} else {
			booking.isPrescribed = false;
		}

		//is medical history shared by patient
		if (booking.medical_history_shared) {
			// To add medical history data i.e in ML5
			booking.app_based_history = await new PatientService().getAllPrescrptionList(booking.patient_id, limit, offset);
		}

		return { booking, limit, offset };
	}

	async getAllDoctorsByName(name: string) {
		Users.hasOne(DrUsers, { foreignKey: "doctor_id" });
		DrUsers.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });
		Users.hasOne(DrWorkplaceUsers, { foreignKey: "user_id" });
		DrWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		dr_Workplaces.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
		DrWorkplaceUsers.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

		let doctors: any[] = [];
		doctors = await Users.findAll({
			where: {
				[Op.or]: [
					{
						first_name: {
							[Op.like]: `%${name}%`,
						},
					},
					{
						last_name: {
							[Op.like]: `%${name}%`,
						},
					},
				]
			},
			attributes: [
				["id", "userID"],
				["first_name", "first_name"],
				["last_name", "last_name"],
				["profile_image", "profile_image"],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("workplace_id")), "workplace_id"],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
			],
			include: [
				{
					model: DrUsers,
					attributes: []
				},
				{
					model: UserRole,
					attributes: [],
					where: {
						role_id: RolesEnum.Doctor,
						active_status: 1,
						status_code: {
							[Op.in]: [StatusCode.Verified, StatusCode.Unverified_edit]
						}, //only verfied doctors must be shown to a doctor
					},
				},
				{
					model: DrWorkplaceUsers,
					attributes: [],
					where: {
						active_workplace: 1 // For doctors which have active workplace
					},
					include: [
						{
							model: dr_Workplaces,
							attributes: [],
						}
					],
				},
				{
					model: DrSpeciality,
					attributes: [],
					include: [
						{
							model: Speciality,
							attributes: [],
						},
					],
				},
			],
			raw: true,
			group: ["userID"],
		});

		const reffredDoctors = await Promise.all(
			doctors.map(async (doctor) => {
				if (!!doctor.profile_image)
					doctor.profile_image = await new FileService().getProfileImageLink(
						doctor.userID,
						RolesEnum.Doctor,
						doctor.profile_image
					);

				doctor.specialities = doctor.specialities ? doctor.specialities.split(',') : [];
				return doctor;
			})
		)

		return reffredDoctors;
	}

	async addDrReferrals(refferals: any[], prescriptions_id: number, booking_id: number) {
		try {
			let referralBody: any[] = [];
			for (let referral of refferals) {
				let { doctor_id = '', workplace_id = '', workplaceName = '', referral_name, speciality } = referral;
				let referralobj: any = {
					doctor_id,
					booking_id,
					prescriptions_id,
					referral_name,
					workplace_id,
					workplaceName,
					speciality
				};
				referralBody.push(referralobj);
			}
			await Referral.bulkCreate(referralBody, { returning: true });

			return { message: "Referral added Successfully" };
		} catch (error) {
			throw new BadRequestError("Issue while adding Referral in doctor service : " + error);
		}
	}

	async addRxImmunisation(medicines: any[], prescriptions_id: number, booking_id: number) {
		try {
			let rxList: any[] = [];
			for (let obj of medicines) {
				let { medicine_id, medicine_name = '', strength, frequency,
					duration, instructions = '', method_of_use,
					immunisation = 0, is_repeatable_medicine, repeat_after, repeat_after_type } = obj;

				let rxObj = {
					medicine_id, medicine_name, strength, frequency,
					duration, instructions, method_of_use, booking_id, prescriptions_id, immunisation, is_repeatable_medicine, repeat_after, repeat_after_type
				};
				rxList.push(rxObj);
			}
			await RxImmunisation.bulkCreate(rxList, { returning: true });
			return { message: "Rx for Medicine added Successfully" };
		} catch (error) {
			throw new BadRequestError("Issue while adding Rx for Medicine in doctor service : " + error);
		}
	}

	async addLabTest(tests: any[], prescriptions_id: number, booking_id: number) {
		try {
			let labtests: any[] = [];
			for (let obj of tests) {
				let { test_id, test_name, details = '' } = obj;

				let testobj = { test_id, test_name, details, booking_id, prescriptions_id };
				labtests.push(testobj);
			}
			await PatientLabTest.bulkCreate(labtests, { returning: true });
			return { message: "Lab Tests needed for Pateint added Successfully" };
		} catch (error) {
			throw new BadRequestError("Issue while adding lab test in doctor service : " + error);
		}
	}

	async addCommentOnPrescription(prescriptionsId: number, comment: string) {
		if (comment) {
			let addedCmnt = await Prescriptions.update({ comments: comment }, { where: { id: prescriptionsId } });
			if (!addedCmnt) throw new BadRequestError("Issue while adding comments");
		}
		return { msg: "Added Comments on Prescriptions Sucessfully" };
	}

	async addFollowUp(prescriptionsId: number, followUpDuration: number, followUpDurationType: string) {
		let followup = await Prescriptions.update(
			{
				followUpDuration, followUpDurationType
			},
			{
				where: { id: prescriptionsId }
			});

		if (!followup) throw new BadRequestError("Issue while adding Follow Up");

		return { msg: "Follow Up added Successfully" };
	}

	async addVitals(body: any) {
		const vitalsBody: any = {
			blood_pressure: body.blood_pressure,
			heart_rate: body.heart_rate,
			height: body.height,
			weight: body.weight,
			temp: body.temp,
			booking_id: body.booking_id
		};


		try {
			await PatientVitals.create(vitalsBody, { returning: true });
			return { message: "Vital added successfully" }
		}
		catch (error) {
			throw new BadRequestError("Issue while adding vitals : " + error);
		}
	}

	async diagnosisInfo(prescriptionsId: number, diagnosis: string) {

		let diagnosisDetail: any = await Prescriptions.update(
			{
				diagnosis: diagnosis,
			},
			{
				where: {
					id: prescriptionsId,
				},
			}
		);

		if (!diagnosisDetail) throw new Error("Issue while adding diagnosis");

		return { message: "diagnosis added successfully" }
	}

	async addPrescrption(prescriptionObj: any, isOfflinePrescription: boolean = false) {
		let result = await Utils.setTransaction(async () => {
			return this.prescriptionDetailsAdd(prescriptionObj, isOfflinePrescription);
		});
		return result;
	}

	async prescriptionDetailsAdd(prescriptionObj: any, isOfflinePrescription: boolean = false) {
		// let result = await Utils.setTransaction(async () => {
		try {
			let { booking_id, diagnosis, comments, followUpDuration, followUpDurationType, is_repeatable_prescriptions,
				vitals, rxMedicine, prescribedTest, refferals } = prescriptionObj;

			let presc: any = { booking_id, is_repeatable_prescriptions };
			// Add entry for Prescription & fetch prescriptionId
			let prescription: any = await Prescriptions.create(presc);

			if (!prescription.id) throw new BadRequestError("Issue while creating Prescription Entry");

			// Add Diagonisis
			if (diagnosis) await this.diagnosisInfo(prescription.id, diagnosis);

			// Add Comments
			if (comments) await this.addCommentOnPrescription(prescription.id, comments);

			// Add FollowUp
			if (followUpDurationType) await this.addFollowUp(prescription.id, followUpDuration, followUpDurationType);

			// Add Vitals
			if (vitals) await this.addVitals({ ...vitals, booking_id });

			// Add Rx Medicne
			if (rxMedicine.length) await this.addRxImmunisation(rxMedicine, prescription.id, booking_id);

			// Add Tests
			if (prescribedTest.length) await this.addLabTest(prescribedTest, prescription.id, booking_id);

			// Add Dr Refferals
			if (refferals.length) await this.addDrReferrals(refferals, prescription.id, booking_id);

			//Update Appointment Status
			await DrPatientAppoiment.update({ status: 'Completed' }, { where: { id: booking_id } });

			let bookingData: any = await DrPatientAppoiment.findOne({
				attributes: ['date', 'start_time', 'doctor_id', 'patient_id', 'workplace_id'],
				where: { id: booking_id }, raw: true
			});

			let [patientData, doctorData, workplaceData] = await Promise.all([
				Users.findOne({
					attributes: [[fn("CONCAT", col("first_name"), " ", col("last_name")), "name"], 'gender', 'birth_date', 'is_minor_account', 'parent_id', "contact_number"],
					where: { id: bookingData.patient_id }, raw: true
				}),
				this.getDoctorBasicDetails(bookingData.doctor_id),
				dr_Workplaces.findOne({
					attributes: ['workplace_name', 'address_id'],
					where: { id: bookingData.workplace_id }, raw: true
				}),

			]) as any;

			//Workplace Addresss
			let addressDetails: any = await Address.findOne({ attributes: ['address'], where: { id: workplaceData.address_id }, raw: true });

			//add Patient Age
			let age = await Utils.getAge(patientData.birth_date);
			patientData.age = age;
			let data = [{
				prescriptionData: prescriptionObj,
				patientData,
				doctorData,
				workplaceData: { ...workplaceData, workplaceAddress: addressDetails.address },
				bookingData: { date: bookingData.date, time: bookingData.start_time },

			}]
			//Generate Prescription PDF from JSON obj pass down to create prescripton entry
			//if it is offline prescription then create encrypted pdf
			let dobPassword = patientData.birth_date.split("-").join("");
			let fileData = await Utils.pdfGeneration(data, { patientName: patientData.name, DOB: dobPassword }, isOfflinePrescription);


			let sendData: any = { nonEncryptedPrescription: "", encryptedPrescription: "" }

			//Fetch Encrypted/Non encrypted PDF from the following Path Upload it on S3 bucket using file controller.
			let fileUploadData: any = await new FileService().processPDF(fileData.pdf, bookingData.patient_id);
			if (fileUploadData.uploadId) {
				// add fileId to prescription table
				await Prescriptions.update({ user_upload_id: fileUploadData.uploadId }, { where: { id: prescription.id } });
				sendData.nonEncryptedPrescription = fileUploadData.fileUrl;
			}
			if (fileData.encrypted_pdf != null) {
				//send sms to user mobile no with the given link, and the password format
				let s3FileUrl = await new FileService().processPDF(fileData.encrypted_pdf, bookingData.patient_id, false);
				if (s3FileUrl) {
					let contact_number = patientData.contact_number;
					if (patientData.is_minor_account) {
						let parentData: any = await Users.findOne({
							attributes: ["contact_number"],
							where: { id: patientData.parent_id }, raw: true
						});
						contact_number = parentData.contact_number
					}
					await this.sendOfflinePrescriptionSms(patientData.name, doctorData.doctor_name, s3FileUrl.fileUrl, contact_number)
					sendData.encryptedPrescription = s3FileUrl.fileUrl;

				}

			}
			return { msg: ResponseMessageEnum.PRESCRIPTION_ADDED_SUCCESS, ...sendData };

		} catch (error) {
			throw new BadRequestError("Issue while adding Prescription => " + error);
		}
		// });
		// return result;
	}

	async sendOfflinePrescriptionSms(patientName: string, doctorName: string, s3FileUrl: string, contact_number: string) {
		const { APP_LINK }: any = envData;
		const optSent = await Utils.sendMessage(
			`${patientName},
			Dr. ${doctorName} written prescription. Use following link to download ${s3FileUrl}. Password is your DOB in yyyymmdd format.Download app ${APP_LINK}`,
			contact_number
		);
		if (!!optSent && optSent.sid) {
			return { msg: "Prescription shared" }
		}
		else {
			return false;
		}
	}

	async getMedicineDetailsByName(medicine_name: string, immunisation: boolean = false) {
		let medicine: any[] = await Drug.findAll(
			{
				attributes: [
					[fn('DISTINCT', col('drug_name')), 'drug_name'],
					'id',
					'drug_manufacturer', 'drug_salt', 'strength', ['drug_route', 'method_of_use'], ['administration_rules', 'instructions'], 'immunisation',
					'drug_unit', 'packaging'],
				where: { drug_name: { [Op.like]: `%${medicine_name}%` }, drug_status: true, immunisation: immunisation, is_child: 0 },
				group: ["drug_name"],
				raw: true
			});

		return medicine;
	}

	async getPrescriptionDetails(prescriptions_id: number) {
		let prescription: any = await Prescriptions.findOne({ where: { id: prescriptions_id }, raw: true });
		if (!prescription) throw new BadRequestError(ResponseMessageEnum.INVALID_PRESCRIPTION);

		let [vitals, rxMedicine, prescribedTest, refferals] = await Promise.all([
			PatientVitals.findAll({ where: { booking_id: prescription.booking_id }, raw: true }),
			RxImmunisation.findAll({ where: { prescriptions_id: prescription.id }, raw: true }),
			PatientLabTest.findAll({ where: { prescriptions_id: prescription.id }, raw: true }),
			Referral.findAll({ where: { prescriptions_id: prescription.id }, raw: true })
		]) as any;

		prescription.vitals = vitals[0];
		prescription.rxMedicine = rxMedicine[0];
		prescription.prescribedTest = prescribedTest[0];
		prescription.refferals = refferals[0];

		return prescription;
	}

	async getDoctorBasicDetails(doctor_id: number) {
		Users.hasOne(DrUsers, { foreignKey: "doctor_id" });
		DrUsers.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });
		Users.hasOne(DrQualifications, { foreignKey: "doctor_id" });
		DrQualifications.belongsTo(Users, { foreignKey: "doctor_id" });
		Qualifications.hasOne(DrQualifications, { foreignKey: "qualification_id" });
		DrQualifications.belongsTo(Qualifications, { foreignKey: "qualification_id" });
		Users.hasOne(MedicalRegistrarDetail, { foreignKey: "doctor_id" });
		MedicalRegistrarDetail.belongsTo(Users, { foreignKey: "doctor_id" });

		let doctor_details: any = await Users.findOne({
			where: {
				id: doctor_id
			},
			attributes: [
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "doctor_name"],
				["contact_number", "contact_number"],
				[fn("", col("experience")), "experience"],
				[fn("", col("medical_convention")), "medical_convention"],
				[fn("", col("prescription_limit")), "prescription_limit"],
				[fn("", col("prescription_days_week_month")), "prescription_days_week_month"],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("education"))), "education"],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
				[fn("", col("registration_number")), "registration_number"],
				[fn("", col("council_id")), "council_id"],
			],
			include: [
				{
					model: DrUsers,
					attributes: []
				},
				{
					model: DrSpeciality,
					attributes: [],
					include: [
						{
							model: Speciality,
							attributes: []
						}
					]
				},
				{
					model: DrQualifications,
					attributes: [],
					include: [
						{
							model: Qualifications,
							attributes: []
						}
					]
				},
				{
					model: MedicalRegistrarDetail,
					attributes: []
				}
			],
			raw: true
		});

		//council details
		let councilDetails: any = await RegistrationCouncil.findOne({ where: { id: doctor_details.council_id }, raw: true });

		if (doctor_details) {
			doctor_details.education = doctor_details.education ? doctor_details.education.split(",") : [];
			doctor_details.specialities = doctor_details.specialities ? doctor_details.specialities.split(",") : [];
			doctor_details.council_name = councilDetails ? councilDetails.name : '';
		}

		return doctor_details;
	}

	async getCurrentActiveBookings(doctor_id: number, workplace_id: number) {
		return DrPatientAppoiment.findAll({
			attributes: [
				["id", "booking_id"],
				["date", "booking_date"],
				["schedule_id", "schedule_id"],
				["start_time", "start_time"],
				["end_time", "end_time"],
			],
			where: {
				doctor_id: doctor_id,
				workplace_id: workplace_id,
				status: "Accepted",
				date: {
					[Op.gte]: moment().format('YYYY-MM-DD')
				}
			},
			raw: true,
		});
	}

	//closure function for filtering slots for already booked one
	slotsAlreadyBookedComparer(bookedSlots: any[]) {
		return (slotsObj: any) => {
			return bookedSlots.filter((bookingObj) => {
				return bookingObj.schedule_id === slotsObj.id;
			}).length === 0;
		}
	}

	async getMyPatientList(doctor_id: number, limit: number, offset: number, search: string = "", date: string = "") {
		Users.hasOne(DrPatientAppoiment, { foreignKey: "patient_id" });
		DrPatientAppoiment.belongsTo(Users, { foreignKey: "patient_id" });

		let dateCase = date ?
			{
				[Op.and]: [
					Sequelize.where(
						Sequelize.fn("date", Sequelize.col("dr_patient_appoiment.date")),
						"=",
						date
					),
				],
			}
			: {};

		let searchCase = search ?
			{
				[Op.or]: [
					{
						first_name: {
							[Op.like]: `%${search}%`,
						},
					},
					{
						last_name: {
							[Op.like]: `%${search}%`,
						},
					},
				]
			}
			: {};

		let visitedPatients = await DrPatientAppoiment.findAll({
			attributes: [
				["id", "booking_id"],
				["patient_id", "patient_id"],
				["date", "date"],
				["start_time", "start_time"],
				["end_time", "end_time"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "patient_name"],
				[fn("", col("gender")), "gender"],
				[fn("", col("birth_date")), "birth_date"],
				[fn("", col("profile_image")), "profile_image"],
			],
			where: {
				doctor_id: doctor_id,
				// status: {
				// 	[Op.like]: `%Completed%`,
				// },
				is_cancelled: 0,
				...dateCase
			},
			include: [
				{
					model: Users,
					attributes: [],
					where: {
						...searchCase
					}
				},
			],
			raw: true,
			limit: limit,
			offset: offset,
			order: [["date", "DESC"], ["end_time", "DESC"]],
			group: ['booking_id']
		});

		if (visitedPatients.length > 0) {
			let addprofileImagePromises: any[] = [];
			for (let patient of visitedPatients) {
				addprofileImagePromises.push(this.addProfileImageFoPatients(patient))
			}
			visitedPatients = await Promise.all([...addprofileImagePromises]);
		}

		return { visitedPatients, limit, offset };
	}

	async addProfileImageFoPatients(patient: any) {
		if (patient.profile_image)
			patient.profile_image = await new FileService().getProfileImageLink(
				patient.patient_id,
				RolesEnum.Patient,
				patient.profile_image
			);

		return patient;
	}

	async addProfileImageForLinkedPatients(patient: any) {
		if (patient.profile_image)
			patient.profile_image = await new FileService().getProfileImageLink(
				patient.patient_id,
				RolesEnum.Patient,
				patient.profile_image
			);

		if (patient.manage_their_minor_account)
			patient.minorAccounts = await this.getRelatedMinorAccounts(patient.user_id);

		return patient;
	}

	async addOfflinePrescrptionDetails(prescriptionDetails: any, doctor_id: number) {
		let result = await Utils.setTransaction(async () => {
			try {
				let { workplace_id, parent_user, user_details, offline_pateint_entry_time, ...prescription } = prescriptionDetails;
				// Check if user exists or not if not create one & fetch its id
				//const exist = await new UserService().isUserExists(user_details.contact_number);
				let bookedby, bookedFor;
				// if user exists fetch its user id
				if (!parent_user.isnewuser) {
					bookedby = parent_user.id;
				} else {
					let userID = await new UserService().upsertUserDetails({
						first_name: parent_user.first_name,
						last_name: parent_user.last_name,
						birth_date: parent_user.birth_date,
						contact_number: parent_user.contact_number,
						role_id: RolesEnum.Patient
					});
					//Make Account InActive
					await UserRole.update(
						{ active_status: 0 },
						{
							where: {
								user_id: userID,
								role_id: RolesEnum.Patient
							}
						}
					);
					bookedby = userID;
				}

				if (!bookedby) throw new BadRequestError("bookedby User ID Not Found")

				bookedFor = bookedby;

				// check if a minor account
				if (user_details) {

					// check if a new minor account added
					if (user_details.isnewminoruser) {
						let age = await Utils.getAge(user_details.birth_date);
						if (age >= 18) {
							throw new BadRequestError("Minor account can not be of age above 18 years.")
						}
						let addMinorAcc = await new PatientService().addMinorDetails(
							{
								first_name: user_details.first_name,
								middle_name: user_details.middle_name,
								last_name: user_details.last_name,
								birth_date: user_details.birth_date,
								gender: user_details.gender
							},
							bookedby,
							true
						);

						// if (user_details.contact_number.indexOf("+") === -1)
						// 	user_details.contact_number = `+${user_details.contact_number.trim()}`;

						// //Check if minor user exists
						// let minorUser: any = await Users.findOne({
						// 	attributes: ['id', 'first_name', 'last_name', 'gender', 'birth_date', 'profile_image', 'contact_number'],
						// 	where: {
						// 		contact_number: user_details.contact_number,
						// 	},
						// 	raw: true
						// });

						// if (minorUser && minorUser.id)
						bookedFor = addMinorAcc;
					}
					else {
						if (user_details.id)
							bookedFor = user_details.id;
					}
				}

				// create a dummy appointment that will have a flag is_offline to classify
				let appointmentData = {
					doctor_id,
					patient_id: bookedFor,
					workplace_id,
					is_offline: 1,
					...offline_pateint_entry_time,
					bookedby: bookedby,
					video_call: 0,
					audio_call: 0,
					physical_examination: 1,
					medical_history_shared: 0
				}

				let createAppointment = await new PatientService().createAppointment(appointmentData, true);

				//Get the following booking id for the same if dummy booking is done.
				let appointment: any = await DrPatientAppoiment.findOne({
					where: {
						doctor_id,
						patient_id: bookedFor,
						workplace_id,
						is_offline: 1,
						date: {
							[Op.and]: [
								Sequelize.where(
									Sequelize.fn("date", Sequelize.col("dr_patient_appoiment.date")),
									"=",
									offline_pateint_entry_time.date
								),
							],
						}
					},
					raw: true,
				})

				if (!appointment || !appointment.id) throw new BadRequestError("There is no booking data found")
				let booking_id = appointment.id;

				let data = await this.prescriptionDetailsAdd({ ...prescription, booking_id }, true);
				return data;
			} catch (error) {
				throw new BadRequestError(error.message)
			}
		})

		return result;
	}

	async getAllLinkedUsersList(contact_number: string) {

		if (contact_number.indexOf("+") === -1)
			contact_number = `+${contact_number.trim()}`;

		//Check if user exists
		let user: any = await Users.findOne({
			attributes: ['id', 'first_name', 'last_name', 'gender', 'birth_date', 'profile_image', 'contact_number'],
			where: {
				contact_number: contact_number,
				account_activation: 1,
				phone_verify: 1
			},
			raw: true
		});

		if (!user || !user.id) {
			throw new BadRequestError("Contact Number do not exists");
		}

		let linkedAccountPromises: any[] = [];
		//If user exists get linked users having permission for book appointment
		linkedAccountPromises.push(this.getLinkedAccountsWithManageAccountPremission(user.id));

		//If user exists get minor account list
		linkedAccountPromises.push(this.getRelatedMinorAccounts(user.id));

		linkedAccountPromises.push(this.addProfileImageFoPatients(user));
		let [linkedAccountList, minorAccountsList, userDetails] = await Promise.all(linkedAccountPromises);

		return {
			userDetails,
			linkedAccounts: linkedAccountList,
			minorAccounts: minorAccountsList
		}
	}

	async getLinkedAccountsWithManageAccountPremission(user_id: number) {

		Users.hasMany(PatientLinkedAccount, { foreignKey: "requested_to_user_id" });
		PatientLinkedAccount.belongsTo(Users, { foreignKey: "requested_to_user_id" });

		let userList: any = await PatientLinkedAccount.findAll({
			where: {
				requested_by_user_id: user_id,
				manage_their_account: 1,
			},
			attributes: [
				["requested_to_user_id", "user_id"],
				["manage_their_account", "manage_their_account"],
				["manage_their_medical_history", "manage_their_medical_history"],
				["manage_their_minor_account", "manage_their_minor_account"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "name"],
				[fn("", col("gender")), "gender"],
				[fn("", col("birth_date")), "birth_date"],
				[fn("", col("profile_image")), "profile_image"],
				[fn("", col("contact_number")), "contact_number"],
			],
			include: [
				{
					model: Users,
					attributes: [],
					where: {
						account_activation: 1,
						phone_verify: 1
					}
				},
			],
			order: [['updatedAt', 'desc']],
			raw: true,
		});

		if (userList.length > 0) {
			let addprofileImagePromises: any[] = [];
			for (let user of userList) {
				addprofileImagePromises.push(this.addProfileImageForLinkedPatients(user))
			}
			userList = await Promise.all([...addprofileImagePromises]);
		}

		return userList;
	}

	async getRelatedMinorAccounts(parent_id: number) {
		Users.hasOne(PatientUser, { foreignKey: "user_id" });
		PatientUser.belongsTo(Users, { foreignKey: "user_id" })
		Users.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });

		const minorAccountsList: any = await Users.findAll({
			where: {
				parent_id: parent_id,
			},
			include: [
				{
					model: UserRole,
					attributes: [],
					where: {
						active_status: 1 // User Current Role Profile is Active
					},
					required: true,
				},
				{
					model: PatientUser,
					attributes: [],
				}
			],
			attributes: ["id", [fn("CONCAT", col("first_name"), " ", col("last_name")), "name"], "gender", "birth_date", [fn("", col("blood_group")), "blood_group"], "updated_at"],
			order: [['updated_at', 'desc']],
			raw: true,
		});
		return minorAccountsList;
	}

	async getAllMonthlyAppoinmentList(doctor_id: number, month: number, year: number) {
		let mm = month < 10 ? `0${month}` : `${month}`;
		let nm = (month + 1) < 10 ? `0${month + 1}` : month === 12 ? `0${1}` : `${month + 1}`;
		let ny = month === 12 ? (year + 1) : year;

		let appointmentList = await DrPatientAppoiment.findAll({
			attributes: [
				["date", "booking_date"],
			],
			where: {
				doctor_id: doctor_id,
				status: "Accepted",
				is_cancelled: 0,
				date: {
					[Op.gte]: moment(new Date(`${year}-${mm}-01 00:00:00`)).format('YYYY-MM-DD'),
					[Op.lt]: moment(new Date(`${ny}-${nm}-01 00:00:00`)).format('YYYY-MM-DD')
				}
			},
			group: ["booking_date"],
			raw: true,
		});
		return appointmentList;
	}
}
