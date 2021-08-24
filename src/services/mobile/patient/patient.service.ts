import Identity from "../../../models/identity.model";
import PatientUser from "../../../models/patient_user.model";
import Roles from "../../../models/roles.model";
import Users from "../../../models/users.model";
import TemporaryRequestPharmacy from "../../../models/temporary_request_pharmacy.model";
import TemporaryPatientOrderPharmacy from "../../../models/temporary_patient_order_pharmacy.model";
import TemporaryRxImmunisation from "../../../models/temporary_rx_immunisation.model";
import sequelize from "../../../db/sequalise";
import UserEmergencyContact from "../../../models/user_emergency_contact.model";
import DrPatientAppoiment from "../../../models/dr_patient_appoiment.model";
import Address from "../../../models/address.model";
import PatientLinkedAccount from "../../../models/patient_linked_account.model";

import { Utils, Notifications } from "../../../helpers";
import { UserService } from "../user/user.service";
const { QueryTypes } = require("sequelize");
import { get } from "config";
import { AddressService } from "../../shared/address.service";
import { BadRequestError, UnauthorizedError, NotFoundError } from "routing-controllers";
import { UserRoleService } from "../../shared/user-role.service";
const { AWS_FILE_UPLOAD_LINK } = get("APP");
import { fn, col, Op } from "sequelize";
import { FileService } from "../../shared/file.service";
import dr_Workplaces from "../../../models/dr_workplaces.model";
import DrWorkplaceUsers from "../../../models/dr_workplace_users.model";
import DrUsers from "../../../models/dr_users.model";
import { RolesEnum } from "../../../constants/roles.enum";
import UserRole from "../../../models/user_role.model";
import Speciality from "../../../models/specialities_speciality.model";
import DrSpeciality from "../../../models/dr_speciality.model";
import { ResponseMessageEnum } from "../../../constants/constant.enum";
import { IsEdited } from "../../../constants/isEdited.enum";
import DrSchedule from "../../../models/dr_schedule.model";
import HealthConcerns from "../../../models/health_concerns.model";
import SpecalitiesHealthConcerns from "../../../models/specialities_health_concerns.model";
import { StatusCode } from "../../../constants/status_code.enum";
import { LinkStatus } from "../../../constants/linkedAccountStatus.enum";
import { LinkActiveStatus } from "../../../constants/linkActiveStatus.enum";
import Prescriptions from "../../../models/prescriptions.model";
import PatientLabTest from "../../../models/patient_lab_test.model";
import LabWorkplaces from "../../../models/lab_workplaces.model";
import RequestLab from "../../../models/request_lab.model";
import Allergies from "../../../models/allergies.model";
import LabWorkplaceUsers from "../../../models/lab_workplace_users.model";
import RxImmunisation from "../../../models/rx_immunisation.model";
import PharmacyWorkplaces from "../../../models/pharmacy_workplaces.model";
import PharmacyWorkplaceUsers from "../../../models/pharmacy_workplace_users.model";
import Drug from "../../../models/drug.model";
import TemporaryOrderSummary from "../../../models/temporary_order_summary.model";
import RequestPharmacy from "../../../models/request_pharmacy.model";
import PatientOrderPharmacy from "../../../models/patient_order_pharmacy.model";
import OrderSummary from "../../../models/order_summary.model";
import PharmacyCancelOrder from "../../../models/pharmacy_cancel_order.model";
import TemporaryRequestLab from "../../../models/temporary_request_lab.model";
import TemporaryPatientOrderLab from "../../../models/temporary_patient_order_lab.model";
import TemporaryLabTests from "../../../models/temporary_lab_tests.model";
import LabTest from "../../../models/lab_test.model";
import TemporaryLabOrderSummary from "../../../models/temporary_lab_order_summary.model";
import LabOrderSummary from "../../../models/lab_order_summary.model";
import LabCancelOrder from "../../../models/lab_cancel_order.model";
import PatientOrderLab from "../../../models/patient_order_lab.model";
import LaboratoryLabTests from "../../../models/laboratory_lab_test.model";
import PatientAllergies from "../../../models/patient_allergies.model";
import { DoctorService } from "../doctor/doctor.service";
import PatientLinkedAccountTemprory from "../../../models/patient_linked_account_temprory.model";
import DrDelegate from "../../../models/dr_delegate.model";
import RatingReview from "../../../models/rating_and_review.model";
import moment = require("moment");
import UserUploads from "../../../models/user_uploads.model";
import Tests from "../../../models/tests.model";
import Timeouts from "../../../models/timeouts.model";
import { OrderStatusEnum } from "../../../constants/order_status.enum";
import { PharmacyService } from "../pharmacy/pharmacy.service";
import { LaboratoryService } from "../laboratory/laboratory.service";
const { v4 } = require('uuid');

export class PatientService {
	async addPatient(body: any) {
		let userId;
		let patientExists: any = null;

		const patientRoleId: any = await Roles.findOne({
			where: {
				role: "Patient",
			},
		});

		if (body.id) {
			userId = body.id;
			const isUserExists: any = await Users.findOne({
				where: {
					id: body.id,
				},
			});

			if (isUserExists) {
				Users.update(
					{
						email: body.email,
						birth_date: body.birth_date,
						gender: body.gender,
					},
					{
						where: {
							id: isUserExists.id,
						},
					}
				);
			}
		} else {
			const isUserExists: any = await new UserService().isUserExists(
				body.contact_number
			);

			// if user tries to setup new profile with same verified contact number
			// then throw error "User Alreay Exists"
			if (isUserExists && isUserExists.phone_verify) {
				throw new BadRequestError(ResponseMessageEnum.USER_ALREADY_EXISTS);
			}
			if (isUserExists) {
				patientExists = await this.isPatientExists(isUserExists.id);
				if (!patientExists) {
					userId = isUserExists.id;
				} else {
					return {
						message: "Patient Already exists",
						id: isUserExists.id,
					};
				}
			} else {
				const max = await Users.max("id");
				userId = isNaN(max) ? 1 : max + 1;
			}
			body.id = userId;

			body.default_role = body.role_id;

			if (!patientExists) {
				body.password = Utils.encrypt(body.password);
				body.phone_verify = 1;
				const userSaved = await Users.upsert(body);
				new UserRoleService().upsertUserRole({
					role_id: patientRoleId.id,
					user_id: userId,
					verify_account: 1,
					status_code: StatusCode.Verified,
				});
				// const userRolesave = await UserRole.upsert({
				// 	role_id: patientRoleId.id,
				// 	user_id: userId,
				// });
			}
		}

		let addrObj: any = {
			address: body.society,
			location: {
				latitude: body.latitude,
				longitude: body.longitude,
			},
			locality: body.locality,
			city: body.city,
			pincode: body.pincode,
		};

		//adding address here
		const address: any = await new AddressService().addAddress(addrObj);
		delete body["id"];
		const patientUserSave = await PatientUser.upsert({
			id: patientExists ? patientExists.id : null,
			user_id: userId,
			blood_group: body.blood_group,
			address_id: address.id,
		});

		if (patientUserSave) {
			let userIdentity: any = await Identity.findOne({
				where: { user_id: userId },
				raw: true,
			});
			// add identiy entry
			let docDetails: any = { type: body.document_type, number: body.document_number, };
			if (userIdentity) {
				await Identity.update(docDetails, { where: { user_id: userId } });
			} else {
				docDetails.user_id = userId;
				await Identity.create(docDetails);
			}

			const isEmergencyExists: any = await UserEmergencyContact.findOne({
				where: {
					user_id: userId,
				},
			});
			const emergencyContacts = await UserEmergencyContact.upsert({
				id: isEmergencyExists ? isEmergencyExists.id : null,
				first_name: body.emergency_first_name,
				last_name: body.emergency_last_name,
				contact_number: body.emergency_contact_number,
				user_id: userId,
			});
		}

		await new UserService().updateProfileSetup(userId, RolesEnum.Patient);

		return { userId: userId };
	}

	async updatePatient(body: any, user_id: string) {
		try {
			const {
				blood_group,
				gender,
				birth_date,
				email,
				document_type,
				document_number,
			} = body.personal_information;

			const {
				address_id,
				location,
				locality,
				address,
				city,
				pincode,
			} = body.address_information;

			const { first_name, last_name, contact_number } = body.emergency_contact;

			// updating users table
			const userBody = { email, gender, birth_date };

			await Users.update(userBody, {
				where: {
					id: user_id,
				},
			});

			// updating identity table
			await Identity.update(
				{
					type: document_type,
					number: document_number,
				},
				{
					where: {
						user_id,
					},
				}
			);

			// updating patient_user table
			await PatientUser.update(
				{ blood_group },
				{
					where: {
						user_id: user_id,
					},
				}
			);

			// updating user_emergency_contact table
			await UserEmergencyContact.update(
				{
					first_name,
					last_name,
					contact_number,
				},
				{
					where: {
						user_id,
					},
				}
			);

			// updating address table
			const { latitude, longitude } = location;
			const coordinates: number[] = [latitude, longitude];
			const point = { type: "Point", coordinates: coordinates };

			const addressObj: any = {
				location: point,
				locality,
				address,
				city,
				pincode,
			};

			await Address.update(addressObj, {
				where: {
					id: address_id,
				},
			});

			return { message: "Profile Updated Successfully" };
		} catch (error) {
			console.log(error);
			throw new UnauthorizedError("Something went wrong");
		}
	}

	async getPatientDetails(user_id?: number) {
		const condition = user_id ? "and user.id = :user_id" : "";

		const details: any[] = await sequelize.query(
			`
                select user.id as user_id , user.first_name ,user.middle_name , user.last_name , user.contact_number , user.email,
                user.gender, user.birth_date  , user.lab_or_pharma_employement_number,
				Concat('${AWS_FILE_UPLOAD_LINK}/user_documents', '/' ,'user_', user.id ,'/profile_picture' , '/' , user.profile_image) as profile_image,
                user.profile_image_verify,
                if(new_profile_image IS NOT NULL , Concat('${AWS_FILE_UPLOAD_LINK}/user_documents', '/' ,'user_', user.id ,'/profile_picture' , '/' , user.new_profile_image) , null ) as new_profile_image,
                d.blood_group ,addr.location , addr.city , addr.locality , addr.address ,addr.pincode ,
                document.type as document_type , document.number as document_number ,
                em.first_name as emergency_first_name , em.last_name as emergency_last_name ,
                em.contact_number as emergency_contact_number,
                em.id as emergency_contact_id,
                document.id as document_id,
                d.id as patient_user_id,
                ST_X(location) as latitude , ST_Y(location) as longitude,
                a.id as user_role_id , a.role_id as role_id,
                a.active_status,
				if(a.verify_account = 0 , 0 ,1 ) as isVerified,
				stat.id as status_code , stat.status_name,
				imgstat.id as image_status_id , imgstat.status_name as image_status_name,
                if((select user_id from user_role where role_id  = (select id from roles where role = "Doctor") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isDoctor,
                if((select user_id from user_role where role_id  = (select id from roles where role = "Laboratory") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isLab,
                if((select user_id from user_role where role_id  = (select id from roles where role = "Pharmacy") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isPharma,
                if((select user_id from user_role where role_id  = (select id from roles where role = "Patient") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isPatient
				from user_role a join roles b on a.role_id = b.id and b.role = "Patient"
				join user_status_code stat on stat.id = a.status_code
                join users user on a.user_id = user.id ${condition}
				left join patient_user d on d.user_id = user.id
				left join address addr on addr.id = d.address_id
                left join user_emergency_contact em on em.user_id = user.id
				left join identity document on document.user_id = user.id
				left join user_status_code imgstat on imgstat.id = user.image_status_code
				`,
			{
				replacements: { user_id: user_id },
				type: QueryTypes.SELECT,
			}
		);

		return user_id ? details[0] : details;
	}

	async getAllPatients(
		limit: number,
		offset: number,
		search: string,
		status: string,
		sort: string,
		order: string = "asc"
	) {
		let subqueryalias = "ps";
		let accoutnStatus: any = {
			all: "",
			inactive: `${subqueryalias}.active_status = 0`,
			unverified_new: `${subqueryalias}.status_code = 2 and ${subqueryalias}.active_status = 1 `,
			unverified_edit: `${subqueryalias}.status_code = 3 and ${subqueryalias}.active_status = 1`,
			verified: `${subqueryalias}.status_code = 1 and ${subqueryalias}.active_status = 1  `,
		};

		/*
  unverified_new: `${subqueryalias}.active_status = 0 AND ${subqueryalias}.isVerified = 0`,
  unverified_edit: `${subqueryalias}.active_status = 1 AND ${subqueryalias}.isVerified = 0`,
*/

		const limitcase =
			offset > 0 ? `limit ${limit} offset ${offset}` : `limit ${limit}`;

		let filtercase =
			status && accoutnStatus[status.toLowerCase()]
				? `${accoutnStatus[status.toLowerCase()]}`
				: true;

		let searchcase = `${subqueryalias}.first_name like '%${search}%' OR ${subqueryalias}.last_name like '%${search}%' OR ${subqueryalias}.full_name like '%${search}%' OR ${subqueryalias}.user_id like '%${search}%' OR ${subqueryalias}.contact_number like '%${search}%' OR ${subqueryalias}.email like '%${search}%'`;
		let orderbycase = sort
			? `order by ${subqueryalias}.${sort} ${order}`
			: `order by ${subqueryalias}.user_id desc`;
		let whereclause = search
			? `where (${searchcase}) AND (${filtercase}) ${orderbycase}`
			: `where (${filtercase}) ${orderbycase}`;

		const query = `select * from (select user.id as user_id , user.first_name ,user.middle_name , user.last_name , CONCAT(user.first_name ,' ' , user.last_name) as full_name, user.contact_number , user.email,
			user.gender, user.birth_date  , user.lab_or_pharma_employement_number,
			Concat('${AWS_FILE_UPLOAD_LINK}/user_documents', '/' ,'user_', user.id ,'/profile_picture' , '/' , user.profile_image) as profile_image,
			user.profile_image_verify,
			if(new_profile_image IS NOT NULL , Concat('${AWS_FILE_UPLOAD_LINK}/user_documents', '/' ,'user_', user.id ,'/profile_picture' , '/' , user.new_profile_image) , null ) as new_profile_image,
			d.blood_group ,addr.location , addr.city , addr.locality , addr.address ,addr.pincode,
			document.type as document_type , document.number as document_number ,
			em.first_name as emergency_first_name , em.last_name as emergency_last_name ,
			em.contact_number as emergency_contact_number,
			em.id as emergency_contact_id,
			document.id as document_id,
			d.id as patient_user_id,
			ST_X(location) as latitude , ST_Y(location) as longitude,
			a.id as user_role_id , a.role_id as role_id,
			a.active_status,
			if(a.verify_account = 0 , 0 ,1 ) as isVerified,
            stat.id as status_code,
            stat.status_name,
			if((select user_id from user_role where role_id  = (select id from roles where role = "Doctor") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isDoctor,
			if((select user_id from user_role where role_id  = (select id from roles where role = "Laboratory") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isLab,
			if((select user_id from user_role where role_id  = (select id from roles where role = "Pharmacy") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isPharma,
			if((select user_id from user_role where role_id  = (select id from roles where role = "Patient") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isPatient
			from user_role a join roles b on a.role_id = b.id and b.role = "Patient"
            join user_status_code stat on stat.id = a.status_code
			join users user on a.user_id = user.id
			left join patient_user d on d.user_id = user.id
			left join address addr on addr.id = d.address_id
			left join user_emergency_contact em on em.user_id = user.id
			left join identity document on document.user_id = user.id) as ${subqueryalias} ${whereclause}`;

		const details = await sequelize.query(`${query} ${limitcase};`, {
			replacements: { limitcase: limitcase },
			type: QueryTypes.SELECT,
		});

		const total_count: any = await sequelize.query(
			`select count(*) as count from (${query}) as tempAllies`,
			{
				type: QueryTypes.SELECT,
			}
		);

		return {
			patients: details,
			limit: limit,
			offset: offset,
			total_count: total_count[0].count,
		};
	}

	private async isPatientExists(userId: number) {
		return await PatientUser.findOne({
			where: {
				user_id: userId,
			},
		});
	}

	async getSetupProfile(patient_id: number, role_id: number) {
		Users.hasOne(PatientUser, { foreignKey: "user_id" });
		PatientUser.belongsTo(Users, { foreignKey: "user_id" });

		// Fetches personal information
		const basic_information: any = await PatientUser.findOne({
			where: {
				user_id: patient_id,
			},
			attributes: [
				"blood_group",
				"address_id",
				[fn("", col("first_name")), "first_name"],
				[fn("", col("last_name")), "last_name"],
				[fn("", col("email")), "email"],
				[fn("", col("gender")), "gender"],
				[fn("", col("birth_date")), "birth_date"],
				[fn("", col("profile_image")), "profile_image"],
				[fn("", col("profile_image_verify")), "profile_image_verify"],
				[fn("", col("email_verify")), "email_verify"],
				[fn("", col("phone_verify")), "phone_verify"],
			],
			include: [
				{
					model: Users,
					attributes: [],
				},
			],
			raw: true,
		});

		if (basic_information && basic_information.profile_image)
			basic_information.profile_image = await new FileService().getProfileImageLink(
				patient_id,
				role_id,
				basic_information.profile_image
			);

		const user_identity: any = await Identity.findOne({
			where: {
				user_id: patient_id,
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

		const emergency_contact: any = await UserEmergencyContact.findOne({
			where: {
				user_id: patient_id,
			},
			attributes: {
				exclude: ["id", "user_id"],
			},
		});

		let user_address: any;
		if (basic_information) {
			user_address = await Address.findOne({
				where: {
					id: basic_information.address_id,
				},
				attributes: {
					exclude: ["id"],
				},
			});

			const latitude = user_address.location.coordinates[0];
			const longitude = user_address.location.coordinates[1];

			user_address.location = {};
			user_address.location.latitude = latitude;
			user_address.location.longitude = longitude;
		}

		const address_information = {
			...user_address,
		};

		return { personal_information, address_information, emergency_contact };
	}
	async createAppointment(appointment_details: any, isOfflinePrescription: boolean = false, isReschedule: boolean = false) {
		const {
			doctor_id,
			patient_id,
			workplace_id,
			date,
			start_time,
			end_time,
			schedule_id,
			bookedby,
			video_call,
			audio_call,
			physical_examination,
			medical_history_shared = 0,
			is_offline = 0
		} = appointment_details;

		const patient_appointment: any = {
			doctor_id,
			patient_id,
			workplace_id,
			date,
			start_time,
			end_time,
			schedule_id,
			bookedby,
			video_call,
			audio_call,
			physical_examination,
			medical_history_shared,
			is_offline
		};

		const user: any = await DrPatientAppoiment.findOne({
			where: {
				doctor_id,
				workplace_id,
				date,
				start_time,
				end_time,
			},
		});

		if (user && !user.is_cancelled) {
			throw new UnauthorizedError("This slot is already booked");
		} else if (user && user.is_cancelled) {
			await DrPatientAppoiment.update(
				{ is_cancelled: 0, cancelled_reason: null },
				{
					where: {
						id: user.id,
					},
				}
			);
		} else {
			let booking: any = await DrPatientAppoiment.create(patient_appointment);
			if (!isOfflinePrescription) {

				let [patient, doctor, wrkplace] = await Promise.all([Users.findOne({
					where: {
						id: patient_id
					},
					attributes: [
						[
							fn("CONCAT", col("first_name"), " ", col("last_name")),
							"name",
						],
						"email",
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
						// "email",
						"contact_number"
					],

				}),
				dr_Workplaces.findOne({
					attributes: [
						"workplace_name",
					],
					where: {
						id: workplace_id,
					},
					raw: true,
				})
				]);
				let patientDetail: any = patient;
				let doctorDetail: any = doctor;
				let workplace: any = wrkplace;
				let patientDynamicData = { patientName: patientDetail.name, doctorName: doctorDetail.name }
				let doctorDynamicData = { patientName: patientDetail.name, workplace: workplace.workplace_name, date: date, time: start_time }
				let delegateList: any = await DrDelegate.findAll({
					where: { doctor_id: doctor_id, workplaces_id: workplace_id, active_workplace: true },
					raw: true,
				});
				let contactList: any = [];

				let delegateListPromise = await delegateList.map((singleDelegate: any) => {
					contactList.push(singleDelegate.contact_number);
				});

				await Promise.all(delegateListPromise)
				let delegateDynamicData = { patientName: patientDetail.name, doctorName: doctorDetail.name, workplace: workplace.workplace_name, date: date, time: start_time, bookingId: booking.id }
				await Promise.all([new Notifications().sendNotification("PATIENT_NEW_APPOINTMENT_REQUEST", patientDynamicData, { contact_number: [patientDetail.contact_number] }),
				new Notifications().sendNotification("DOCTOR_NEW_APPOINTMENT_REQUEST", doctorDynamicData, { contact_number: [doctorDetail.contact_number] }),
				new Notifications().sendNotification("DELEGATE_NEW_APPOINTMENT_REQUEST", delegateDynamicData, { contact_number: contactList })
				]);

				if (isReschedule) {
					return {
						id: booking.id,
						patient_id: booking.patient_id,
						doctor_id: booking.doctor_id,
						workplace_id: booking.workplace_id,
						date: booking.date,
						start_time: booking.start_time
					};
				}
			}

		}
	}

	//Get speciality name
	async getSpecialityName(specialityID: number) {
		let specialityName = await Speciality.findOne({
			attributes: ["name"],
			where: { id: specialityID },
		});
		return specialityName;
	}

	//A doctor can have mutiple Speciallities
	async getDoctorSpecialities(doctorID: number) {
		let specialities: any = await DrSpeciality.findAll({
			attributes: ["speciality_id"],
			where: { d_id: doctorID },
		});
		let specialitiesNames: string[] = [];
		for (let spec of specialities) {
			let speciality: any = await this.getSpecialityName(spec.speciality_id);
			if (speciality.name) {
				specialitiesNames.push(speciality.name);
			}
		}
		return specialitiesNames;
	}

	//List of all working Schedules for given date & day of week
	async docSchduleAvailabile(
		doctorID: number,
		workplaceID: number,
		dates: any[]
	) {
		let schedule: any[] = [];

		for (let dt of dates) {
			let slots: any[] = await DrSchedule.findAll({
				attributes: ["id", "start_time", "end_time"],
				where: {
					doctor_id: doctorID,
					workplaces_id: workplaceID,
					slot_available: 1,
					day: {
						[Op.eq]: dt.day.toLowerCase(),
					},
				},
				raw: true,
			});
			if (slots.length) schedule.push({ day: dt.day, slots: slots });
		}

		return schedule;
	}

	async filterDoctorByWorkplaceOrName(doctors: any[], matchstr: string) {
		return doctors.filter(
			(doctor) =>
				doctor.first_name.toLowerCase() === matchstr ||
				doctor.last_name.toLowerCase() === matchstr ||
				doctor.workplace_name.toLowerCase() === matchstr ||
				doctor.first_name.toLowerCase().includes(matchstr) ||
				doctor.last_name.toLowerCase().includes(matchstr) ||
				doctor.workplace_name.toLowerCase().includes(matchstr)
		);
	}

	async filterDoctorBySpecialites(doctors: any[], specialities: string[]) {
		let docsWithSpecialites: any[] = doctors.filter((doctor) => {
			let docSpecialities: string[] = doctor.specialities;
			return docSpecialities.some((item) => specialities.includes(item));
		});
		return docsWithSpecialites;
	}

	async filterDoctorByHealthConcerns(doctors: any[], healthConcerns: string[]) {
		let healthconcernFound: any = await HealthConcerns.findAll({
			attributes: ["id", "name"],
			where: {
				name: {
					[Op.in]: healthConcerns,
				},
			},
		});

		let healhconcernIdList = healthconcernFound.map((hCon: any) => {
			return hCon.id;
		});

		if (!healhconcernIdList) {
			throw new BadRequestError("Please add a valid health Concern");
		}

		//get list of all specialitist type that look for particular health concerns
		let specalities: any[] = await SpecalitiesHealthConcerns.findAll({
			attributes: ["speciality_id"],
			where: {
				health_concerns_id: {
					[Op.in]: healhconcernIdList,
				},
			},
		});

		let specalitiesNames: string[] = [];
		for (let i = 0; i < specalities.length; i++) {
			let nameObj: any = await this.getSpecialityName(
				specalities[i].speciality_id
			);
			if (specalitiesNames.indexOf(nameObj.name) === -1) {
				specalitiesNames.push(nameObj.name);
			}
		}

		let sortedDocList = await this.filterDoctorBySpecialites(
			doctors,
			specalitiesNames
		);
		return sortedDocList;
	}

	//Sort the Given Doctor List on basis of Sort Order Given
	async sortDoctorList(docArray: any[], sort_type: string, sortBy: string) {
		if (
			sort_type === "distance" ||
			sort_type === "availability" ||
			sort_type === "rating"
		) {
			return docArray;
		}

		//'consultation_fee', 'experience', 'distance', 'availability', 'rating'
		if (sort_type === "consultation_fee" && sortBy === "asc") {
			return docArray.sort((a, b) => a.consultation_fee - b.consultation_fee);
		}

		if (sort_type === "consultation_fee" && sortBy === "desc") {
			return docArray.sort((a, b) => b.consultation_fee - a.consultation_fee);
		}

		if (sort_type === "experience") {
			// always descending
			return docArray.sort((a, b) => b.experience - a.experience);
		}
	}

	//Get Nearest doctors
	async getNearByDoctors(locationInfo: any, user_id: number) {
		//get NearBy Location in address filed up to ceratain distance say 5 kilometers
		//now get all locations that are related to doctor workplaces
		//get list of all doctors working in that workplaces

		//If PatientID Given
		let isNotBookingForOwnCase: any = user_id ? {
			id: {
				[Op.ne]: user_id
			}
		} : null;
		//Gender Case
		let genderCase: any =
			locationInfo.filter_type &&
				locationInfo.filter_type === "gender" &&
				locationInfo.gender
				? { gender: locationInfo.gender.toLowerCase() }
				: null;
		// Medical Convention Case
		let conventionCase: any =
			locationInfo.filter_type &&
				locationInfo.filter_type === "medical_convention" &&
				locationInfo.medical_convention
				? { medical_convention: locationInfo.medical_convention.toLowerCase() }
				: null;

		let lat = parseFloat(locationInfo.latitude);
		let lng = parseFloat(locationInfo.longitude);

		let searchRadiusInMeters = locationInfo.searchRadius
			? parseFloat(locationInfo.searchRadius) * 1000
			: 0;
		if (locationInfo.video_call || locationInfo.audio_call) {
			searchRadiusInMeters = 0;
		}
		let videoConsultantCase: any = locationInfo.video_call
			? { video_call: locationInfo.video_call }
			: true;
		let audioConsultantCase: any = locationInfo.audio_call
			? { audio_call: locationInfo.audio_call }
			: true;

		let workplacesNearBy: any[] = await new AddressService().nearByAddresses(
			lat,
			lng,
			searchRadiusInMeters
		);
		let workplacesIds: any[] = workplacesNearBy.map((addrObj) => {
			return addrObj.address_id;
		});

		dr_Workplaces.hasOne(DrWorkplaceUsers, { foreignKey: "workplace_id" });
		DrWorkplaceUsers.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasMany(DrWorkplaceUsers, { foreignKey: "user_id" });
		DrWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		Users.hasOne(DrUsers, { foreignKey: "doctor_id" });
		DrUsers.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

		const workplace_information: any[] = await DrWorkplaceUsers.findAll({
			attributes: [
				["workplace_id", "workplace_id"],
				["user_id", "doctor_id"],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("time_per_appointment")), "time_per_appointment"],
				[fn("", col("consultation_fee")), "consultation_fee"],
				[fn("", col("workplace_contact_number")), "workplace_contact_number"],
				[fn("", col("address_id")), "address_id"],
				[fn("", col("first_name")), "first_name"],
				[fn("", col("last_name")), "last_name"],
				[fn("", col("gender")), "gender"],
				[fn("", col("profile_image")), "profile_image"],
				[fn("", col("experience")), "experience"],
				[fn("", col("medical_convention")), "medical_convention"],
				[fn("", col("video_call")), "video_call"],
				[fn("", col("audio_call")), "audio_call"],
				[fn("", col("physical_examination")), "physical_examination"],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
			],
			include: [
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: DrUsers,
							attributes: [],
							where: {
								...videoConsultantCase,
								...audioConsultantCase,
								...conventionCase,
							},
						},
						{
							model: UserRole,
							attributes: [],
							where: {
								role_id: RolesEnum.Doctor,
								isSetupComplete: 1,
								active_status: 1,
								status_code: {
									[Op.in]: [StatusCode.Verified, StatusCode.Unverified_edit],
								}, //only verfied doctors must be shown to patient
							},
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
					where: {
						...isNotBookingForOwnCase,
						// account_activation: 1,
						//isSetupComplete: 1,
						...genderCase,
					},
				},
				{
					model: dr_Workplaces,
					attributes: [],
					where: {
						address_id: {
							[Op.in]: workplacesIds,
						},
					},
				},
			],
			raw: true,
			group: ["workplace_id"],
		});

		let docArray: any[] = [];

		//Filter case for Available schedule
		let dates: any[] = [
			{ day: "Sunday" },
			{ day: "Monday" },
			{ day: "Tuesday" },
			{ day: "Wednesday" },
			{ day: "Thursday" },
			{ day: "Friday" },
			{ day: "Saturday" },
		];
		if (
			locationInfo.filter_type &&
			locationInfo.filter_type === "availability" &&
			locationInfo.dates
		) {
			dates = locationInfo.dates;
		}

		for (let i = 0; i < workplace_information.length; i++) {
			let drSchedule: any[] = await this.docSchduleAvailabile(
				workplace_information[i].doctor_id,
				workplace_information[i].workplace_id,
				dates
			);
			//If no related schdule found then entry will be skipped
			if (drSchedule.length > 0) {
				//added default rating here
				workplace_information[i].specialities = workplace_information[
					i
				].specialities.split(",");
				if (workplace_information[i].profile_image)
					workplace_information[
						i
					].profile_image = await new FileService().getProfileImageLink(
						workplace_information[i].doctor_id,
						RolesEnum.Doctor,
						workplace_information[i].profile_image
					);

				//get Average Rating for Doctor
				let docAvgRating = await this.getDoctorAverageRating(workplace_information[i].doctor_id);

				if (!user_id) {
					// For Guest User
					docArray.push({
						...workplace_information[i],
						scheduleExists: true,
						rating: docAvgRating.avgRating,
						total_reviews: docAvgRating.ratingCount,
						isVisited: null,
						isRated: null,
						lastVisited: null
					});
				}
				else {
					// For Normal Patient User
					//Have the following Patient ever Visited the doctor previously & not rated
					let visitedEntry: any = await DrPatientAppoiment.findOne({
						where: {
							doctor_id: workplace_information[i].doctor_id,
							workplace_id: workplace_information[i].workplace_id,
							patient_id: user_id,
							status: {
								[Op.like]: `%Completed%`,
							},
							is_cancelled: 0
						},
						raw: true,
						order: [["date", "DESC"], ["end_time", "DESC"]]
					});

					let isVisited = false;
					let isRated = false;
					let lastVisited = null;
					if (visitedEntry && visitedEntry.id) {
						isVisited = true;
						lastVisited = `${visitedEntry.date} ${visitedEntry.start_time}`;
						let ratingDone: any = await RatingReview.findOne({
							where: {
								doctor_id: visitedEntry.doctor_id,
								patient_id: visitedEntry.patient_id
							},
							raw: true,
						});
						if (ratingDone && ratingDone.id)
							isRated = true;
					}

					docArray.push({
						...workplace_information[i],
						scheduleExists: true,
						rating: docAvgRating,
						isVisited,
						isRated,
						lastVisited
					});
				}
			}
		}

		if (docArray.length === 0) {
			return {
				doctors: docArray,
				msg: ResponseMessageEnum.PATIENT_SEARCH_DOCTORS_FAILURE,
			};
		}

		//searchCase Applied here
		docArray = locationInfo.search
			? await this.filterDoctorByWorkplaceOrName(
				docArray,
				locationInfo.search.toLowerCase()
			)
			: docArray;

		//Apply All Sort Case Here
		docArray =
			locationInfo.sort_type && locationInfo.sort
				? await this.sortDoctorList(
					docArray,
					locationInfo.sort_type,
					locationInfo.sort
				)
				: docArray;

		//Apply Case For Specialities & HealthConcerns Filter
		if (locationInfo.specialities) {
			docArray = await this.filterDoctorBySpecialites(
				docArray,
				locationInfo.specialities
			);
		} else if (locationInfo.healthConcerns) {
			docArray = await this.filterDoctorByHealthConcerns(
				docArray,
				locationInfo.healthConcerns
			);
		}

		return {
			doctors: docArray.slice(locationInfo.offset, locationInfo.limit),
			limit: locationInfo.limit,
			offset: locationInfo.offset,
			total_count: docArray.length,
		};
	}

	async formatPrescibeTestData(prescriptions: any) {
		let specialities = prescriptions.specialities
			? prescriptions.specialities.split(",")
			: [];
		prescriptions.specialities = specialities;

		let tests = await PatientLabTest.findAll({
			attributes: [
				"test_id",
				"test_name",
				"details",
				"patient_home_collection",
			],
			where: {
				prescriptions_id: prescriptions.prescriptions_id,
			},
			raw: true,
		});

		// Previous orders available for Prescribed Test if any
		RequestLab.hasOne(PatientOrderLab, { foreignKey: "request_lab_id" });
		PatientOrderLab.belongsTo(RequestLab, { foreignKey: "request_lab_id" });
		let previousOrders = await PatientOrderLab.findOne({
			where: {
				prescription_id: prescriptions.prescriptions_id,
			},
			attributes: [
				["request_lab_id", "request_lab_id"],
				["createdAt", "createdAt"],
				["updatedAt", "updatedAt"],
			],
			include: [
				{
					model: RequestLab,
					attributes: [],
					where: {
						is_cancelled: 0,
					},
				},
			],
			raw: true,
			order: [["createdAt", "DESC"]],
		});
		prescriptions.is_ordered = previousOrders ? true : false;
		if (prescriptions.is_ordered)
			prescriptions.previous_order_details = previousOrders;

		prescriptions.tests = tests;
		return prescriptions;
	}

	async getAllPrescibedTests(patient_id: number, date: string) {
		//Get Patient Details for Order Summary
		let patientDetails: any = await Users.findOne({
			attributes: [
				["id", "patient_id"],
				[
					fn("CONCAT", col("first_name"), " ", col("last_name")),
					"patient_name",
				],
				"birth_date",
				"gender",
				"contact_number",
			],
			where: { id: patient_id },
			raw: true,
		});

		DrPatientAppoiment.hasOne(Prescriptions, { foreignKey: "booking_id" });
		Prescriptions.belongsTo(DrPatientAppoiment, { foreignKey: "booking_id" });
		Prescriptions.hasMany(PatientLabTest, { foreignKey: "prescriptions_id" });
		PatientLabTest.belongsTo(Prescriptions, { foreignKey: "prescriptions_id" });
		//To add relation for RequestLab Orders after confirmation

		dr_Workplaces.hasOne(DrPatientAppoiment, { foreignKey: "workplace_id" });
		DrPatientAppoiment.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasOne(DrPatientAppoiment, { foreignKey: "doctor_id" });
		DrPatientAppoiment.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

		let dateCase: any = date ? { date: date } : true;
		let prescribedTests: any[] = [];
		prescribedTests = await DrPatientAppoiment.findAll({
			attributes: [
				["id", "booking_id"],
				["workplace_id", "workplace_id"],
				["doctor_id", "doctor_id"],
				["date", "date"],
				["start_time", "start_time"],
				["end_time", "end_time"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "doctor_name"],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("prescriptions_id")), "prescriptions_id"],
				[fn("", col("is_expired")), "is_expired"],
				[
					fn("", col("is_repeatable_prescriptions")),
					"is_repeatable_prescriptions",
				],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
				//For test details
				/*[fn("GROUP_CONCAT", fn("DISTINCT",
				fn("JSON_OBJECT", 
					"test_id", col('test_id'), // Key - Value pair
					  "test_name", col('test_name'), 
					  "details", col('details'),
					  "patient_home_collection", col('patient_home_collection'))
				 )), "tests"],*/
			],
			where: {
				patient_id: patient_id,
				status: {
					[Op.like]: `%Completed%`,
				},
				...dateCase,
			},
			include: [
				{
					model: dr_Workplaces,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
					include: [
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
				},
				{
					model: Prescriptions,
					attributes: [],
					include: [
						{
							model: PatientLabTest,
							attributes: [],
							required: true,
						},
					],
				},
			],
			raw: true,
			group: ["prescriptions_id"],
			order: [["date", "DESC"], ["start_time", "DESC"]]
		});

		if (prescribedTests.length > 0) {
			let promises: any[] = [];
			for (let prescription of prescribedTests) {
				promises.push(this.formatPrescibeTestData(prescription));
			}
			let prescriptions = await Promise.all(promises);

			/*prescribedTests = prescribedTests.map( (obj) => {
				//for specialities array
				obj.specialities = obj.specialities.split(',');
			
				//for prescribed tests array 
				let test = obj.tests;
				test = test.replace(/\\/g, ""); // for backlash issue
				obj.tests = JSON.parse(`[${test}]`);
				
				return obj;
			});*/

			return { patientDetails, prescribedTests: prescriptions };
		}

		return { msg: "No Prescribed Test found" };
	}

	async getAllPatientUpComingAppointments(patient_id: number, date: string) {

		dr_Workplaces.hasOne(DrPatientAppoiment, { foreignKey: "workplace_id" });
		DrPatientAppoiment.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasOne(DrPatientAppoiment, { foreignKey: "doctor_id" });
		DrPatientAppoiment.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrUsers, { foreignKey: "doctor_id" });
		DrUsers.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

		let dateCase: any = date ? { date: date } : true;
		let upcomingAppointments: any[] = [];

		upcomingAppointments = await DrPatientAppoiment.findAll({
			attributes: [
				["id", "booking_id"],
				["workplace_id", "workplace_id"],
				["doctor_id", "doctor_id"],
				["date", "date"],
				["start_time", "start_time"],
				["end_time", "end_time"],
				["video_call", "video_call"],
				["audio_call", "audio_call"],
				["physical_examination", "physical_examination"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "doctor_name"],
				[fn("", col("profile_image")), "doctor_profile_image"],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("experience")), "experience"],
				[fn("", col("consultation_fee")), "consultation_fee"],
				[fn("", col("medical_convention")), "medical_convention"],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
				["patient_id", "patient_id"],
			],
			where: {
				bookedby: patient_id,
				is_cancelled: 0,
				status: {
					[Op.like]: `%Accepted%`,
				},
				...dateCase,
			},
			include: [
				{
					model: dr_Workplaces,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
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
									attributes: [],
								},
							],
						},
					],
				},
			],
			raw: true,
			order: [["date", "DESC"], ["start_time", "DESC"]],
			group: ["dr_patient_appoiment.id"]
		});

		if (upcomingAppointments.length > 0) {
			let addprofileImagePromises: any[] = [];
			for (let appointment of upcomingAppointments) {
				addprofileImagePromises.push(this.addProfileImageForDocOnAppoinments(appointment, patient_id))
			}

			upcomingAppointments = await Promise.all([...addprofileImagePromises]);

		}

		return { upcomingAppointments };
	}

	async addProfileImageForDocOnAppoinments(appointment: any, user: number) {
		appointment.specialities = appointment.specialities ? appointment.specialities.split(",") : [];
		if (appointment.doctor_profile_image)
			appointment.doctor_profile_image = await new FileService().getProfileImageLink(
				appointment.doctor_id,
				RolesEnum.Doctor,
				appointment.doctor_profile_image
			);

		if (appointment.patient_id) {
			let patientDetails: any = await Users.findOne({
				attributes: [
					[fn("CONCAT", col("first_name"), " ", col("last_name")), "patient_name"]
				],
				where: {
					id: appointment.patient_id
				},
				raw: true,
			});
			appointment.patient_name = !!patientDetails?.patient_name ? patientDetails?.patient_name : '';
		}

		//get Average Rating for Doctor
		let docAvgRating: any = await this.getDoctorAverageRating(appointment.doctor_id);
		let isRated = false;

		let ratingDone: any = await RatingReview.findOne({
			where: {
				doctor_id: appointment.doctor_id,
				patient_id: user
			},
			raw: true,
		});
		if (ratingDone && ratingDone.id)
			isRated = true;

		appointment.rating = docAvgRating.avgRating;
		appointment.total_reviews = docAvgRating.ratingCount;
		appointment.isVisited = true;
		appointment.isRated = isRated;

		return appointment;
	}

	async formatPrescibeMedicineData(prescriptions: any) {
		let specialities = prescriptions.specialities
			? prescriptions.specialities.split(",")
			: [];
		prescriptions.specialities = specialities;

		Drug.hasOne(RxImmunisation, { foreignKey: "medicine_id" });
		RxImmunisation.belongsTo(Drug, { foreignKey: "medicine_id" });

		let medicines = await RxImmunisation.findAll({
			attributes: [
				"medicine_id",
				"medicine_name",
				"strength",
				"duration",
				"frequency",
				"instructions",
				"immunisation",
				"method_of_use",
				"is_repeatable_medicine",
				"repeat_after",
				"repeat_after_type",
				[fn("", col("drug_unit")), "drug_unit"],
				[fn("", col("packaging")), "packaging"],
				// [fn("", col("mrp")), "mrp"],
			],
			where: {
				prescriptions_id: prescriptions.prescriptions_id,
			},
			include: [
				{
					model: Drug,
					attributes: [],
				},
			],
			raw: true,
		});

		prescriptions.medicines = medicines;

		RequestPharmacy.hasOne(PatientOrderPharmacy, {
			foreignKey: "request_pharmacy_id",
		});
		PatientOrderPharmacy.belongsTo(RequestPharmacy, {
			foreignKey: "request_pharmacy_id",
		});
		let previousOrders = await PatientOrderPharmacy.findOne({
			where: {
				prescription_id: prescriptions.prescriptions_id,
			},
			attributes: [
				["request_pharmacy_id", "request_pharmacy_id"],
				["order_id", "order_id"],
				["createdAt", "createdAt"],
				["updatedAt", "updatedAt"],
			],
			include: [
				{
					model: RequestPharmacy,
					attributes: [],
					where: {
						is_cancelled: 0,
					},
				},
			],
			raw: true,
			order: [["createdAt", "DESC"]],
		});
		prescriptions.is_ordered = previousOrders ? true : false;
		if (prescriptions.is_ordered)
			prescriptions.previous_order_details = previousOrders;

		return prescriptions;
	}

	async getAllPrescibedMedicines(patient_id: number, date: string) {
		//Get Patient Details for Order Summary
		let patientDetails: any = await Users.findOne({
			attributes: [
				["id", "patient_id"],
				[
					fn("CONCAT", col("first_name"), " ", col("last_name")),
					"patient_name",
				],
				"birth_date",
				"gender",
				"contact_number",
			],
			where: { id: patient_id },
			raw: true,
		});

		DrPatientAppoiment.hasOne(Prescriptions, { foreignKey: "booking_id" });
		Prescriptions.belongsTo(DrPatientAppoiment, { foreignKey: "booking_id" });
		Prescriptions.hasMany(RxImmunisation, { foreignKey: "prescriptions_id" });
		RxImmunisation.belongsTo(Prescriptions, { foreignKey: "prescriptions_id" });

		//To add relation for RequestPharmacy Orders after confirmation

		dr_Workplaces.hasOne(DrPatientAppoiment, { foreignKey: "workplace_id" });
		DrPatientAppoiment.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasOne(DrPatientAppoiment, { foreignKey: "doctor_id" });
		DrPatientAppoiment.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

		let dateCase: any = date ? { date: date } : true;
		let prescribedMedicines: any[] = [];

		prescribedMedicines = await DrPatientAppoiment.findAll({
			attributes: [
				["id", "booking_id"],
				["workplace_id", "workplace_id"],
				["doctor_id", "doctor_id"],
				["date", "date"],
				["start_time", "start_time"],
				["end_time", "end_time"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "doctor_name"],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("prescriptions_id")), "prescriptions_id"],
				[fn("", col("is_expired")), "is_expired"],
				[
					fn("", col("is_repeatable_prescriptions")),
					"is_repeatable_prescriptions",
				],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
				//For medicine details
				/*[fn("GROUP_CONCAT", fn("DISTINCT",
				fn("JSON_OBJECT", 
					"medicine_id", col('medicine_id'), // Key - Value pair
					  "medicine_name", col('medicine_name'), 
					  "strength", col('strength'),
					 "duration", col('duration'),
					 "frequency", col('frequency'),
					 "instructions", col('instructions'),
					 "method_of_use", col('method_of_use'),
					 // Only those medicine can be repeated who value if set to 1
					 "is_repeatable_medicine", col('is_repeatable_medicine'), 
					 "repeat_after", col('repeat_after'),
					 "repeat_after_type", col('repeat_after_type')
					 )
				 )), "medicines"],*/
			],
			where: {
				patient_id: patient_id,
				status: {
					[Op.like]: `%Completed%`,
				},
				...dateCase,
			},
			include: [
				{
					model: dr_Workplaces,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
					include: [
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
				},
				{
					model: Prescriptions,
					attributes: [],
					include: [
						{
							model: RxImmunisation,
							attributes: [],
							required: true,
						},
					],
				},
			],
			raw: true,
			group: ["prescriptions_id"],
			order: [["date", "DESC"], ["start_time", "DESC"]]
		});

		if (prescribedMedicines.length > 0) {
			let promises: any[] = [];
			for (let prescription of prescribedMedicines) {
				promises.push(this.formatPrescibeMedicineData(prescription));
			}
			let prescriptions = await Promise.all(promises);
			/*prescribedMedicines = prescribedMedicines.map((obj) => {
				//for specialities array
				obj.specialities = obj.specialities.split(',');
			
				//for prescribed medicines array
				let medicine = obj.medicines;
				medicine = medicine.replace(/\\/g, ""); // for backlash issue
				obj.medicines = JSON.parse(`[${medicine}]`);
				
				return obj;
			});*/

			return { patientDetails, prescribedMedicines: prescriptions };
		}

		return { msg: "No Prescribed Medicine found" };
	}

	async nearbyLabEmployees(nearByWorkplaces: any[], isAdmin: boolean = true) {
		// Fetch All related device_id for related workplaces & send it to patient for notification purpose
		let workplaceIDs: number[] = nearByWorkplaces.map((obj: any) => {
			return obj.id;
		});

		LabWorkplaces.hasOne(LabWorkplaceUsers, { foreignKey: "workplace_id" });
		LabWorkplaceUsers.belongsTo(LabWorkplaces, { foreignKey: "workplace_id" });
		Users.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
		LabWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		Users.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });

		let allAvailableUsers: any[] = await LabWorkplaceUsers.findAll({
			attributes: [
				["user_id", "user_id"],
				["workplace_id", "workplace_id"],
				[fn("", col("deviceToken")), "deviceToken"],
				[fn("", col("deviceType")), "deviceType"],
				[fn("", col("contact_number")), "contact_number"],
			],
			where: {
				workplace_id: { [Op.in]: workplaceIDs },
			},
			include: [
				{
					model: LabWorkplaces,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: UserRole,
							attributes: [],
							where: {
								role_id: RolesEnum.Laboratory,
								active_status: 1,
								isWorkplaceAdmin: isAdmin ? 1 : 0,
								//status_code: {
								//	[Op.in]: [StatusCode.Verified, StatusCode.Unverified_edit]
								//}, //only verfied lab employee must be shown to patient
							},
						},
					],
				},
			],
			raw: true,
			group: ["workplace_id"],
		});

		return allAvailableUsers;
	}

	async addLabOrderRequest(requestedTests: any) {

		let result = await Utils.setTransaction(async () => {
			try {
				let [nearByWorkplaces] = await Promise.all([
					// Fetch All nearby workplaces
					this.getNearByLaboratories(
						requestedTests.latitude,
						requestedTests.longitude,
						requestedTests.searchRadius
					),
				]);

				if (nearByWorkplaces.length === 0)
					throw new BadRequestError(ResponseMessageEnum.NO_NEARBY_LAB);

				// Fetch All device info regarding FCM for nearby lab employee's
				let [nearByLabUsers, nearByLabEmpUsers] = await Promise.all([this.nearbyLabEmployees(
					nearByWorkplaces
				),
				this.nearbyLabEmployees(
					nearByWorkplaces, false
				)]);

				let reqOrderPromises = [];
				//Generate Order Id
				let order_id = v4();

				let notificationAdminContact: any = [];
				let notificationEmpContact: any = [];
				await nearByLabEmpUsers.map((singleEmp: any) => {
					notificationEmpContact.push(singleEmp.contact_number)
				})

				for (
					let nearByIndex = 0;
					nearByIndex < nearByLabUsers.length;
					nearByIndex++
				) {
					notificationAdminContact.push(nearByLabUsers[nearByIndex].contact_number);
					let {
						patient_id,
						order_type,
						order_status,
						prescription_type,
						custom_order = 0
					} = requestedTests.requestLab;

					let temporaryrequest: any = await this.createTemporaryLabRequest({
						order_id: order_id,
						patient_id,
						order_type: order_type.toLowerCase(),
						order_status: order_status.toLowerCase(),
						lab_id: nearByLabUsers[nearByIndex].user_id,
						order_status_code: 8
					});
					let patientOrderPromise = [];
					for (
						let requestIndex = 0;
						requestIndex < requestedTests.prescriptions.length;
						requestIndex++
					) {
						let temporaryPatientOrder: any = {
							order_id: order_id,
							patient_id: requestedTests.requestLab.patient_id,
							booking_id:
								prescription_type.toLowerCase() == "electronic"
									? requestedTests.prescriptions[requestIndex].booking_id
									: null,
							prescription_id:
								prescription_type.toLowerCase() == "electronic"
									? requestedTests.prescriptions[requestIndex].prescriptions_id
									: null,
							temporary_request_lab_id: temporaryrequest.id,
							lab_id: nearByLabUsers[nearByIndex].user_id,
							doctor_id:
								prescription_type.toLowerCase() == "electronic"
									? requestedTests.prescriptions[requestIndex].doctor_id
									: null,
							is_repeatable_prescriptions:
								requestedTests.prescriptions[requestIndex]
									.is_repeatable_prescriptions,
							prescription_type: prescription_type.toLowerCase(),
							custom_order: custom_order,
							scanned_doc_id: requestedTests.prescriptions[requestIndex]
								.scanned_doc_id
						};
						patientOrderPromise.push(
							this.createTemporaryLabOrder(temporaryPatientOrder)
						);
					}

					let createTemporaryOrder: any = await Promise.all(
						patientOrderPromise
					);

					if (prescription_type.toLowerCase() === "electronic") {
						for (const [requestIndex] of createTemporaryOrder.entries()) {
							let testData = requestedTests.prescriptions[requestIndex].tests;
							for (
								let testIndex = 0;
								testIndex < testData.length;
								testIndex++
							) {
								let lab_test: any = await LabTest.findOne({
									where: {
										tests_id: testData[testIndex].test_id,
										lab_id: nearByLabUsers[nearByIndex].workplace_id,
									},
									raw: true,
								});

								let tests: any = {
									order_id: order_id,
									lab_test_id: testData[testIndex].test_id,
									test_name: testData[testIndex].test_name,
									details: testData[testIndex].details,
									booking_id:
										requestedTests.prescriptions[requestIndex].booking_id,
									prescriptions_id:
										requestedTests.prescriptions[requestIndex].prescriptions_id,
									doctor_id:
										requestedTests.prescriptions[requestIndex].doctor_id,
									is_home_collection: lab_test
										? lab_test.home_collection
										: testData[testIndex].patient_home_collection,
									home_collection_charges: lab_test
										? lab_test.home_collection_charges
										: 0,
									mrp: lab_test ? lab_test.cost : 0,
									is_lab_selected: lab_test ? 1 : 0,
									temporary_patient_order_lab_id:
										createTemporaryOrder[requestIndex].dataValues.id,
								};
								reqOrderPromises.push(
									TemporaryLabTests.create(tests, {
										returning: true,
									})
								);
							}
						}
						await Promise.all(reqOrderPromises);
					}
				}

				// send BroadCast Request Notification to all nearby Laboratory

				let patientDetail: any = await Users.findOne({
					where: {
						id: requestedTests.requestLab.patient_id
					},
					attributes: [
						[
							fn("CONCAT", col("first_name"), " ", col("last_name")),
							"name",
						],
					],
				});
				let dynamicData = { patientName: patientDetail.name };
				await Promise.all([new Notifications().sendNotification("LAB_ADMIN_TEST_ORDER_RECEIVED", dynamicData, { contact_number: notificationAdminContact }),
				new Notifications().sendNotification("LAB_EMPLOYEE_TEST_ORDER_RECEIVED", dynamicData, { contact_number: notificationEmpContact })
				]);

				return nearByLabUsers;
			} catch (error) {
				throw new BadRequestError(error.message);
			}
		});

		return result;
	}

	// Gives List of all Available workplaces in DB for particular radius if given sorted by distance
	async getNearByWorkplaces(
		latitude: number,
		longitude: number,
		searchRadius?: string
	) {
		let searchRadiusInMeters = searchRadius
			? parseFloat(searchRadius) * 1000
			: 0;
		let workplacesNearBy: any[] = await new AddressService().nearByAddresses(
			latitude,
			longitude,
			searchRadiusInMeters
		);

		let addressIDs: any[] = workplacesNearBy.map((addrObj) => {
			return addrObj.address_id;
		});

		return addressIDs;
	}

	async getNearByLaboratories(
		latitude: number,
		longitude: number,
		searchRadius?: string
	) {
		let addressIDs = await this.getNearByWorkplaces(
			latitude,
			longitude,
			searchRadius
		);
		return LabWorkplaces.findAll({
			where: { address_id: { [Op.in]: addressIDs } },
			raw: true,
		});
	}

	async getNearByPharmacies(
		latitude: number,
		longitude: number,
		searchRadius?: string
	) {
		let addressIDs = await this.getNearByWorkplaces(
			latitude,
			longitude,
			searchRadius
		);
		return PharmacyWorkplaces.findAll({
			where: { address_id: { [Op.in]: addressIDs } },
			raw: true,
		});
	}

	async nearbyPharmaEmployees(nearByWorkplaces: any[], isAdmin: boolean = true) {
		// Fetch All related device_id for related workplaces & send it to patient for notification purpose
		let workplaceIDs: number[] = nearByWorkplaces.map((obj: any) => {
			return obj.id;
		});

		PharmacyWorkplaces.hasOne(PharmacyWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		PharmacyWorkplaceUsers.belongsTo(PharmacyWorkplaces, {
			foreignKey: "workplace_id",
		});
		Users.hasOne(PharmacyWorkplaceUsers, { foreignKey: "user_id" });
		PharmacyWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		Users.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });

		let allAvailableUsers: any[] = await PharmacyWorkplaceUsers.findAll({
			attributes: [
				["user_id", "user_id"],
				["workplace_id", "workplace_id"],
				[fn("", col("deviceToken")), "deviceToken"],
				[fn("", col("deviceType")), "deviceType"],
			],
			where: {
				workplace_id: { [Op.in]: workplaceIDs },
			},
			include: [
				{
					model: PharmacyWorkplaces,
					attributes: [],
				},
				{
					model: Users,
					where: {
						default_role: RolesEnum.Pharmacy,
					},
					attributes: [],
					include: [
						{
							model: UserRole,
							attributes: [],
							where: {
								role_id: RolesEnum.Pharmacy,
								active_status: 1,
								isWorkplaceAdmin: isAdmin ? 1 : 0,
								//status_code: {
								//	[Op.in]: [StatusCode.Verified, StatusCode.Unverified_edit]
								//}, //only verfied lab employee must be shown to patient
							},
						},
					],
				},
			],
			raw: true,
			group: ["workplace_id"],
		});

		return allAvailableUsers;
	}

	async addPharmacyOrderRequest(requestedTests: any) {

		let result = await Utils.setTransaction(async () => {
			try {
				let [nearByWorkplaces] = (await Promise.all([
					// Fetch All nearby workplaces
					this.getNearByPharmacies(
						requestedTests.latitude,
						requestedTests.longitude,
						requestedTests.searchRadius
					),
				])) as any;

				if (nearByWorkplaces.length === 0)
					throw new BadRequestError(ResponseMessageEnum.NO_NEARBY_PHARMACY);

				// Fetch All device info regarding FCM for nearby Pharma employee's
				let [nearByPharmaUsers, nearByPharmaEmpUsers] = await Promise.all([this.nearbyPharmaEmployees(
					nearByWorkplaces
				),
				this.nearbyPharmaEmployees(
					nearByWorkplaces, false
				)]);

				let notificationAdminContact: any = [];
				let notificationEmpContact: any = [];
				await nearByPharmaEmpUsers.map((singleEmp: any) => {
					notificationEmpContact.push(singleEmp.contact_number)
				})
				//console.log(temporaryrequest.id, "temporaryrequest");
				let reqOrderPromises = [];
				//Generate Order Id
				let order_id = v4();
				for (
					let nearByIndex = 0;
					nearByIndex < nearByPharmaUsers.length;
					nearByIndex++
				) {
					notificationAdminContact.push(nearByPharmaUsers[nearByIndex].contact_number);
					let {
						patient_id,
						prescription_type,
						order_type,
						order_status,
					} = requestedTests.requestPharmacy;

					let temporaryrequest: any = await this.createTemporaryRequest({
						order_id: order_id,
						patient_id,
						prescription_type: prescription_type.toLowerCase(),
						order_type: order_type.toLowerCase(),
						order_status: order_status.toLowerCase(),
						pharmacy_id: nearByPharmaUsers[nearByIndex].user_id,
						order_status_code: 5
					});
					let patientOrderPromise = [];
					for (
						let requestIndex = 0;
						requestIndex < requestedTests.prescriptions.length;
						requestIndex++
					) {
						let temporaryPatientOrder;
						if (
							requestedTests.requestPharmacy.prescription_type.toLowerCase() ===
							"scanned"
						) {
							temporaryPatientOrder = {
								order_id: order_id,
								scanned_doc_id:
									requestedTests.prescriptions[requestIndex].scanned_doc_id,
								patient_id: requestedTests.requestPharmacy.patient_id,
								temporary_request_pharmacy_id: temporaryrequest.id,
								pharmacy_id: nearByPharmaUsers[nearByIndex].user_id,
								prescription_type: prescription_type.toLowerCase(),
								order_type: requestedTests.requestPharmacy.order_type.toLowerCase(),
								order_status: requestedTests.requestPharmacy.order_status.toLowerCase(),
								//medicines: requestedTests.prescriptions[requestIndex].medicines,
							};
						} else {
							temporaryPatientOrder = {
								order_id: order_id,
								patient_id: requestedTests.requestPharmacy.patient_id,
								booking_id:
									requestedTests.prescriptions[requestIndex].booking_id,
								prescription_id:
									requestedTests.prescriptions[requestIndex].prescriptions_id,
								temporary_request_pharmacy_id: temporaryrequest.id,
								pharmacy_id: nearByPharmaUsers[nearByIndex].user_id,
								doctor_id: requestedTests.prescriptions[requestIndex].doctor_id,
								is_repeatable_prescriptions:
									requestedTests.prescriptions[requestIndex]
										.is_repeatable_prescriptions,
								prescription_type: prescription_type.toLowerCase(),
								order_type: requestedTests.requestPharmacy.order_type.toLowerCase(),
								order_status: requestedTests.requestPharmacy.order_status.toLowerCase(),
								//medicines: requestedTests.prescriptions[requestIndex].medicines,
							};
						}
						patientOrderPromise.push(
							this.createTemporaryOrder(temporaryPatientOrder)
						);
					}

					let createTemporaryOrder: any = await Promise.all(
						patientOrderPromise
					);

					// For electronic prescription
					if (
						requestedTests.requestPharmacy.prescription_type.toLowerCase() !==
						"scanned"
					) {
						for (const [
							requestIndex,
							//medicinInfo,
						] of createTemporaryOrder.entries()) {
							let medicinesData =
								requestedTests.prescriptions[requestIndex].medicines;
							for (
								let medicineIndex = 0;
								medicineIndex < medicinesData.length;
								medicineIndex++
							) {
								// let pharmacy_medicine: any = await Drug.findOne({
								// 	where: {
								// 		drug_name: {
								// 			[Op.like]: `%${medicinesData[medicineIndex].medicine_name}%`,
								// 		},
								// 		pharmacy_id: nearByPharmaUsers[nearByIndex].workplace_id,
								// 	},
								// 	raw: true,
								// });

								let pharmacy_medicine: any = await sequelize.query(`SELECT pharmacy_drug.id as pharmacy_drug_id, pharmacy_drug.cost as mrp, drug_id, pharmacy_id, drug_name,drug.drug_manufacturer,drug_unit,packaging,drug_salt,strength, drug_route,habit_forming,schedule_h,administration_rules,immunisation, parent_id FROM pharmacy_drug AS pharmacy_drug LEFT OUTER JOIN drug AS drug ON pharmacy_drug.drug_id = drug.id  WHERE pharmacy_drug.pharmacy_id = ${nearByPharmaUsers[nearByIndex].workplace_id} AND (drug_id = ${medicinesData[medicineIndex].medicine_id} OR parent_id = ${medicinesData[medicineIndex].medicine_id}) AND drug_status = 1;`, {
									type: QueryTypes.SELECT,
								});

								if (pharmacy_medicine.length > 0) {
									pharmacy_medicine = pharmacy_medicine[0]
								}
								else {
									pharmacy_medicine = null
								}
								let medicines: any = {
									order_id: order_id,
									medicine_id: pharmacy_medicine?.pharmacy_drug_id
										? pharmacy_medicine.pharmacy_drug_id
										: medicinesData[medicineIndex].medicine_id,
									medicine_name: pharmacy_medicine?.drug_name
										? pharmacy_medicine.drug_name
										: medicinesData[medicineIndex].medicine_name,
									strength: pharmacy_medicine?.strength
										? pharmacy_medicine.strength
										: medicinesData[medicineIndex].strength,
									duration: medicinesData[medicineIndex].duration,
									frequency: medicinesData[medicineIndex].frequency,
									instructions: pharmacy_medicine?.immunisation
										? pharmacy_medicine.administration_rules
										: medicinesData[medicineIndex].instructions,
									immunisation: pharmacy_medicine?.immunisation
										? pharmacy_medicine.immunisation
										: medicinesData[medicineIndex].immunisation,
									method_of_use: pharmacy_medicine?.drug_route
										? pharmacy_medicine.drug_route
										: medicinesData[medicineIndex].method_of_use,
									booking_id:
										requestedTests.prescriptions[requestIndex].booking_id,
									is_repeatable_medicine:
										medicinesData[medicineIndex].is_repeatable_medicine,
									repeat_after: medicinesData[medicineIndex].repeat_after,
									repeat_after_type:
										medicinesData[medicineIndex].repeat_after_type,
									doctor_id:
										requestedTests.prescriptions[requestIndex].doctor_id,
									//temporary_patient_order_pharmacy_id: createTemporaryOrder.id,
									temporary_patient_order_pharmacy_id:
										createTemporaryOrder[requestIndex].dataValues.id,
									prescriptions_id:
										requestedTests.prescriptions[requestIndex].prescriptions_id,
									accepted_risk: medicinesData[medicineIndex].accepted_risk,
									drug_unit: pharmacy_medicine?.drug_unit
										? pharmacy_medicine.drug_unit
										: "",
									packaging: pharmacy_medicine?.packaging
										? pharmacy_medicine.packaging
										: "",
									mrp: pharmacy_medicine?.mrp ? pharmacy_medicine.mrp : 0,
									is_pharmacy_selected: pharmacy_medicine ? 1 : 0,
								};
								reqOrderPromises.push(
									TemporaryRxImmunisation.create(medicines, {
										returning: true,
									})
								);

							}
							await Promise.all(reqOrderPromises);
						}
					}
				}

				// send BroadCast Request Notification to all nearby Pharmacies
				let patientDetail: any = await Users.findOne({
					where: {
						id: requestedTests.requestPharmacy.patient_id
					},
					attributes: [
						[
							fn("CONCAT", col("first_name"), " ", col("last_name")),
							"name",
						],
					],
				});
				let dynamicData = { patientName: patientDetail.name };
				await Promise.all([new Notifications().sendNotification("PHARM_ADMIN_NEW_ORDER_REQUEST", dynamicData, { contact_number: notificationAdminContact }),
				new Notifications().sendNotification("PHARM_EMPLOYEE_NEW_ORDER_REQUEST", dynamicData, { contact_number: notificationEmpContact })
				]);
				return nearByPharmaUsers;
			} catch (error) {
				throw new BadRequestError(error.message);
			}
		});

		return result;
	}

	async createTemporaryRequest(request: any) {
		return TemporaryRequestPharmacy.create(request);
	}

	async createTemporaryOrder(order: any) {
		return TemporaryPatientOrderPharmacy.create(order, { raw: true });
	}

	async addPharmacyWiseOrderRequest(requestedMedicines: any) {
		let result = await Utils.setTransaction(async () => {
			try {
				// Is the default role for Pharamcy Available for that user
				let userRole: any = await Users.findOne({
					attributes: ["default_role"],
					where: { id: requestedMedicines.previous_order_details.user_id },
					raw: true,
				});

				if (!userRole || userRole.default_role !== RolesEnum.Pharmacy)
					throw new BadRequestError(
						"There is no such user with default role of Pharmacy so order request will not be sent"
					);

				// Fetch All device info regarding FCM for nearby Pharma employee's
				let nearByPharmaUsers: any[] = [];
				nearByPharmaUsers.push(requestedMedicines.previous_order_details);

				//console.log(temporaryrequest.id, "temporaryrequest");
				let reOrderReqPromises = [];
				//Generate Order Id
				let order_id = v4();
				for (
					let nearByIndex = 0;
					nearByIndex < nearByPharmaUsers.length;
					nearByIndex++
				) {
					let {
						patient_id,
						prescription_type,
						order_type,
						order_status,
					} = requestedMedicines.requestPharmacy;

					let temporaryrequest: any = await this.createTemporaryRequest({
						order_id: order_id,
						patient_id,
						prescription_type: prescription_type.toLowerCase(),
						order_type: order_type.toLowerCase(),
						order_status: order_status.toLowerCase(),
						pharmacy_id: nearByPharmaUsers[nearByIndex].user_id,
					});

					let patientOrderPromise = [];
					for (
						let requestIndex = 0;
						requestIndex < requestedMedicines.prescriptions.length;
						requestIndex++
					) {
						let temporaryPatientOrder: any = {
							order_id: order_id,
							patient_id: requestedMedicines.requestPharmacy.patient_id,
							booking_id:
								prescription_type.toLowerCase() == "electronic"
									? requestedMedicines.prescriptions[requestIndex].booking_id
									: null,
							prescription_id:
								prescription_type.toLowerCase() == "electronic"
									? requestedMedicines.prescriptions[requestIndex]
										.prescriptions_id
									: null,
							temporary_request_pharmacy_id: temporaryrequest.id,
							pharmacy_id: nearByPharmaUsers[nearByIndex].user_id,
							doctor_id:
								requestedMedicines.prescriptions[requestIndex].doctor_id,
							is_repeatable_prescriptions:
								requestedMedicines.prescriptions[requestIndex]
									.is_repeatable_prescriptions,
							scanned_doc_id:
								requestedMedicines.prescriptions[requestIndex].scanned_doc_id,
							prescription_type: prescription_type.toLowerCase(),
							//medicines: requestedMedicines.prescriptions[requestIndex].medicines,
						};
						patientOrderPromise.push(
							this.createTemporaryOrder(temporaryPatientOrder)
						);
					}

					let createTemporaryOrder: any = await Promise.all(
						patientOrderPromise
					);

					if (prescription_type.toLowerCase() == "electronic") {
						for (const [
							requestIndex,
							//medicinInfo,
						] of createTemporaryOrder.entries()) {
							let medicinesData =
								requestedMedicines.prescriptions[requestIndex].medicines;
							for (
								let medicineIndex = 0;
								medicineIndex < medicinesData.length;
								medicineIndex++
							) {
								let medicines: any = {
									order_id: order_id,
									medicine_id: medicinesData[medicineIndex].medicine_id,
									medicine_name: medicinesData[medicineIndex].medicine_name,
									strength: medicinesData[medicineIndex].strength,
									duration: medicinesData[medicineIndex].duration,
									frequency: medicinesData[medicineIndex].frequency,
									instructions: medicinesData[medicineIndex].instructions,
									immunisation: medicinesData[medicineIndex].immunisation,
									method_of_use: medicinesData[medicineIndex].method_of_use,
									booking_id:
										requestedMedicines.prescriptions[requestIndex].booking_id,
									is_repeatable_medicine:
										medicinesData[medicineIndex].is_repeatable_medicine,
									repeat_after: medicinesData[medicineIndex].repeat_after,
									repeat_after_type:
										medicinesData[medicineIndex].repeat_after_type,
									doctor_id:
										requestedMedicines.prescriptions[requestIndex].doctor_id,
									//temporary_patient_order_pharmacy_id: createTemporaryOrder.id,
									temporary_patient_order_pharmacy_id:
										createTemporaryOrder[requestIndex].dataValues.id,
									prescriptions_id:
										requestedMedicines.prescriptions[requestIndex]
											.prescriptions_id,
									accepted_risk: medicinesData[medicineIndex].accepted_risk,
									drug_unit: medicinesData[medicineIndex].drug_unit,
									packaging: medicinesData[medicineIndex].packaging,
									mrp: medicinesData[medicineIndex].mrp,
								};
								reOrderReqPromises.push(
									TemporaryRxImmunisation.create(medicines, {
										returning: true,
									})
								);
							}
							await Promise.all(reOrderReqPromises);
						}
					}
				}

				return { msg: "ReOrder Request Sent SuccessFully to the Pharmacy" };
			} catch (error) {
				throw new BadRequestError(
					"Issue while reordering from a Pharmacy => " + error
				);
			}
		});

		return result;
	}

	async updatepatientAcceptOrder(patient_id: number, requestId: number) {
		//check the timeout time
		let currentData: any = await TemporaryRequestPharmacy.findOne({ where: { id: requestId, patient_id: patient_id } }
		);

		let isActive: boolean = await Utils.compareTime(currentData.updatedAt, true);
		if (!isActive) {
			throw new BadRequestError("Order Request Timeout");
		}
		let remainRecordPromise: any = [];
		let result: any = await TemporaryRequestPharmacy.update(
			{ order_type: "accept", accept_order_patient: 1, order_status_code: 1 },
			{ where: { id: requestId, patient_id: patient_id } },
		);

		let remainRecord: any = await TemporaryRequestPharmacy.findAll({
			where: { accept_order_patient: 0, patient_id: patient_id },
			attributes: ["id"],
			raw: true,
		});

		for (let i = 0; i < remainRecord.length; i++) {
			remainRecordPromise.push(await this.clearRemainingOrder(remainRecord[i], false, 13));
		}


		//Accepted Pharmacist Order
		let pharmacyOrder: any = await TemporaryRequestPharmacy.findOne({
			where: {
				id: requestId, patient_id: patient_id
			},
			raw: true,
		});

		let workplace: any = await PharmacyWorkplaceUsers.findOne({
			where: {
				user_id: pharmacyOrder.pharmacy_id
			},
			raw: true
		});

		let nearByWorkplaces = [
			{
				id: workplace.workplace_id
			}
		];
		let [nearByPharmaUsers, nearByPharmaEmpUsers] = await Promise.all([this.nearbyPharmaEmployees(
			nearByWorkplaces
		),
		this.nearbyPharmaEmployees(
			nearByWorkplaces, false
		)]);

		let notificationAdminContact: any = [];
		let notificationEmpContact: any = [];
		await nearByPharmaEmpUsers.map((singleEmp: any) => {
			notificationEmpContact.push(singleEmp.contact_number)
		})
		await nearByPharmaUsers.map((singleEmp: any) => {
			notificationAdminContact.push(singleEmp.contact_number)
		})

		let patientDetail: any = await Users.findOne({
			where: {
				id: patient_id
			},
			attributes: [
				[
					fn("CONCAT", col("first_name"), " ", col("last_name")),
					"name",
				],
			],
		});
		let dynamicData = { patientName: patientDetail.name, orderId: pharmacyOrder.order_id };
		await Promise.all([...remainRecordPromise,
		new Notifications().sendNotification("PHARM_ADMIN_ORDER_CONFIRMED_BY_PATIENT", dynamicData, { contact_number: notificationAdminContact }),
		new Notifications().sendNotification("PHARM_EMPLOYEE_ORDER_CONFIRMED_BY_PATIENT", dynamicData, { contact_number: notificationEmpContact })
		]);

		return { msg: "Patient accept Pharmacy Order Request successfully" };
	}

	async clearRemainingOrder(remainRecord: any, needToDelete = false, order_status_code?: number) {
		let removeTempOrderpromises = [];
		removeTempOrderpromises.push(this.requestPharmacyRemove(remainRecord.id, needToDelete, order_status_code));
		await Promise.all(removeTempOrderpromises);
	}
	async requestPharmacyRemove(requestId: any, needToDelete = false, order_status_code?: number) {

		if (needToDelete) {
			return TemporaryRequestPharmacy.destroy({
				where: {
					id: requestId,
				}
			})
		}
		return TemporaryRequestPharmacy.update({ is_cancelled: 1, order_status_code: order_status_code }, {
			where: {
				id: requestId,
			},
		});
	}

	async patientOrderPharmacyRemove(remainRecordId: any) {
		return TemporaryPatientOrderPharmacy.destroy({
			where: {
				temporary_request_pharmacy_id: remainRecordId,
			},
		});
	}
	async rxRemove(rxId: any) {
		return TemporaryRxImmunisation.destroy({
			where: {
				temporary_patient_order_pharmacy_id: rxId,
			},
		});
	}
	async orderSummaryRemove(remainRecordId: number) {
		return TemporaryOrderSummary.destroy({
			where: {
				temporary_request_pharmacy_id: remainRecordId,
			},
		});
	}
	async currentPharmacyRequestedOrders(patient_id: number) {
		TemporaryRequestPharmacy.hasMany(TemporaryPatientOrderPharmacy, {
			foreignKey: "temporary_request_pharmacy_id",
		});
		TemporaryPatientOrderPharmacy.belongsTo(TemporaryRequestPharmacy, {
			foreignKey: "temporary_request_pharmacy_id",
		});
		return TemporaryPatientOrderPharmacy.findAll({
			where: {
				patient_id: patient_id,
				//order_type: 'Request'
			},
			attributes: [
				["order_id", "order_id"],
				["createdAt", "createdAt"],
				["prescription_type", "prescription_type"],
				[
					fn("COUNT", fn("DISTINCT", col("prescription_id"))),
					"total_electronic_prescriptions",
				],
				[
					fn("COUNT", fn("DISTINCT", col("scanned_doc_id"))),
					"total_scanned_prescriptions",
				],
			],
			include: [
				{
					model: TemporaryRequestPharmacy,
					attributes: [],
					where: {
						order_type: "request",
						is_cancelled: 0
					},
				},
			],
			raw: true,
			group: ["order_id", "prescription_type"],
			order: [["createdAt", "DESC"]],
		});
	}

	async pendingFullfilmentOrders(patient_id: number) {
		TemporaryRequestPharmacy.hasOne(TemporaryOrderSummary, {
			foreignKey: "temporary_request_pharmacy_id",
		});
		TemporaryOrderSummary.belongsTo(TemporaryRequestPharmacy, {
			foreignKey: "temporary_request_pharmacy_id",
		});

		TemporaryRequestPharmacy.hasMany(TemporaryPatientOrderPharmacy, {
			foreignKey: "temporary_request_pharmacy_id",
		});
		TemporaryPatientOrderPharmacy.belongsTo(TemporaryRequestPharmacy, {
			foreignKey: "temporary_request_pharmacy_id",
		});

		Users.hasOne(TemporaryPatientOrderPharmacy, { foreignKey: "pharmacy_id" });
		TemporaryPatientOrderPharmacy.belongsTo(Users, { foreignKey: "pharmacy_id" });
		Users.hasOne(PharmacyWorkplaceUsers, { foreignKey: "user_id" });
		PharmacyWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		PharmacyWorkplaces.hasOne(PharmacyWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		PharmacyWorkplaceUsers.belongsTo(PharmacyWorkplaces, {
			foreignKey: "workplace_id",
		});
		Address.hasOne(PharmacyWorkplaces, { foreignKey: "address_id" });
		PharmacyWorkplaces.belongsTo(Address, { foreignKey: "address_id" });

		return TemporaryPatientOrderPharmacy.findAll({
			where: {
				patient_id: patient_id,
				//order_type: 'Request'
			},
			attributes: [
				["order_id", "order_id"],
				["createdAt", "createdAt"],
				["prescription_type", "prescription_type"],
				["temporary_request_pharmacy_id", "request_pharmacy_id"],
				// [
				// 	fn("COUNT", fn("DISTINCT", col("prescription_id"))),
				// 	"total_electronic_prescriptions",
				// ],
				// [
				// 	fn("COUNT", fn("DISTINCT", col("scanned_doc_id"))),
				// 	"total_scanned_prescriptions",
				// ],
				[fn("", col("full_order")), "full_order"],
				[fn("", col("partial_order")), "partial_order"],
				[fn("", col("substituted_medicines")), "substituted_medicines"],
				[fn("", col("order_status")), "order_status"],
				[fn("", col("minimum_order_amount")), "minimum_order_amount"],

				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("phone_number")), "phone_number"],

				[fn("ST_X", col("location")), "latitude"],
				[fn("ST_Y", col("location")), "longitude"],
				[fn("", col("locality")), "locality"],
				[fn("", col("address")), "address"],
				[fn("", col("city")), "city"],
				[fn("", col("pincode")), "pincode"],
				[fn("", col("total")), "total"],

			],
			include: [
				{
					model: TemporaryRequestPharmacy,
					attributes: [],
					where: {
						order_type: "accept",
						accept_order_pharmacy: 1,
						accept_order_patient: 1,
						is_cancelled: 0,
					},
					include: [
						{
							model: TemporaryOrderSummary,
							attributes: [],
						},
					]
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: PharmacyWorkplaceUsers,
							attributes: [],
							include: [
								{
									model: PharmacyWorkplaces,
									attributes: [],
									include: [
										{
											model: Address,
											attributes: [],
										},
									],
								},
							],
						},
					],
				},
			],
			raw: true,
			group: ["order_id", "prescription_type"],
			order: [["createdAt", "DESC"]],
		});
	}

	async reqordersAcceptedByPharmacy(patient_id: number, order_id: string) {
		TemporaryRequestPharmacy.hasOne(TemporaryOrderSummary, {
			foreignKey: "temporary_request_pharmacy_id",
		});
		TemporaryOrderSummary.belongsTo(TemporaryRequestPharmacy, {
			foreignKey: "temporary_request_pharmacy_id",
		});
		Users.hasOne(TemporaryRequestPharmacy, { foreignKey: "pharmacy_id" });
		TemporaryRequestPharmacy.belongsTo(Users, { foreignKey: "pharmacy_id" });
		Users.hasOne(PharmacyWorkplaceUsers, { foreignKey: "user_id" });
		PharmacyWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		PharmacyWorkplaces.hasOne(PharmacyWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		PharmacyWorkplaceUsers.belongsTo(PharmacyWorkplaces, {
			foreignKey: "workplace_id",
		});
		Address.hasOne(PharmacyWorkplaces, { foreignKey: "address_id" });
		PharmacyWorkplaces.belongsTo(Address, { foreignKey: "address_id" });

		return TemporaryRequestPharmacy.findAll({
			attributes: [
				["order_id", "order_id"],
				["id", "request_pharmacy_id"],
				[fn("", col("accept_order_pharmacy")), "accept_order_pharmacy"],
				["full_order", "full_order"],
				["partial_order", "partial_order"],
				["substituted_medicines", "substituted_medicines"],
				["pharmacy_id", "pharmacy_id"],
				["order_status", "order_status"],
				["createdAt", "createdAt"],

				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("phone_number")), "phone_number"],
				[fn("", col("minimum_order_amount")), "minimum_order_amount"],

				[fn("ST_X", col("location")), "latitude"],
				[fn("ST_Y", col("location")), "longitude"],
				[fn("", col("locality")), "locality"],
				[fn("", col("address")), "address"],
				[fn("", col("city")), "city"],
				[fn("", col("pincode")), "pincode"],

				[fn("", col("home_delivery")), "home_delivery"],
				[fn("", col("selected_medicines_price")), "selected_medicines_price"],
				[fn("", col("delivery_charges")), "delivery_charges"],
				[
					fn("", col("additional_delivery_charges")),
					"additional_delivery_charges",
				],
				[fn("", col("gst")), "gst"],
				[fn("", col("temporary_order_summary.discount")), "discount"],
				[fn("", col("total")), "total"],
			],
			where: {
				order_id: order_id,
				patient_id: patient_id,
				order_type: "request",
				//accept_order_pharmacy: 1,
				is_cancelled: 0,
				// order_status_code: { [Op.ne]: 7 }
			},
			include: [
				{
					model: TemporaryOrderSummary,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: PharmacyWorkplaceUsers,
							attributes: [],
							include: [
								{
									model: PharmacyWorkplaces,
									attributes: [],
									include: [
										{
											model: Address,
											attributes: [],
										},
									],
								},
							],
						},
					],
				},
			],
			raw: true,
		});
	}

	async patientdeclineOrder(patient_id: number, requestId: number) {
		let remainRecord: any = await TemporaryRequestPharmacy.findOne({
			where: { id: requestId, patient_id: patient_id },
			attributes: ["id", "updatedAt"],
			raw: true,
		});

		if (!remainRecord)
			throw new BadRequestError(
				"No such Request OrderId Found for Pharmacy Order"
			);
		else {
			let isActive: boolean = await Utils.compareTime(remainRecord.updatedAt, true);
			if (!isActive) {
				throw new BadRequestError("Order Request Timeout");
			}
		}
		await this.clearRemainingOrder(remainRecord, false, 13);

		return { msg: "Patient decline Pharmacy order successfully" };
	}

	async previouslySelectedPharmacies(
		patient_id: number,
		limit: number,
		offset: number
	) {
		RequestPharmacy.hasOne(OrderSummary, { foreignKey: "request_pharmacy_id" });
		OrderSummary.belongsTo(RequestPharmacy, {
			foreignKey: "request_pharmacy_id",
		});
		Users.hasOne(RequestPharmacy, { foreignKey: "pharmacy_id" });
		RequestPharmacy.belongsTo(Users, { foreignKey: "pharmacy_id" });
		Users.hasOne(PharmacyWorkplaceUsers, { foreignKey: "user_id" });
		PharmacyWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		PharmacyWorkplaces.hasOne(PharmacyWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		PharmacyWorkplaceUsers.belongsTo(PharmacyWorkplaces, {
			foreignKey: "workplace_id",
		});
		Address.hasOne(PharmacyWorkplaces, { foreignKey: "address_id" });
		PharmacyWorkplaces.belongsTo(Address, { foreignKey: "address_id" });

		let previousOrders = await RequestPharmacy.findAll({
			attributes: [
				["id", "id"],
				["order_id", "order_id"],
				["order_status", "order_status"],
				["createdAt", "createdAt"],
				["updatedAt", "updatedAt"],

				[fn("", col("workplace_id")), "workplace_id"],
				[fn("", col("user_id")), "user_id"],

				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("phone_number")), "phone_number"],
				[fn("", col("minimum_order_amount")), "minimum_order_amount"],

				[fn("ST_X", col("location")), "latitude"],
				[fn("ST_Y", col("location")), "longitude"],
				[fn("", col("locality")), "locality"],
				[fn("", col("address")), "address"],
				[fn("", col("city")), "city"],
				[fn("", col("pincode")), "pincode"],

				[fn("", col("home_delivery")), "home_delivery"],
				[fn("", col("selected_medicines_price")), "selected_medicines_price"],
				[fn("", col("delivery_charges")), "delivery_charges"],
				[
					fn("", col("additional_delivery_charges")),
					"additional_delivery_charges",
				],
				[fn("", col("gst")), "gst"],
				[fn("", col("order_summary.discount")), "discount"],
				[fn("", col("total")), "total"],
			],
			where: {
				patient_id: patient_id,
				is_cancelled: 0,
				order_status_code: { [Op.ne]: OrderStatusEnum['Timed Out'] }
			},
			include: [
				{
					model: OrderSummary,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: PharmacyWorkplaceUsers,
							attributes: [],
							include: [
								{
									model: PharmacyWorkplaces,
									attributes: [],
									include: [
										{
											model: Address,
											attributes: [],
										},
									],
								},
							],
						},
					],
				},
			],
			raw: true,
			group: ["order_id"],
			order: [["createdAt", "DESC"]],
			limit: limit,
			offset: offset,
		});

		return { previousOrders, limit, offset };
	}

	async getOrderHistory(patient_id: number, limit: number, offset: number) {
		RequestPharmacy.hasOne(PatientOrderPharmacy, {
			foreignKey: "request_pharmacy_id",
		});
		PatientOrderPharmacy.belongsTo(RequestPharmacy, {
			foreignKey: "request_pharmacy_id",
		});
		RequestPharmacy.hasOne(PharmacyCancelOrder, {
			foreignKey: "order_request_pharmacy_id",
		});
		PharmacyCancelOrder.belongsTo(RequestPharmacy, {
			foreignKey: "order_request_pharmacy_id",
		});
		Users.hasOne(RequestPharmacy, { foreignKey: "pharmacy_id" });
		RequestPharmacy.belongsTo(Users, { foreignKey: "pharmacy_id" });
		Users.hasOne(PharmacyWorkplaceUsers, { foreignKey: "user_id" });
		PharmacyWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		PharmacyWorkplaces.hasOne(PharmacyWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		PharmacyWorkplaceUsers.belongsTo(PharmacyWorkplaces, {
			foreignKey: "workplace_id",
		});
		Address.hasOne(PharmacyWorkplaces, { foreignKey: "address_id" });
		PharmacyWorkplaces.belongsTo(Address, { foreignKey: "address_id" });

		let previousOrders = await RequestPharmacy.findAll({
			attributes: [
				["id", "id"],
				["order_id", "order_id"],
				["order_status", "order_status"],
				["order_status_code", "order_status_code"],
				["createdAt", "createdAt"],
				["updatedAt", "updatedAt"],

				[fn("", col("prescription_type")), "prescription_type"],

				["is_cancelled", "is_cancelled"],
				[fn("", col("cancel_reason")), "cancel_reason"],

				[fn("", col("workplace_id")), "workplace_id"],
				[fn("", col("user_id")), "user_id"],

				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("phone_number")), "phone_number"],
				[fn("", col("minimum_order_amount")), "minimum_order_amount"],

				[fn("ST_X", col("location")), "latitude"],
				[fn("ST_Y", col("location")), "longitude"],
				[fn("", col("locality")), "locality"],
				[fn("", col("address")), "address"],
				[fn("", col("city")), "city"],
				[fn("", col("pincode")), "pincode"],
			],
			where: {
				patient_id: patient_id,
			},
			include: [
				{
					model: PatientOrderPharmacy,
					attributes: [],
				},
				{
					model: PharmacyCancelOrder,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: PharmacyWorkplaceUsers,
							attributes: [],
							include: [
								{
									model: PharmacyWorkplaces,
									attributes: [],
									include: [
										{
											model: Address,
											attributes: [],
										},
									],
								},
							],
						},
					],
				},
			],
			raw: true,
			group: ["order_id"],
			order: [["createdAt", "DESC"]],
			limit: limit,
			offset: offset,
		});

		return { previousOrders, limit, offset };
	}

	async createTemporaryLabRequest(request: any) {
		return TemporaryRequestLab.create(request);
	}

	async createTemporaryLabOrder(order: any) {
		return TemporaryPatientOrderLab.create(order, { raw: true });
	}

	async addLabWiseOrderRequest(requestedTests: any) {
		return Utils.setTransaction(async () => {
			try {
				// Is the default role for Pharamcy Available for that user
				let userRole: any = await Users.findOne({
					attributes: ["default_role"],
					where: { id: requestedTests.previous_order_details.user_id },
					raw: true,
				});

				if (!userRole || userRole.default_role !== RolesEnum.Laboratory)
					throw new BadRequestError(
						"There is no such user with default role of Laboratory so order request will not be sent"
					);

				// Fetch All device info regarding FCM for nearby Pharma employee's
				let nearByLabUsers: any[] = [];
				nearByLabUsers.push(requestedTests.previous_order_details);

				let reqOrderPromises = [];
				//Generate Order Id
				let order_id = v4();
				for (
					let nearByIndex = 0;
					nearByIndex < nearByLabUsers.length;
					nearByIndex++
				) {
					let {
						patient_id,
						order_type,
						order_status,
						prescription_type,
						custom_order = 0
					} = requestedTests.requestLab;

					let temporaryrequest: any = await this.createTemporaryLabRequest({
						order_id: order_id,
						patient_id,
						order_type: order_type.toLowerCase(),
						order_status: order_status.toLowerCase(),
						lab_id: nearByLabUsers[nearByIndex].user_id,
					});
					let patientOrderPromise = [];
					for (
						let requestIndex = 0;
						requestIndex < requestedTests.prescriptions.length;
						requestIndex++
					) {
						let temporaryPatientOrder: any = {
							order_id: order_id,
							patient_id: requestedTests.requestLab.patient_id,
							booking_id:
								prescription_type.toLowerCase() == "electronic"
									? requestedTests.prescriptions[requestIndex].booking_id
									: null,
							prescription_id:
								prescription_type.toLowerCase() == "electronic"
									? requestedTests.prescriptions[requestIndex].prescriptions_id
									: null,
							temporary_request_lab_id: temporaryrequest.id,
							lab_id: nearByLabUsers[nearByIndex].user_id,
							doctor_id: requestedTests.prescriptions[requestIndex].doctor_id,
							is_repeatable_prescriptions:
								requestedTests.prescriptions[requestIndex]
									.is_repeatable_prescriptions,
							prescription_type: prescription_type.toLowerCase(),
							custom_order: custom_order,
							scanned_doc_id: requestedTests.prescriptions[requestIndex].scanned_doc_id
						};
						patientOrderPromise.push(
							this.createTemporaryLabOrder(temporaryPatientOrder)
						);
					}

					let createTemporaryOrder: any = await Promise.all(
						patientOrderPromise
					);

					if (prescription_type.toLowerCase() == "electronic") {
						for (const [requestIndex] of createTemporaryOrder.entries()) {
							let testData = requestedTests.prescriptions[requestIndex].tests;
							for (
								let testIndex = 0;
								testIndex < testData.length;
								testIndex++
							) {
								let lab_test: any = await LabTest.findOne({
									where: {
										tests_id: testData[testIndex].test_id,
										lab_id: nearByLabUsers[nearByIndex].workplace_id,
									},
									raw: true,
								});

								let tests: any = {
									order_id: order_id,
									lab_test_id: testData[testIndex].test_id,
									test_name: testData[testIndex].test_name,
									details: testData[testIndex].details,
									booking_id:
										requestedTests.prescriptions[requestIndex].booking_id,
									prescriptions_id:
										requestedTests.prescriptions[requestIndex].prescriptions_id,
									doctor_id:
										requestedTests.prescriptions[requestIndex].doctor_id,
									is_home_collection: lab_test
										? lab_test.home_collection
										: testData[testIndex].patient_home_collection,
									home_collection_charges: lab_test
										? lab_test.home_collection_charges
										: 0,
									mrp: lab_test ? lab_test.cost : 0,
									is_lab_selected: lab_test ? 1 : 0,
									temporary_patient_order_lab_id:
										createTemporaryOrder[requestIndex].dataValues.id,
								};
								reqOrderPromises.push(
									TemporaryLabTests.create(tests, {
										returning: true,
									})
								);
							}
						}
						await Promise.all(reqOrderPromises);
					}
				}

				return { msg: "ReOrder Request Sent SuccessFully to the Laboratory" };
			} catch (error) {
				throw new BadRequestError(
					"Issue while reordering from a Laboratory => " + error
				);
			}
		});
	}

	async currenLabRequestedOrders(patient_id: number) {
		TemporaryRequestLab.hasMany(TemporaryPatientOrderLab, {
			foreignKey: "temporary_request_lab_id",
		});
		TemporaryPatientOrderLab.belongsTo(TemporaryRequestLab, {
			foreignKey: "temporary_request_lab_id",
		});
		return TemporaryPatientOrderLab.findAll({
			where: {
				patient_id: patient_id,
			},
			attributes: [
				["order_id", "order_id"],
				["createdAt", "createdAt"],
				["prescription_type", "prescription_type"],
				["custom_order", "custom_order"],
				[
					fn("COUNT", fn("DISTINCT", col("prescription_id"))),
					"total_electronic_prescriptions",
				],
				[
					fn("COUNT", fn("DISTINCT", col("scanned_doc_id"))),
					"total_scanned_prescriptions",
				],
			],
			include: [
				{
					model: TemporaryRequestLab,
					attributes: [],
					where: {
						order_type: "request",
						is_cancelled: 0,
					},
				},
			],
			raw: true,
			group: ["order_id", "prescription_type"],
			order: [["createdAt", "DESC"]],
		});
	}

	async pendingLabFullfilmentOrders(patient_id: number) {
		TemporaryRequestLab.hasOne(TemporaryLabOrderSummary, {
			foreignKey: "temporary_request_lab_id",
		});
		TemporaryLabOrderSummary.belongsTo(TemporaryRequestLab, {
			foreignKey: "temporary_request_lab_id",
		});

		TemporaryRequestLab.hasMany(TemporaryPatientOrderLab, {
			foreignKey: "temporary_request_lab_id",
		});
		TemporaryPatientOrderLab.belongsTo(TemporaryRequestLab, {
			foreignKey: "temporary_request_lab_id",
		});

		Users.hasOne(TemporaryPatientOrderLab, { foreignKey: "lab_id" });
		TemporaryPatientOrderLab.belongsTo(Users, { foreignKey: "lab_id" });
		Users.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
		LabWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		LabWorkplaces.hasOne(LabWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		LabWorkplaceUsers.belongsTo(LabWorkplaces, {
			foreignKey: "workplace_id",
		});
		Address.hasOne(LabWorkplaces, { foreignKey: "address_id" });
		LabWorkplaces.belongsTo(Address, { foreignKey: "address_id" });


		return TemporaryPatientOrderLab.findAll({
			where: {
				patient_id: patient_id,
			},
			attributes: [
				["order_id", "order_id"],
				["createdAt", "createdAt"],
				["prescription_type", "prescription_type"],
				["temporary_request_lab_id", "request_lab_id"],
				[fn("", col("order_status")), "order_status"],
				// ["custom_order", "custom_order"],
				// [
				// 	fn("COUNT", fn("DISTINCT", col("prescription_id"))),
				// 	"total_electronic_prescriptions",
				// ],
				// [
				// 	fn("COUNT", fn("DISTINCT", col("scanned_doc_id"))),
				// 	"total_scanned_prescriptions",
				// ],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("phone_number")), "phone_number"],

				[fn("ST_X", col("location")), "latitude"],
				[fn("ST_Y", col("location")), "longitude"],
				[fn("", col("locality")), "locality"],
				[fn("", col("address")), "address"],
				[fn("", col("city")), "city"],
				[fn("", col("pincode")), "pincode"],
				[fn("", col("total")), "total"],
			],
			include: [
				{
					model: TemporaryRequestLab,
					attributes: [],
					where: {
						order_type: "accept",
						accept_order_lab: 1,
						accept_order_patient: 1,
						is_cancelled: 0,
					},
					include: [
						{
							model: TemporaryLabOrderSummary,
							attributes: [],
						},
					]
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: LabWorkplaceUsers,
							attributes: [],
							include: [
								{
									model: LabWorkplaces,
									attributes: [],
									include: [
										{
											model: Address,
											attributes: [],
										},
									],
								},
							],
						},
					],
				},
			],
			raw: true,
			group: ["order_id", "prescription_type"],
			order: [["createdAt", "DESC"]],
		});
	}


	async reqordersAcceptedByLabs(patient_id: number, order_id: string) {
		TemporaryRequestLab.hasOne(TemporaryLabOrderSummary, {
			foreignKey: "temporary_request_lab_id",
		});
		TemporaryLabOrderSummary.belongsTo(TemporaryRequestLab, {
			foreignKey: "temporary_request_lab_id",
		});
		Users.hasOne(TemporaryRequestLab, { foreignKey: "lab_id" });
		TemporaryRequestLab.belongsTo(Users, { foreignKey: "lab_id" });
		Users.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
		LabWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		LabWorkplaces.hasOne(LabWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		LabWorkplaceUsers.belongsTo(LabWorkplaces, {
			foreignKey: "workplace_id",
		});
		Address.hasOne(LabWorkplaces, { foreignKey: "address_id" });
		LabWorkplaces.belongsTo(Address, { foreignKey: "address_id" });

		return TemporaryRequestLab.findAll({
			attributes: [
				["order_id", "order_id"],
				["id", "request_pharmacy_id"],
				["lab_id", "lab_id"],
				["order_status", "order_status"],
				["createdAt", "createdAt"],

				[fn("", col("accept_order_lab")), "accept_order_lab"],

				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("phone_number")), "phone_number"],
				[fn("", col("delivery_customer")), "deliver_electronic_reports"],

				[fn("ST_X", col("location")), "latitude"],
				[fn("ST_Y", col("location")), "longitude"],
				[fn("", col("locality")), "locality"],
				[fn("", col("address")), "address"],
				[fn("", col("city")), "city"],
				[fn("", col("pincode")), "pincode"],

				[fn("", col("home_delivery")), "home_delivery"],
				[fn("", col("selected_test_price")), "selected_test_price"],
				[fn("", col("delivery_charges")), "delivery_charges"],
				[fn("", col("gst")), "gst"],
				[fn("", col("temporary_lab_order_summary.discount")), "discount"],
				[fn("", col("total")), "total"],
			],
			where: {
				order_id: order_id,
				patient_id: patient_id,
				order_type: "request",
				//accept_order_lab: 1,
				is_cancelled: 0,
				// order_status_code: { [Op.ne]: 7 }
			},
			include: [
				{
					model: TemporaryLabOrderSummary,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: LabWorkplaceUsers,
							attributes: [],
							include: [
								{
									model: LabWorkplaces,
									attributes: [],
									include: [
										{
											model: Address,
											attributes: [],
										},
									],
								},
							],
						},
					],
				},
			],
			raw: true,
		});
	}

	async patientAcceptLabOrder(patient_id: number, requestId: number) {
		return Utils.setTransaction(async () => {
			//check the timeout time
			let currentData: any = await TemporaryRequestLab.findOne({ where: { id: requestId, patient_id: patient_id } }
			);

			let isActive: boolean = await Utils.compareTime(currentData.updatedAt, true);
			if (!isActive) {
				throw new BadRequestError("Order Request Timeout");
			}

			let remainRecordPromise = [];

			let result = await TemporaryRequestLab.update(
				{ order_type: "accept", accept_order_patient: 1, order_status_code: 1 },
				{ where: { id: requestId, patient_id: patient_id } }
			);

			let aceptedOrder: any = await TemporaryRequestLab.findOne({
				where: {
					id: requestId,
					patient_id: patient_id,
					order_type: "accept",
				},
				raw: true,
			});

			if (!aceptedOrder)
				throw new BadRequestError("Issue while accepting Lab Order Request");

			let remainRecord: any = await TemporaryRequestLab.findAll({
				where: {
					accept_order_patient: 0,
					patient_id: patient_id,
					createdAt: aceptedOrder.createdAt,
				},
				attributes: ["id"],
				raw: true,
			});

			for (let i = 0; i < remainRecord.length; i++) {
				remainRecordPromise.push(
					await this.clearRemainingLabOrder(remainRecord[i])
				);
			}
			await Promise.all(remainRecordPromise);
			return { msg: "Patient accept Lab Order Request successfully" };
		});
	}

	async patientdeclineLabOrder(patient_id: number, requestId: number) {
		return Utils.setTransaction(async () => {
			let remainRecord: any = await TemporaryRequestLab.findOne({
				where: { id: requestId, patient_id: patient_id },
				attributes: ["id", "updatedAt"],
				raw: true,
			});

			if (!remainRecord)
				throw new BadRequestError(
					"No such Request OrderId Found for Lab Order"
				);
			else {
				let isActive: boolean = await Utils.compareTime(remainRecord.updatedAt, true);
				if (!isActive) {
					throw new BadRequestError("Order Request Timeout");
				}

			}
			await this.clearRemainingLabOrder(remainRecord);

			return { msg: "Patient decline Lab order successfully" };
		});
	}

	async clearRemainingLabOrder(remainRecord: any, needToDelete = false) {
		let removeTempOrderpromises = [];
		removeTempOrderpromises.push(this.requestLabRemove(remainRecord.id, needToDelete));
		await Promise.all(removeTempOrderpromises);
	}

	async removeLabTests(labOrderID: number) {
		return TemporaryLabTests.destroy({
			where: {
				temporary_patient_order_lab_id: labOrderID,
			},
		});
	}
	async patientOrderLabRemove(remainRecordId: any) {
		return TemporaryPatientOrderLab.destroy({
			where: {
				temporary_request_lab_id: remainRecordId,
			},
		});
	}
	async labOrderSummaryRemove(remainRecordId: number) {
		return TemporaryLabOrderSummary.destroy({
			where: {
				temporary_request_lab_id: remainRecordId,
			},
		});
	}
	async requestLabRemove(requestId: any, needToDelete = false) {

		if (needToDelete) {
			return TemporaryRequestLab.destroy({
				where: {
					id: requestId,
				}
			})
		}

		return TemporaryRequestLab.update({ is_cancelled: 1 }, {
			where: {
				id: requestId,
			},
		});
	}

	async previouslySelectedLabs(
		patient_id: number,
		limit: number,
		offset: number
	) {
		RequestLab.hasOne(LabOrderSummary, { foreignKey: "request_lab_id" });
		LabOrderSummary.belongsTo(RequestLab, { foreignKey: "request_lab_id" });
		Users.hasOne(RequestLab, { foreignKey: "lab_id" });
		RequestLab.belongsTo(Users, { foreignKey: "lab_id" });
		Users.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
		LabWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		LabWorkplaces.hasOne(LabWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		LabWorkplaceUsers.belongsTo(LabWorkplaces, {
			foreignKey: "workplace_id",
		});
		Address.hasOne(LabWorkplaces, { foreignKey: "address_id" });
		LabWorkplaces.belongsTo(Address, { foreignKey: "address_id" });

		let previousOrders = await RequestLab.findAll({
			attributes: [
				["id", "id"],
				["order_id", "order_id"],
				["order_status", "order_status"],
				["createdAt", "createdAt"],
				["updatedAt", "updatedAt"],

				[fn("", col("workplace_id")), "workplace_id"],
				[fn("", col("user_id")), "user_id"],

				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("phone_number")), "phone_number"],
				[fn("", col("delivery_customer")), "deliver_electronic_reports"],

				[fn("ST_X", col("location")), "latitude"],
				[fn("ST_Y", col("location")), "longitude"],
				[fn("", col("locality")), "locality"],
				[fn("", col("address")), "address"],
				[fn("", col("city")), "city"],
				[fn("", col("pincode")), "pincode"],

				[fn("", col("home_delivery")), "home_delivery"],
				[fn("", col("selected_test_price")), "selected_test_price"],
				[fn("", col("delivery_charges")), "delivery_charges"],
				[fn("", col("gst")), "gst"],
				[fn("", col("lab_order_summary.discount")), "discount"],
				[fn("", col("total")), "total"],
			],
			where: {
				patient_id: patient_id,
				is_cancelled: 0,
				order_status_code: { [Op.ne]: OrderStatusEnum['Timed Out'] }
			},
			include: [
				{
					model: LabOrderSummary,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: LabWorkplaceUsers,
							attributes: [],
							include: [
								{
									model: LabWorkplaces,
									attributes: [],
									include: [
										{
											model: Address,
											attributes: [],
										},
									],
								},
							],
						},
					],
				},
			],
			raw: true,
			group: ["order_id"],
			order: [["createdAt", "DESC"]],
			limit: limit,
			offset: offset,
		});

		return { previousOrders, limit, offset };
	}

	async getLabOrderHistory(patient_id: number, limit: number, offset: number) {
		RequestLab.hasOne(PatientOrderLab, { foreignKey: "request_lab_id" });
		PatientOrderLab.belongsTo(RequestLab, { foreignKey: "request_lab_id" });
		RequestLab.hasOne(LabCancelOrder, { foreignKey: "order_request_lab_id" });
		LabCancelOrder.belongsTo(RequestLab, {
			foreignKey: "order_request_lab_id",
		});
		Users.hasOne(RequestLab, { foreignKey: "lab_id" });
		RequestLab.belongsTo(Users, { foreignKey: "lab_id" });
		Users.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
		LabWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		LabWorkplaces.hasOne(LabWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		LabWorkplaceUsers.belongsTo(LabWorkplaces, {
			foreignKey: "workplace_id",
		});
		Address.hasOne(LabWorkplaces, { foreignKey: "address_id" });
		LabWorkplaces.belongsTo(Address, { foreignKey: "address_id" });

		let previousOrders = await RequestLab.findAll({
			attributes: [
				["id", "id"],
				["order_id", "order_id"],
				["order_status", "order_status"],
				["order_status_code", "order_status_code"],
				["createdAt", "createdAt"],
				["updatedAt", "updatedAt"],

				[fn("", col("prescription_type")), "prescription_type"],
				[fn("", col("custom_order")), "custom_order"],

				["is_cancelled", "is_cancelled"],
				[fn("", col("cancel_reason")), "cancel_reason"],

				[fn("", col("workplace_id")), "workplace_id"],
				[fn("", col("user_id")), "user_id"],

				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("phone_number")), "phone_number"],
				[fn("", col("delivery_customer")), "deliver_electronic_reports"],

				[fn("ST_X", col("location")), "latitude"],
				[fn("ST_Y", col("location")), "longitude"],
				[fn("", col("locality")), "locality"],
				[fn("", col("address")), "address"],
				[fn("", col("city")), "city"],
				[fn("", col("pincode")), "pincode"],
			],
			where: {
				patient_id: patient_id,
			},
			include: [
				{
					model: PatientOrderLab,
					attributes: []
				},
				{
					model: LabCancelOrder,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: LabWorkplaceUsers,
							attributes: [],
							include: [
								{
									model: LabWorkplaces,
									attributes: [],
									include: [
										{
											model: Address,
											attributes: [],
										},
									],
								},
							],
						},
					],
				},
			],
			raw: true,
			group: ["request_lab.id"],
			order: [["createdAt", "DESC"]],
			limit: limit,
			offset: offset,
		});

		return { previousOrders, limit, offset };
	}

	async getAllPrescrptionList(patient_id: number, limit: number, offset: number) {
		DrPatientAppoiment.hasOne(Prescriptions, { foreignKey: "booking_id" });
		Prescriptions.belongsTo(DrPatientAppoiment, { foreignKey: "booking_id" });
		dr_Workplaces.hasOne(DrPatientAppoiment, { foreignKey: "workplace_id" });
		DrPatientAppoiment.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasOne(DrPatientAppoiment, { foreignKey: "doctor_id" });
		DrPatientAppoiment.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });
		UserUploads.hasOne(Prescriptions, { foreignKey: "user_upload_id" });
		Prescriptions.belongsTo(UserUploads, { foreignKey: "user_upload_id" });

		let appointments: any[] = [];
		appointments = await DrPatientAppoiment.findAll({
			attributes: [
				["id", "booking_id"],
				["workplace_id", "workplace_id"],
				["doctor_id", "doctor_id"],
				["date", "date"],
				["start_time", "start_time"],
				["end_time", "end_time"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "doctor_name"],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("is_expired")), "is_expired"],
				[
					fn("", col("is_repeatable_prescriptions")),
					"is_repeatable_prescriptions",
				],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
				[fn("CONCAT", `${AWS_FILE_UPLOAD_LINK}/`, col("key")), "prescription_link"],

			],
			where: {
				patient_id: patient_id,
				status: {
					[Op.like]: `%Completed%`,
				},
			},
			include: [
				{
					model: dr_Workplaces,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
					include: [
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
				},
				{
					model: Prescriptions,
					attributes: ['id'],
					include: [
						{
							model: UserUploads,
							attributes: [],
							required: false,
						},
					],
				},
			],
			raw: true,
			group: ['booking_id'],
			order: [["date", "DESC"], ["start_time", "DESC"]],
			limit: limit,
			offset: offset
		});

		let data = await this.getPatientAllergies(patient_id);
		if (appointments.length > 0) {
			let formatPrescibedpromises: any[] = [];
			for (let appointment of appointments) {
				formatPrescibedpromises.push(this.formatAppointmentsData(appointment));
			}
			appointments = await Promise.all(formatPrescibedpromises);

			return { appointments, allergies: data.allergies };
		}

		return { msg: "No Prescribed Data found", appointments, allergies: data.allergies };
	}

	async formatAppointmentsData(drAppointments: any) {
		let specialities = drAppointments.specialities
			? drAppointments.specialities.split(",")
			: [];
		drAppointments.specialities = specialities;

		// Reports available for Prescribed Test if any
		RequestLab.hasOne(PatientOrderLab, { foreignKey: "request_lab_id" });
		PatientOrderLab.belongsTo(RequestLab, { foreignKey: "request_lab_id" });
		PatientOrderLab.hasMany(LaboratoryLabTests, { foreignKey: "patient_order_lab_id" });
		LaboratoryLabTests.belongsTo(PatientOrderLab, { foreignKey: "patient_order_lab_id" });
		Tests.hasOne(LaboratoryLabTests, { foreignKey: "lab_test_id" });
		LaboratoryLabTests.belongsTo(Tests, { foreignKey: "lab_test_id" });
		let reports = await PatientOrderLab.findAll({
			where: {
				prescription_id: drAppointments['prescription.id'],
			},
			attributes: [
				["request_lab_id", "request_lab_id"],
				[fn("", col("lab_test_id")), "lab_test_id"],
				[fn("", col("name")), "test_name"],
				["order_id", "order_id"],
				["createdAt", "createdAt"],
				["updatedAt", "updatedAt"],
				[
					fn("CONCAT", `${AWS_FILE_UPLOAD_LINK}/`, col("lab_test_report")),
					"lab_test_report",
				],
				[fn("", col("report_name")), "report_name"],
			],
			include: [
				{
					model: RequestLab,
					attributes: [],
					where: {
						is_cancelled: 0
					}
				},
				{
					model: LaboratoryLabTests,
					attributes: [],
					where: {
						is_lab_selected: 1
					},
					include: [
						{
							model: Tests,
							attributes: []
						}
					]
				}
			],
			raw: true,
			group: ["request_lab_id", "lab_test_id"]
		});

		drAppointments.reports = reports;

		return drAppointments;
	}

	async addAllergies(patient_id: number, allergies: number[], otherAllergies: string[]) {
		let patientAllergylist: any[] = [];

		let existAllergeis: any = await PatientAllergies.findOne({ where: { user_id: patient_id }, raw: true });
		if (existAllergeis) {
			await PatientAllergies.destroy({ where: { user_id: patient_id } });
		}

		for (let i = 0; i < allergies.length; i++) {
			let allergyObj = {
				user_id: patient_id,
				allergies_id: allergies[i]
			}
			patientAllergylist.push(allergyObj);
		}

		//Add all new Manual Allergies added by patient in db
		if (otherAllergies.length > 0) {
			let allergiesArray = [];
			for (let i = 0; i < otherAllergies.length; i++) {
				let alleryObj: any = {
					name: otherAllergies[i],
					merge_allergies_id: null,
					date_time: moment().format('YYYY-MM-DD hh:mm:ss'),
					user_id: patient_id,
				}
				allergiesArray.push(alleryObj);
			}

			await Allergies.bulkCreate(allergiesArray);

			let newaddedAllergisIDList: any[] = await Allergies.findAll({
				attributes: ["id"],
				where: {
					name: {
						[Op.in]: otherAllergies
					}
				},
				raw: true
			});

			if (newaddedAllergisIDList.length > 0)
				for (let j = 0; j < newaddedAllergisIDList.length; j++) {
					let allergyObj = {
						user_id: patient_id,
						allergies_id: newaddedAllergisIDList[j].id
					}
					patientAllergylist.push(allergyObj);
				}
		}

		await PatientAllergies.bulkCreate(patientAllergylist);

		return { msg: "Allergies added for Patient Successfully" };
	}

	async getAllergies() {
		return await Allergies.findAll({
			where: {
				status: 1,
			},
			raw: true
		});
	}

	async getPatientAllergies(patient_id: number, is_list: boolean = false) {

		// Allergies.hasOne(PatientAllergies, { foreignKey: "allergies_id" });
		// PatientAllergies.belongsTo(Allergies, { foreignKey: "allergies_id" });

		// // Allergies.hasOne(Allergies, { foreignKey: "merge_allergies_id" });
		// Allergies.belongsTo(Allergies, { foreignKey: "merge_allergies_id", as: "parent" });

		// let attributeData = {};
		// if (is_list) {
		// 	attributeData = {
		// 		attributes: [
		// 			"id",
		// 			"name",
		// 			[sequelize.literal(`parent.name`), 'parent_name'],
		// 		],
		// 	}
		// }
		// else {
		// 	attributeData = {
		// 		attributes: [
		// 			[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "allergies"],

		// 		],
		// 	}
		// }

		// let includeData: any = is_list ? [{
		// 	model: Allergies,
		// 	attributes: [],
		// 	as: "parent"
		// }] : []

		// let data: any[] = await Allergies.findAll({
		// 	...attributeData,
		// 	// attributes: [
		// 	// 	[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "allergies"],
		// 	// 	// [sequelize.literal(`allergies.name`), 'allergies'],
		// 	// 	// [sequelize.literal(`parent.name`), 'parent_name'],
		// 	// ],
		// 	where: {
		// 		status: 1
		// 	},
		// 	include: [
		// 		{
		// 			model: PatientAllergies,
		// 			attributes: [],
		// 			where: {
		// 				user_id: patient_id
		// 			},
		// 		},
		// 		...includeData
		// 	],
		// 	raw: true
		// });

		if (is_list) {
			const data = await sequelize.query(
				`SELECT allergies.id, allergies.name, parent.name AS parent_name FROM allergies AS allergies INNER JOIN patient_allergies AS patient_allergy ON allergies.id = patient_allergy.allergies_id AND patient_allergy.user_id = ${patient_id} LEFT OUTER JOIN allergies AS parent ON allergies.merge_allergies_id = parent.id WHERE allergies.status = 1;`,
				{
					type: QueryTypes.SELECT
				}
			);
			return { allergies: data };
		}
		else {
			const data = await sequelize.query(
				`SELECT GROUP_CONCAT(DISTINCT(name)) AS allergies FROM allergies AS allergies INNER JOIN patient_allergies AS patient_allergy ON allergies.id = patient_allergy.allergies_id AND patient_allergy.user_id = ${patient_id} WHERE allergies.status = 1;`,
				{
					type: QueryTypes.SELECT
				}
			);
			let allergies = data[0].allergies ? data[0].allergies.split(",") : [];
			return { allergies };
		}
	}

	async reScheduleAppointment(appointment_details: any) {
		return Utils.setTransaction(async () => {
			let { role, booking_id, reason, ...createAppointmentDetails } = appointment_details;

			let reSchedulePromises: any[] = [
				// On reSchedule of Appointment old Appoint is marked as cancelled with 
				new DoctorService().cancelBooking(
					booking_id,
					role,
					booking_id,
					reason,
					true
				),
				// create new appointment as per new slot selected
				this.createAppointment(createAppointmentDetails, false, true)
			];

			let [cancelledBooking, newBooking] = await Promise.all(reSchedulePromises);
			console.log("booking ==>", newBooking);
			let [patient, doctor, wrkplace] = await Promise.all([Users.findOne({
				where: {
					id: newBooking.patient_id
				},
				attributes: [
					[
						fn("CONCAT", col("first_name"), " ", col("last_name")),
						"name",
					],
					"email",
					"contact_number",
				],
			}),
			Users.findOne({
				where: {
					id: newBooking.doctor_id
				},
				attributes: [
					[
						fn("CONCAT", col("first_name"), " ", col("last_name")),
						"name",
					],
					// "email",
					"contact_number"
				],

			}),
			dr_Workplaces.findOne({
				attributes: [
					"workplace_name",
				],
				where: {
					id: newBooking.workplace_id,
				},
				raw: true,
			})
			]);
			let patientDetail: any = patient;
			let doctorDetail: any = doctor;
			let workplace: any = wrkplace;

			let patientDynamicData = { patientName: patientDetail.name, doctorName: doctorDetail.name, workplace: workplace.workplace_name, date: newBooking.date, time: newBooking.start_time, bookingId: newBooking.id }
			let doctorDynamicData = { patientName: patientDetail.name, workplace: workplace.workplace_name, date: newBooking.date, time: newBooking.start_time, bookingId: newBooking.id }
			Users.hasOne(DrDelegate, { foreignKey: "staff_id" });
			DrDelegate.belongsTo(Users, { foreignKey: "staff_id" });
			let delegateList: any = await DrDelegate.findAll({
				where: { doctor_id: newBooking.doctor_id, workplaces_id: newBooking.workplace_id, active_workplace: true },
				attributes: [
					["staff_id", "staff_id"],
					[fn("", col("contact_number")), "contact_number"],
				],
				include: [
					{
						model: Users,
						attributes: []
					}
				],
				raw: true,
			});

			let contactList: any = [];

			let delegateListPromise = await delegateList.map((singleDelegate: any) => {
				contactList.push(singleDelegate.contact_number);
			});

			await Promise.all(delegateListPromise)
			let delegateDynamicData = { patientName: patientDetail.name, doctorName: doctorDetail.name, workplace: workplace.workplace_name, date: newBooking.date, time: newBooking.start_time, bookingId: newBooking.id }
			await Promise.all([new Notifications().sendNotification("PATIENT_APPOINTMENT_RESCHEDULE_REQUEST", patientDynamicData, { contact_number: [patientDetail.contact_number] }),
			new Notifications().sendNotification("DOCTOR_APPOINTMENT_RESCHEDULE_REQUEST", doctorDynamicData, { contact_number: [doctorDetail.contact_number] }),
			new Notifications().sendNotification("DELEGATE_APPOINTMENT_RESCHEDULE", delegateDynamicData, { contact_number: contactList })
			]);

			return { msg: "Appointment ReScheduled Successfully" };
		})
	}

	async getVisitedDoctorList(patient_id: number, limit: number, offset: number) {
		dr_Workplaces.hasOne(DrPatientAppoiment, { foreignKey: "workplace_id" });
		DrPatientAppoiment.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasOne(DrPatientAppoiment, { foreignKey: "doctor_id" });
		DrPatientAppoiment.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrUsers, { foreignKey: "doctor_id" });
		DrUsers.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

		let visitedDoctors = await DrPatientAppoiment.findAll({
			attributes: [
				["id", "booking_id"],
				["workplace_id", "workplace_id"],
				["doctor_id", "doctor_id"],
				["date", "date"],
				["start_time", "start_time"],
				["end_time", "end_time"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "doctor_name"],
				[fn("", col("profile_image")), "doctor_profile_image"],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("experience")), "experience"],
				[fn("", col("consultation_fee")), "consultation_fee"],
				[fn("", col("medical_convention")), "medical_convention"],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
			],
			where: {
				patient_id: patient_id,
				status: {
					[Op.like]: `%Completed%`,
				},
				is_cancelled: 0,
			},
			include: [
				{
					model: dr_Workplaces,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
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
									attributes: [],
								},
							],
						},
					],
				},
			],
			raw: true,
			limit: limit,
			offset: offset,
			order: [["date", "DESC"], ["end_time", "DESC"]],
			group: ['doctor_id']
		});

		if (visitedDoctors.length > 0) {
			let addprofileImagePromises: any[] = [];
			for (let doctors of visitedDoctors) {
				addprofileImagePromises.push(this.addProfileImageForDocOnAppoinments(doctors, patient_id))
			}
			visitedDoctors = await Promise.all([...addprofileImagePromises]);
		}

		return { visitedDoctors, limit, offset };
	}

	async getAppBasedMedicalHistory(patient_id: number, limit: number, offset: number) {
		let { appointments } = await this.getAllPrescrptionList(patient_id, limit, offset) as any;
		return { appointments, limit, offset };
	}

	async addMinorDetails(body: any, parent_id: number, isReturnId: boolean = false) {
		try {
			let userId;
			const patientRoleId: any = await Roles.findOne({
				where: {
					role: "Patient",
				},
			});
			const max = await Users.max("id");
			userId = isNaN(max) ? 1 : max + 1;
			body.id = userId;
			body.default_role = patientRoleId.id;
			body.is_minor_account = 1;
			body.parent_id = parent_id;

			const userSaved = await Users.upsert(body);
			new UserRoleService().upsertUserRole({
				role_id: patientRoleId.id,
				user_id: userId,
				verify_account: 1,
				status_code: StatusCode.Verified,
			});

			//adding address here
			delete body["id"];
			const patientUserSave = await PatientUser.upsert({
				id: null,
				user_id: userId,
				blood_group: body.blood_group,
				address_id: null,
			});

			if (patientUserSave && body.document_type) {
				let userIdentity: any = await Identity.findOne({
					where: { user_id: userId },
					raw: true,
				});
				// add identiy entry
				let docDetails: any = { type: body.document_type, number: body.document_number, };
				if (userIdentity) {
					await Identity.update(docDetails, { where: { user_id: userId } });
				} else {
					docDetails.user_id = userId;
					await Identity.create(docDetails);
				}
			}

			await new UserService().updateProfileSetup(userId, RolesEnum.Patient);
			if (isReturnId) {
				return userId
			}
			else {
				return { message: "Minor account linked." };
			}
		} catch (error) {
			throw new BadRequestError("Issue while adding Permissions : " + error);
		}
	}

	async minorList(parent_id: number) {
		Users.hasOne(PatientUser, { foreignKey: "user_id" });
		PatientUser.belongsTo(Users, { foreignKey: "user_id" })

		Identity.hasOne(Users, { foreignKey: "id" });
		Users.belongsTo(Identity, { foreignKey: "id", targetKey: "user_id" });

		Users.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });

		const minorAccountsList: any = await Users.findAll({
			where: {
				parent_id: parent_id,
			},
			include: [
				{
					model: PatientUser,
					attributes: [],
				},
				{
					model: Identity,
					attributes: [],
					required: true,
				},
				{
					model: UserRole,
					attributes: [],

				},
			],
			attributes: [
				"id",
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "full_name"],
				"gender", "birth_date",
				[fn("", col("blood_group")), "blood_group"],
				"updated_at",
				"profile_image",
				"new_profile_image",
				"default_role",
				[fn("", col("type")), "document_type"],
				[fn("", col("number")), "document_number"],
				[fn("", col("active_status")), "active_status"]
			],
			order: [['updated_at', 'desc']],
			raw: true,
		});
		let sendDetailData: any = []
		let sendDataPromise = await minorAccountsList.map(async (singleData: any) => {
			const profile_image_name = singleData.new_profile_image || singleData.profile_image;
			if (!!profile_image_name) {
				singleData.profile_image = await new FileService().getProfileImageLink(
					singleData.id,
					singleData.default_role,
					profile_image_name
				);
			}

		});
		await Promise.all(sendDataPromise);
		return minorAccountsList;
	}


	async getMinorDetails(minor_id: number) {
		if (!minor_id) {
			throw new Error("Please select proper minor account");
		}

		Users.hasOne(PatientUser, { foreignKey: "user_id" });
		PatientUser.belongsTo(Users, { foreignKey: "user_id" });
		Users.hasOne(Identity, { foreignKey: "user_id" });
		Identity.belongsTo(Users, { foreignKey: "user_id" })

		const result: any = await Users.findOne({
			where: { id: minor_id },
			include: [
				{
					model: PatientUser,
					attributes: [],
				},
				{
					model: Identity,
					attributes: [],
				}
			],
			attributes: ["id", "first_name", "last_name", "middle_name", "gender", "birth_date", [fn("", col("blood_group")), "blood_group"], [fn("", col("type")), "type"], [fn("", col("number")), "number"], "default_role", "profile_image", "new_profile_image"],
			raw: true
		});

		if (!result) {
			throw new Error("Minor details not found");
		}
		const profile_image_name = result.new_profile_image || result.profile_image;
		if (!!profile_image_name) {
			result.profile_image = await new FileService().getProfileImageLink(
				result.id,
				result.default_role,
				profile_image_name
			);
		}

		return result;
	}

	async editAccount(body: any) {
		let result = await Utils.setTransaction(async () => {
			try {
				let userId = body.minor_id;
				let patientExists: any = null;
				const user: any[] = await Users.findAll({
					where: { id: userId },
					raw: true,
				});
				if (user.length > 0) {

					Users.update(
						{
							first_name: body.first_name,
							last_name: body.last_name,
							middle_name: body.middle_name,
							birth_date: body.birth_date,
							gender: body.gender,
						},
						{
							where: {
								id: userId,
							},
						}
					);
					patientExists = await this.isPatientExists(userId);
					const patientUserSave = await PatientUser.update({
						blood_group: body.blood_group,
						address_id: null,
					}, {
						where: {
							user_id: userId,
						},
					});
					if (patientUserSave) {
						let userIdentity: any = await Identity.findOne({
							where: { user_id: userId },
							raw: true,
						});
						// add identiy entry
						let docDetails: any = { type: body.document_type, number: body.document_number, };
						if (userIdentity) {
							await Identity.update(docDetails, { where: { user_id: userId } });
						} else {
							docDetails.user_id = userId;
							await Identity.create(docDetails);
						}

					}
					if ('status' in body) {
						await UserRole.update({ active_status: body.status }, { where: { user_id: userId } });
					}
					return { message: "Minor account edited Successfully" };
				}
				else {
					throw new NotFoundError("Minor account not found");
				}

			} catch (error) {
				throw new BadRequestError("Issue while editing minor account : " + error);
			}
		});
		return result;
	}

	async updateminorAccountStatus(minor_id: number, status: number) {
		try {
			await UserRole.update({ active_status: status }, { where: { user_id: minor_id } });

			return { message: `Minor account ${status ? 'activated' : 'diactivated'} Successfully` };


		} catch (error) {
			throw new BadRequestError("Issue while changing minor account status : " + error);
		}
	}

	async isUserExists(
		contact_number: string,
	): Promise<any> {
		Users.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });
		const searchCondition: any = { 'contact_number': contact_number };

		const userExists: any = await Users.findOne({
			where: searchCondition,
			attributes: [
				"id",
				[fn("", col("role_id")), "role_id"],

			],
			include: [
				{
					model: UserRole,
					attributes: [],
					required: true,
					where: {
						role_id: RolesEnum.Patient,
						active_status: 1,
						status_code: {
							[Op.in]: [StatusCode.Verified, StatusCode.Unverified_edit],
						},
					},
				}
			],
			raw: true,
		});
		return userExists;
	}

	async saveLinkAccountDetails(body: any, user: any, linkToAccountId: number) {
		try {
			let user_id: number = user.id;
			let linkAccountObj: any = {
				requested_by_user_id: user_id,
				requested_to_user_id: linkToAccountId,
				manage_their_account: body.manage_their_account,
				manage_your_account: body.manage_your_account,
				manage_their_medical_history: body.manage_their_medical_history,
				manage_your_medical_history: body.manage_your_medical_history,
				manage_their_minor_account: body.manage_their_minor_account,
				manage_your_minor_account: body.manage_your_minor_account,
			};

			await PatientLinkedAccount
				.findOne({
					where: {
						[Op.or]: [
							{
								[Op.and]: [
									{ requested_by_user_id: user_id },
									{ requested_to_user_id: linkToAccountId }
								]
							},
							{
								[Op.and]: [
									{ requested_by_user_id: linkToAccountId },
									{ requested_to_user_id: user_id }
								]
							}
						]

					}
				})
				.then(async (obj: any) => {
					await PatientLinkedAccountTemprory
						.findOne({
							where: {
								[Op.or]: [
									{
										[Op.and]: [
											{ requested_by_user_id: user_id },
											{ requested_to_user_id: linkToAccountId }
										]
									},
									{
										[Op.and]: [
											{ requested_by_user_id: linkToAccountId },
											{ requested_to_user_id: user_id }
										]
									}
								]

							}
						})
						.then(async (isexist: any) => {
							if (!!obj) {
								linkAccountObj.is_edited = IsEdited.Yes;
								linkAccountObj.linked_account_id = obj.id;
							}
							if (isexist) {
								return PatientLinkedAccountTemprory.update({ ...linkAccountObj, is_edited: IsEdited.Yes }, {
									where: { id: isexist.id }
								});
							}
							else {
								await PatientLinkedAccountTemprory.create(linkAccountObj);

								//send notification
								let dynamicData = { patientName: `${user.first_name} ${user.last_name}` };
								await new Notifications().sendNotification("PATIENT_ACCOUNT_LINK_REQUEST_RECEIVED", dynamicData, { contact_number: [body.phone_number] });

							}
						})
				})

			return { message: "Link request send." };
		} catch (error) {
			throw new BadRequestError("Issue while sending link : " + error);
		}
	}

	async linkedList(user_id: number) {
		const alreadyLinkedList = await sequelize.query(
			`SELECT patient_linked_account.id, patient_linked_account.requested_by_user_id, patient_linked_account.requested_to_user_id, patient_linked_account.is_edited,patient_linked_account.manage_their_account,patient_linked_account.manage_your_account,patient_linked_account.manage_their_medical_history,patient_linked_account.manage_your_medical_history,patient_linked_account.manage_their_minor_account,patient_linked_account.manage_your_minor_account, ( SELECT IF (requested_to_user_id = ${user_id} , byUser.contact_number, toUser.contact_number ) ) AS contact_number, ( SELECT IF (requested_to_user_id = ${user_id} , CONCAT(byUser.first_name, " ",byUser.last_name), CONCAT(toUser.first_name, " ",toUser.last_name) ) ) AS full_name, patient_linked_account.updatedAt FROM patient_linked_account AS patient_linked_account LEFT OUTER JOIN users AS toUser ON patient_linked_account.requested_to_user_id = toUser.id LEFT OUTER JOIN users AS byUser ON patient_linked_account.requested_by_user_id = byUser.id WHERE (patient_linked_account.requested_by_user_id = ${user_id} OR patient_linked_account.requested_to_user_id = ${user_id}) ORDER BY patient_linked_account.updatedAt DESC;`,
			{
				type: QueryTypes.SELECT
			}
		);
		let sendData: any = [];
		let alreadyLinkedListPromise = await alreadyLinkedList.map(async (singelData: any) => {

			if (user_id == singelData.requested_to_user_id) {
				let switchedData: any = {
					manage_their_account: singelData.manage_your_account,
					manage_your_account: singelData.manage_their_account,
					manage_their_medical_history: singelData.manage_your_medical_history,
					manage_your_medical_history: singelData.manage_their_medical_history,
					manage_their_minor_account: singelData.manage_your_minor_account,
					manage_your_minor_account: singelData.manage_their_minor_account,
				}
				sendData.push({ ...singelData, ...switchedData });
			}
			else {
				sendData.push({ ...singelData })
			}
		})
		await Promise.all(alreadyLinkedListPromise)
		return sendData;
		// // Users.hasMany(PatientLinkedAccount, { foreignKey: "requested_to_user_id", as: 'toUser' });
		// PatientLinkedAccount.belongsTo(Users, { foreignKey: "requested_to_user_id", targetKey: 'id', as: 'toUser' });
		// // Users.hasMany(PatientLinkedAccount, { foreignKey: "requested_by_user_id", as: 'byUser' });
		// PatientLinkedAccount.belongsTo(Users, { foreignKey: "requested_by_user_id", targetKey: 'id', as: 'byUser' });


		// const requestList: any = await PatientLinkedAccount.findAll({
		// 	attributes: [
		// 		"id",
		// 		"requested_by_user_id",
		// 		"requested_to_user_id",
		// 		"is_edited",
		// 		// "is_active_link",

		// 		[sequelize.literal(`( SELECT IF (requested_to_user_id = ${user_id} , toUser.contact_number, byUser.contact_number ) )`), 'contact_number'],

		// 		[sequelize.literal(`( SELECT IF (requested_to_user_id = ${user_id} , CONCAT(toUser.first_name, " ",toUser.last_name), CONCAT(byUser.first_name, " ",byUser.last_name) ) )`), 'full_name'],
		// 		"updatedAt",
		// 	],
		// 	include: [
		// 		{
		// 			model: Users,
		// 			attributes: [],
		// 			as: 'toUser'
		// 		},
		// 		{
		// 			model: Users,
		// 			attributes: [],
		// 			as: 'byUser'
		// 		}
		// 	],
		// 	where: {
		// 		[Op.or]: [
		// 			{ requested_by_user_id: user_id },
		// 			{ requested_to_user_id: user_id }
		// 		]
		// 	},
		// 	order: [['updatedAt', 'desc']],
		// 	raw: true,
		// });
	}


	async getRequestList(user_id: number, by_from_user: string) {

		Users.hasMany(PatientLinkedAccountTemprory, { foreignKey: by_from_user == "send" ? "requested_to_user_id" : "requested_by_user_id" });
		PatientLinkedAccountTemprory.belongsTo(Users, { foreignKey: by_from_user == "send" ? "requested_to_user_id" : "requested_by_user_id" });

		// const notInArray = by_from_user == "send" ? [LinkStatus.Pending] : [LinkStatus.Pending, LinkStatus.Cancelled]

		// const listTypeQuery = listType == "Pending" ? [{ status: LinkStatus.Pending }] : (listType == "ActionTaken" ? [{ status: { [sequelize.Op.notIn]: notInArray } }] : listType == "Accepted" ? [{ status: LinkStatus.Accepted }, { is_active_link: LinkActiveStatus.Active }] : []);

		const userQuery = by_from_user == "send" ? [{ requested_by_user_id: user_id }] : [{ requested_to_user_id: user_id }]
		const requestList: any = await PatientLinkedAccountTemprory.findAll({
			attributes: [
				"id",
				"requested_by_user_id",
				"requested_to_user_id",
				"is_edited",
				// "is_active_link",
				[fn("", col("contact_number")), "contact_number"],
				[
					fn("CONCAT", col("first_name"), " ", col("last_name")),
					"full_name",
				],
				"updatedAt"
			],
			include: [
				{
					model: Users,
					attributes: [],
				}
			],
			where: {
				[Op.and]: [
					...userQuery,
					// ...listTypeQuery
				]
			},
			order: [['updatedAt', 'desc']],
			raw: true,
		});
		return requestList;
	}

	async linkRequestAction(body: any, user: any) {
		try {
			PatientLinkedAccount.update({ status: body.linkAction, is_active_link: body.linkAction == LinkStatus.Accepted ? LinkActiveStatus.Active : LinkActiveStatus.Inactive }, { where: { id: body.link_id } });
			if (body.linkAction == LinkStatus.Accepted) {
				// let tempData: any = await PatientLinkedAccountTemprory.findOne({
				// 	where: {id: body.id}
				// })
				await PatientLinkedAccountTemprory
					.findOne({
						where: { id: body.link_id }
					})
					.then(async (isexist: any) => {

						if (isexist) {
							let notificationUserId: number = isexist.requested_by_user_id;
							delete isexist.id;
							if (isexist.linked_account_id) {
								await PatientLinkedAccount.update({ ...isexist, is_edited: IsEdited.Yes }, {
									where: { id: isexist.linked_account_id }
								});
							}
							else {

								await PatientLinkedAccount.create(isexist);
							}
							await PatientLinkedAccountTemprory.destroy({
								where: { id: body.link_id },
							});

							//send notification
							let userDetail: any = await Users.findOne({
								where: { id: notificationUserId }
							})
							let dynamicData = { patientName: `${user.first_name} ${user.last_name}` };
							await new Notifications().sendNotification("PATIENT_ACCOUNT_LINK_REQUEST_ACCEPTED", dynamicData, { contact_number: [userDetail.contact_number] });


							return {
								msg: "Link request accepted.",
							};
						}
						return {
							msg: "Unable to accpet the Link request.",
						};
					})
				return {
					msg: "Link request accepted.",
				};
			}
			else {
				let notificationUserId: any = await PatientLinkedAccountTemprory.findOne({
					where: { id: body.link_id },
					attributes: [
						"requested_by_user_id"
					]
				});
				await PatientLinkedAccountTemprory.destroy({
					where: { id: body.link_id },
				});

				let userDetail: any = await Users.findOne({
					where: { id: notificationUserId.requested_by_user_id }
				})
				let dynamicData = { patientName: `${user.first_name} ${user.last_name}` };
				await new Notifications().sendNotification("PATIENT_ACCOUNT_LINK_REQUEST_DECLINED", dynamicData, { contact_number: [userDetail.contact_number] });


				return {
					msg: "Link request declined.",
				};
			}


		} catch (error) {
			throw new BadRequestError("Issue while taking action : " + error);
		}
	}

	async cancelRequest(body: any) {
		try {
			// PatientLinkedAccount.update({ status: body.linkAction }, { where: { id: body.link_id } });
			await PatientLinkedAccountTemprory.destroy({
				where: { id: body.link_id },
			});
			return { msg: "Link request Cancelled" }
		} catch (error) {
			throw new BadRequestError("Issue while cancelling the link request : " + error);
		}
	}

	async unlinkLink(body: any, user: any) {
		try {
			// PatientLinkedAccount.update({ is_active_link: LinkActiveStatus.Inactive }, { where: { id: body.link_id } });
			let notificationUserId: any = await PatientLinkedAccount.findOne({
				where: { id: body.link_id },
				attributes: [
					"requested_by_user_id",
					"requested_to_user_id",
				]
			});
			await PatientLinkedAccount.destroy({
				where: {
					id: body.link_id,
				}
			})

			let userDetail: any = await Users.findOne({
				where: { id: notificationUserId.requested_by_user_id == user.id ? notificationUserId.requested_to_user_id : notificationUserId.requested_by_user_id }
			})
			let dynamicData = { patientName: `${user.first_name} ${user.last_name}` };
			await new Notifications().sendNotification("PATIENT_ACCOUNT_UNLINKED", dynamicData, { contact_number: [userDetail.contact_number] });




			return { msg: "Account unlinked successfully." }
		} catch (error) {
			throw new BadRequestError("Issue while unlinking : " + error);
		}
	}

	async updateDetails(body: any, link_id: number, user_id: number, isAdmin: boolean = false) {
		try {
			let linkAccountObj: any = {
				requested_by_user_id: user_id,
				manage_their_account: body.manage_their_account,
				manage_your_account: body.manage_your_account,
				manage_their_medical_history: body.manage_their_medical_history,
				manage_your_medical_history: body.manage_your_medical_history,
				manage_their_minor_account: body.manage_their_minor_account,
				manage_your_minor_account: body.manage_your_minor_account,
				is_edited: IsEdited.Yes,
				linked_account_id: link_id

			};

			await PatientLinkedAccount
				.findOne({
					where: { id: link_id }
				})
				.then(async (obj: any) => {
					linkAccountObj.requested_to_user_id = obj.requested_by_user_id == user_id ? obj.requested_to_user_id : obj.requested_by_user_id;
					let responseData = isAdmin ? false : await this.checkIsRequestToSend(obj, linkAccountObj)
					if (responseData) {

						return PatientLinkedAccountTemprory
							.findOne({
								where: { linked_account_id: link_id }
							})
							.then((isexist: any) => {
								if (isexist) {
									return PatientLinkedAccountTemprory.update({ ...linkAccountObj, is_edited: IsEdited.Yes }, {
										where: { id: isexist.id }
									});
								}
								else {
									return PatientLinkedAccountTemprory.create(linkAccountObj);

								}
							})
					}
					else {

						return PatientLinkedAccount.update(linkAccountObj, { where: { id: link_id } });
					}

				})


			return { message: "Link details updated." };

		} catch (error) {
			throw new BadRequestError("Issue while sending link : " + error);
		}
	}

	async updateMultipleDetails(body: any) {
		let permissionPromise = await body.permissions.map(async (singeData: any) => {
			await this.updateDetails(singeData, singeData.linked_id, body.patient_id, true);
		});
		await Promise.all(permissionPromise);
		return { message: "Link details updated." };

	}

	private async checkIsRequestToSend(existingData: any, newData: any) {
		if (existingData.requested_by_user_id == newData.requested_by_user_id) {
			if (existingData.manage_their_account != newData.manage_their_account || existingData.manage_their_medical_history != newData.manage_their_medical_history || existingData.manage_their_minor_account != newData.manage_their_minor_account) {
				return true;
			}
			else {
				return false;
			}
		}
		else {
			if (existingData.manage_your_account != newData.manage_their_account || existingData.manage_your_medical_history != newData.manage_their_medical_history || existingData.manage_your_minor_account != newData.manage_their_minor_account) {
				return true;
			}
			else {
				return false;
			}
		}
	}


	async getDetails(link_id: number, user_id: number, isForRequested: boolean = false) {
		if (!link_id) {
			throw new Error("Please select proper link");
		}

		let result: any = {}

		if (isForRequested) {
			result = await PatientLinkedAccountTemprory.findOne({
				where: { id: link_id }, attributes: ["id", "requested_to_user_id", "manage_their_account",
					"manage_your_account",
					"manage_their_medical_history",
					"manage_your_medical_history",
					"manage_their_minor_account",
					"manage_your_minor_account"]
			});
		}
		else {

			result = await PatientLinkedAccount.findOne({
				where: { id: link_id }, attributes: ["id", "requested_to_user_id", "manage_their_account",
					"manage_your_account",
					"manage_their_medical_history",
					"manage_your_medical_history",
					"manage_their_minor_account",
					"manage_your_minor_account"]
			});
		}

		if (!result) {
			throw new Error("Link not found");
		}
		if (user_id == result.requested_to_user_id) {
			let switchedData: any = {
				id: result.id,
				manage_their_account: result.manage_your_account,
				manage_your_account: result.manage_their_account,
				manage_their_medical_history: result.manage_your_medical_history,
				manage_your_medical_history: result.manage_their_medical_history,
				manage_their_minor_account: result.manage_your_minor_account,
				manage_your_minor_account: result.manage_their_minor_account,
			}
			return switchedData;
		}
		else {
			return result;
		}

	}

	async addDrRatingAndReview(ratingObj: any, patient_id: number) {
		await RatingReview.create({
			...ratingObj,
			patient_id
		});
		return { msg: ResponseMessageEnum.RATING_SUCCESS };
	}

	async getAllDoctorRatingAndReviews(doctor_id: number, limit: number, offset: number) {
		Users.hasOne(RatingReview, { foreignKey: "patient_id" });
		RatingReview.belongsTo(Users, { foreignKey: "patient_id" });

		let patientsRatingAndReviews = await RatingReview.findAll({
			where: {
				doctor_id: doctor_id
			},
			attributes: [
				[fn("", col("first_name")), "first_name"],
				"rating",
				"review",
				"updatedAt"
			],
			include: [
				{
					model: Users,
					attributes: []
				}
			],
			raw: true,
			limit: limit,
			offset: offset,
			order: [['updatedAt', 'desc']]
		});

		return { patientReviews: patientsRatingAndReviews, limit, offset };
	}

	async getDoctorAverageRating(doctor_id: number) {
		let ratingObj: any = await RatingReview.findAll({
			attributes: [
				[fn("AVG", col("rating")), "rating"],
			],
			where: {
				doctor_id: doctor_id
			},
			raw: true,
			group: ["doctor_id"]
		});

		let ratingCount = await RatingReview.count({
			where: {
				doctor_id: doctor_id
			}
		});

		let avgRating = ratingObj && ratingObj[0] ? ratingObj[0].rating : 0;
		return { avgRating, ratingCount };
	}



	async cancelPharmacyOrder(id: number, order_id: string, is_for_cancel: boolean = false) {
		await Utils.setTransaction(async () => {
			let requestedOrder = await new PharmacyService().generateOriginalPharmacyOrder(
				id,
				true,
				true,
				is_for_cancel
			);
			let createCancleOrder: any = { order_id: order_id, order_request_pharmacy_id: requestedOrder.id, pharmacy_id: null, cancel_reason: "Order cancelled by patient." }
			await PharmacyCancelOrder.create(
				{ ...createCancleOrder },
				{ raw: true }
			);
		});
		return true;
	}

	async cancelLabOrder(id: number, order_id: string, is_for_cancel: boolean = false) {
		await Utils.setTransaction(async () => {
			let requestedOrder = await new LaboratoryService().generateOriginalLabOrder(
				id,
				true,
				true,
				is_for_cancel
			);
			let createCancleOrder: any = { order_id: order_id, order_request_lab_id: requestedOrder.id, lab_id: null, cancel_reason: "Order cancelled by patient." }
			await LabCancelOrder.create(
				{ ...createCancleOrder },
				{ raw: true }
			);
		});
		return true;
	}


	async cancelOrder(order_id: string, isLab: boolean = false) {
		if (isLab) {
			let currentOrders: any = await TemporaryRequestLab.findOne(
				{
					where: { order_id: order_id }
				}
			);
			if (currentOrders) {
				await this.cancelLabOrder(currentOrders.id, currentOrders.order_id, true)
				return { msg: "Order cancelled" }
			}
		}
		else {

			let currentOrders: any = await TemporaryRequestPharmacy.findOne(
				{
					where: { order_id: order_id }
				}
			);
			if (currentOrders) {
				await this.cancelPharmacyOrder(currentOrders.id, currentOrders.order_id, true)
				return { msg: "Order cancelled" }
			}
		}
		throw new BadRequestError("Order does not exist");

	}
}
