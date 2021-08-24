import PharmaWorkPlace from "../../../models/pharmacy_workplaces.model";
import { get } from "config";
const secrets = get("APP");
const { USER_VERIFICATION_LINK, AWS_FILE_UPLOAD_LINK }: any = secrets;
import Users from "../../../models/users.model";
import UserRole from "../../../models/user_role.model";
import Identity from "../../../models/identity.model";
import PharmacyCancelOrder from "../../../models/pharmacy_cancel_order.model";
import { UserService } from "../user/user.service";
import { Notifications, Utils } from "../../../helpers";
import { ResponseMessageEnum } from "../../../constants/constant.enum";
import PharmacyWorkplaceUsers from "../../../models/pharmacy_workplace_users.model";
import { AddressService } from "../../shared/address.service";
import { fn, col, Op, Sequelize } from "sequelize";
import PharmacyWorkplaces from "../../../models/pharmacy_workplaces.model";
import Address from "../../../models/address.model";
import { RolesEnum } from "../../../constants/roles.enum";
import { EmailServer } from "../../../helpers/EmailService";
import { StatusCode } from "../../../constants/status_code.enum";
import TemporaryRequestPharmacy from "../../../models/temporary_request_pharmacy.model";
import TemporaryPatientOrderPharmacy from "../../../models/temporary_patient_order_pharmacy.model";
import PatientUser from "../../../models/patient_user.model";
import TemporaryRxImmunisation from "../../../models/temporary_rx_immunisation.model";
import dr_Workplaces from "../../../models/dr_workplaces.model";
import DrPatientAppoiment from "../../../models/dr_patient_appoiment.model";
import DrSpeciality from "../../../models/dr_speciality.model";
import Speciality from "../../../models/specialities_speciality.model";
import { FileService } from "../../shared/file.service";
import TemporaryOrderSummary from "../../../models/temporary_order_summary.model";
import { BadRequestError } from "routing-controllers";
import sequelize from "../../../db/sequalise";
const { QueryTypes } = require("sequelize");
import { PatientService } from "../patient/patient.service";
import RequestPharmacy from "../../../models/request_pharmacy.model";
import PatientOrderPharmacy from "../../../models/patient_order_pharmacy.model";
import PharmacyRxImmunisation from "../../../models/pharmacy_rx_immunisation.model";
import OrderSummary from "../../../models/order_summary.model";
import UserUploads from "../../../models/user_uploads.model";
import UserScannedDocument from "../../../models/user_scanned_prescriptions";
import TemporaryPatientOrderLab from "../../../models/temporary_patient_order_lab.model";
import NotificationSetting from "../../../models/notification_setting.model";
import { AppManagementService } from "../../admin/appManagement/appManagement.service";
import Timeouts from "../../../models/timeouts.model";
import { OrderStatusEnum } from "../../../constants/order_status.enum";

export class PharmacyService {
	async removeSetupProfileDetails(idObj: any) {
		console.log("In roll back");
		if (idObj.pharmacyWorkplaces) {
			for (let i = 0; i < idObj.pharmacyWorkplaces.length; i++) {
				console.log(
					"I rolling back for workplace",
					idObj.pharmacyWorkplaces[i]
				);
				await PharmacyWorkplaceUsers.destroy({
					where: {
						workplace_id: idObj.pharmacyWorkplaces[i],
						user_id: idObj.user_id,
					},
				});

				await PharmaWorkPlace.destroy({
					where: {
						id: idObj.pharmacyWorkplaces[i],
					},
				});
			}
		}
	}

	async addWorkplacesDetails(pharmacyDetails: any, isAdmin: boolean = false) {
		if (pharmacyDetails.workplaces.length < 1) {
			throw new Error("Need to add atleast one workplace entry for Pharmacy");
		}
		const ID: any = [];
		for (let wkobj of pharmacyDetails.workplaces) {
			const { address, workplace } = wkobj;

			//add entry fist in adress filed
			const addressEntry: any = await new AddressService().addAddress(address);

			//add workplace in pharmacy_workplace
			if (isAdmin) {
				workplace.status_code = StatusCode.Verified;
			}
			const wkpResult: any = await PharmaWorkPlace.create(
				{ ...workplace, address_id: addressEntry.id },
				{ raw: true }
			);

			ID.push(wkpResult.id);
			//add user & workplace refs in pharmacy_workplace_users table
			if (!!pharmacyDetails.user_id) {
				let objForPhWkpUserRef: any = {
					workplace_id: wkpResult.id,
					user_id: pharmacyDetails.user_id,
				};

				await PharmacyWorkplaceUsers.create(objForPhWkpUserRef, { raw: true });
			}
		}
		return { pharmacyWorkplaces: ID };
	}

	async upsertSetUpProfileDetails(setUpProifleObj: any, isAdmin: boolean = false) {
		let ID: any = {};
		try {
			const { pharmacyDetails, pharmacy_drugs } = setUpProifleObj;

			const pharmacyResult: any = await this.addWorkplacesDetails(
				pharmacyDetails, isAdmin
			);

			if (!!pharmacyDetails.user_id) {
				ID.user_id = pharmacyDetails.user_id;
				let userRole = {
					user_id: pharmacyDetails.user_id,
					default_role: setUpProifleObj.user_role,
				};
				await new UserService().updateProfileSetup(pharmacyDetails.user_id, RolesEnum.Pharmacy);
			}

			ID = { ...pharmacyResult, ...ID };

			if (isAdmin && pharmacy_drugs)
				await new AppManagementService().saveUpdatePharmacyDrug(pharmacy_drugs, ID.pharmacyWorkplaces[0]);


			return {
				msg: "Pharmacy setup profile created successfully",
				pharmacyWorkplaces: ID.pharmacyWorkplaces,
			};
		} catch (error) {
			if (ID.user_id) {
				await this.removeSetupProfileDetails(ID);
			}

			throw new Error(error);
		}
	}

	async upsertPharmacyEmployeeDetails(userObj: any) {
		const {
			document_number,
			document_type,
			role_id,
			edit_profile,
			...userData
		} = userObj;
		const ID = {} as any;
		let user_id: number;
		userObj.default_role = role_id;
		const userResult: any = await Users.findOne({
			attributes: [
				"id",
				"first_name",
				"middle_name",
				"last_name",
				"contact_number",
				"birth_date",
				"gender",
				"lab_or_pharma_employement_number",
				"phone_verify",
				"password",
			],
			where: {
				id: userData.user_id,
			},
		});

		// if (!userResult) {
		// 	const max = await Users.max("id");
		// 	user_id = isNaN(max) ? 1 : max + 1;
		// 	ID["id"] = user_id;
		// } else {
		ID["id"] = userResult.id;
		// }

		try {
			// const OTP = await Utils.generateOPT();
			// userData.phone_otp = OTP;
			// userData.otp_timer = new Date();

			// const optSent = await Utils.sendMessage(
			// 	`Welcome to Cryptopill. Your verification OTP: ${OTP}`,
			// 	userData.contact_number
			// );

			let result;
			let userInfo = {
				gender: userData.gender,
				birth_date: userData.birth_date,
				default_role: role_id,
				email: userData.email,
			};
			// if (!!optSent && optSent.sid) {
			// result = await Users.upsert(
			// 	{ ...userData, ...ID, ...{ default_role: role_id } },
			// 	{
			// 		returning: true,
			// 	}
			// );

			result = await Users.update(userInfo, {
				where: {
					id: userData.user_id,
				},
			});

			// }
		} catch (error) {
			throw new Error(error);
		}

		let userIdentity: any = await Identity.findOne({
			where: { user_id: userData.user_id },
			raw: true,
		});
		// add identiy entry
		let docDetails: any = { type: document_type, number: document_number };
		if (userIdentity) {
			await Identity.update(docDetails, { where: { user_id: userData.user_id } });
		} else {
			docDetails.user_id = userData.user_id;
			await Identity.create(docDetails);
		}


		const savedUser = await this.saveUserRole(
			userData.user_id,
			role_id,
			edit_profile
		);

		return savedUser;
	}

	private async saveUserRole(
		userId: number,
		role_id: number,
		edit_profile: number
	) {
		let userRoleObj: any = {
			role_id: role_id,
			user_id: userId,
			active_status: 1,
			isWorkplaceAdmin: edit_profile,
			verify_account: 1,
			status_code: StatusCode.Verified,
		};
		const isRoleExists = await UserRole.findOne({
			where: {
				role_id: role_id,
				user_id: userId,
			},
		});
		if (!isRoleExists) {
			await UserRole.create(userRoleObj);
			const notificationObj = {
				// id: null,
				user_id: userId,
				role_id: role_id,
			};
			await NotificationSetting.upsert(notificationObj)
		}

		return { id: userId, msg: ResponseMessageEnum.SUCCESS_RECEIVED };
	}

	async removePharmacyEmployee(contact_number: string) {
		if (!contact_number) {
			throw new Error("Please entry proper contact number");
		}

		const user: any = await Users.findOne({
			attributes: ["id"],
			where: {
				contact_number: contact_number,
			},
		});

		return { msg: "user removed sucessfully" };
	}

	async getEmplyoeeDetails(user_id: number) {
		if (!user_id) {
			throw new Error("Please entry proper user id");
		}

		const result: any = await Users.findOne({
			attributes: [
				"first_name",
				"middle_name",
				"last_name",
				"contact_number",
				"birth_date",
				"gender",
				"lab_or_pharma_employement_number",
			],
			where: { id: user_id },
		});

		const identityResult: any = await Identity.findOne({
			attributes: ["type", "number"],
			where: { user_id: user_id },
		});
		if (!result) {
			throw new Error("User not found");
		}
		const user = { ...result, ...identityResult };

		return user;
	}

	async updatePharmacyEmployeeDetails(userObj: any) {
		const {
			document_number,
			document_type,
			role_id,
			edit_profile,
			...userData
		} = userObj;
		const result = await Users.upsert(
			{ ...userData },
			{
				returning: true,
			}
		);

		let userIdentity: any = await Identity.findOne({
			where: { user_id: userData.id },
			raw: true,
		});
		// add identiy entry
		let docDetails: any = { type: document_type, number: document_number };
		if (userIdentity) {
			await Identity.update(docDetails, { where: { user_id: userData.id } });
		} else {
			docDetails.user_id = userData.id;
			await Identity.create(docDetails);
		}


		if (result === undefined) {
			throw new Error("User not added succsefully");
		}

		//const savedUser = this.saveUserRole(ID.id, userData.role_id, userData.edit_profile);

		return { msg: "Employee Details update Sucessfully" };
	}

	async getPharmacyDetails(pharmacy_user: any) {
		Users.hasOne(PharmacyWorkplaceUsers, { foreignKey: "user_id" });
		PharmacyWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });

		PharmacyWorkplaces.hasOne(PharmacyWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		PharmacyWorkplaceUsers.belongsTo(PharmacyWorkplaces, {
			foreignKey: "workplace_id",
		});

		let {
			profile_information,
			user_permission,
		}: any = await this.getPharmacyUserDetails(pharmacy_user);
		const personal_information: any = {
			...profile_information,
			...user_permission,
		};
		const pharmacy_information: any = await PharmacyWorkplaceUsers.findAll({
			where: {
				user_id: pharmacy_user,
			},
			attributes: [
				"workplace_id",
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("", col("is_franchise")), "is_franchise"],
				[fn("", col("franchise_name")), "franchise_name"],
				[fn("", col("phone_number")), "pharmacy_phone_number"],
				[fn("", col("license_number")), "license_number"],
				[fn("", col("gst_number")), "gst_number"],
				[fn("", col("address_id")), "address_id"],
				[fn("", col("delivery_customer")), "delivery_customer"],

				[fn("", col("delivery_distance")), "delivery_distance"],
				[fn("", col("minimum_order_amount")), "minimum_order_amount"],
				[fn("", col("minimum_delivery_charges")), "minimum_delivery_charges"],
				[fn("", col("additional_charges")), "additional_charges"],
				[
					fn("", col("minimum_additional_charges")),
					"minimum_additional_charges",
				],
				[fn("", col("discount")), "discount"],
			],
			include: [
				{
					model: PharmacyWorkplaces,
					attributes: [],
				},
			],
			raw: true,
		});

		Identity.hasOne(PharmacyWorkplaceUsers, { foreignKey: "user_id" });
		PharmacyWorkplaceUsers.belongsTo(Identity, {
			foreignKey: "user_id",
			targetKey: "user_id",
		});

		UserRole.hasOne(PharmacyWorkplaceUsers, { foreignKey: "user_id" });
		PharmacyWorkplaceUsers.belongsTo(UserRole, {
			foreignKey: "user_id",
			targetKey: "user_id",
		});

		for (let i = 0; i < pharmacy_information.length; i++) {
			// Fetches address information
			const pharmacy_address: any = await Address.findOne({
				where: {
					id: pharmacy_information[i].address_id,
				},
				attributes: {
					exclude: ["id"],
				},
			});

			const latitude = pharmacy_address.location.coordinates[0];
			const longitude = pharmacy_address.location.coordinates[1];

			pharmacy_address.location = {};
			pharmacy_address.location.latitude = latitude;
			pharmacy_address.location.longitude = longitude;

			pharmacy_information[i].workplace = pharmacy_address;

			// Fetches employee's corresponding to the pharmacy
			const employee_details: any = await PharmacyWorkplaceUsers.findAll({
				where: {
					workplace_id: pharmacy_information[i].workplace_id,
					user_id: {
						[Op.not]: pharmacy_user,
					},
				},
				attributes: [
					["user_id", "id"],
					[fn("", col("first_name")), "first_name"],
					[fn("", col("middle_name")), "middle_name"],
					[fn("", col("last_name")), "last_name"],
					[fn("", col("email")), "email"],
					[fn("", col("gender")), "gender"],
					[fn("", col("birth_date")), "birth_date"],
					[fn("", col("contact_number")), "contact_number"],
					[
						fn("", col("lab_or_pharma_employement_number")),
						"lab_or_pharma_employement_number",
					],
					[fn("", col("type")), "document_type"],
					[fn("", col("number")), "document_number"],
					[fn("", col("isWorkplaceAdmin")), "edit_profile"],
				],
				include: [
					{
						model: Users,
						attributes: [],
					},
					{
						model: Identity,
						attributes: [],
					},
					{
						model: UserRole,
						attributes: [],
					},
				],
				raw: true,
			});

			pharmacy_information[i].employee_information = employee_details;
		}

		return { personal_information, pharmacy_information };
	}

	async getPharmacyUserDetails(user_id: any) {
		Users.hasOne(Identity, { foreignKey: "user_id" });
		Identity.belongsTo(Users, { foreignKey: "user_id" });

		const profile_information = await Identity.findOne({
			where: {
				user_id,
			},
			attributes: [
				[fn("", col("first_name")), "first_name"],
				[fn("", col("middle_name")), "middle_name"],
				[fn("", col("last_name")), "last_name"],
				[fn("", col("gender")), "gender"],
				[fn("", col("birth_date")), "birth_date"],
				[fn("", col("contact_number")), "contact_number"],
				[
					fn("", col("lab_or_pharma_employement_number")),
					"lab_or_pharma_employement_number",
				],
				[fn("", col("email")), "email"],
				[fn("", col("email_verify")), "email_verify"],
				[fn("", col("phone_verify")), "phone_verify"],

				["type", "document_type"],
				["number", "document_number"],
			],
			include: [
				{
					model: Users,
					attributes: [],
				},
			],
			raw: true,
		});

		const user_permission = await UserRole.findOne({
			where: {
				user_id,
			},
			attributes: [["isWorkplaceAdmin", "edit_profile"]],
		});

		return { profile_information, user_permission };
	}

	async updatePharmacyDetails(setUpProifleObj: any, userId: number) {
		const updateResult: any = await Utils.setTransaction(async () => {
			try {
				// will update pharmacy details in workplace tables along with address details
				const { pharmacyDetails } = setUpProifleObj;
				const pharmacyResult: any = await this.updateWorkplacesDetails(
					pharmacyDetails
				);

				await new UserService().updateProfileSetup(userId, RolesEnum.Pharmacy);
				return {
					msg: "Pharmacy setup profile updated successfully",
					pharmacyWorkplaces: pharmacyResult.pharmacyWorkplaces,
				};
			} catch (error) {
				console.error(`Error in updatePharmacyDetails ==> ${error}`);
				throw new Error(error);
			}
		});

		return updateResult;
	}

	async updateWorkplacesDetails(pharmacyDetails: any) {
		if (pharmacyDetails.workplaces.length < 1) {
			throw new Error("Need to add atleast one workplace entry for Pharmacy");
		}
		const ID: any = [];
		let notificationPromises: any[] = [];
		for (let wkobj of pharmacyDetails.workplaces) {
			console.log(wkobj, "workplace here is");
			const { address, workplace, employees = [] } = wkobj;

			let workplace_id = workplace.workplace_id;
			let address_id = address.address_id;

			delete address.address_id;
			delete workplace.workplace_id;

			//add entry first in adress filed
			let locationInfo: any = { ...address.location };
			const coordinates: number[] = [
				locationInfo.latitude,
				locationInfo.longitude,
			];
			const point = { type: "Point", coordinates: coordinates };
			address.location = point;
			await Address.update({ ...address }, { where: { id: address_id } });

			let existingRecord: any = await PharmacyWorkplaces.findOne({
				where: {
					id: workplace_id,
				},
			});

			// flow for admin verification added
			if (existingRecord.franchise_name != workplace.franchise_name) {
				workplace.new_franchise_name = workplace.franchise_name;
				workplace.status_code = StatusCode.Unverified_edit;
				delete workplace.franchise_name;
			}
			if (existingRecord.gst_number != workplace.gst_number) {
				workplace.new_gst_number = workplace.gst_number;
				workplace.status_code = StatusCode.Unverified_edit;
				delete workplace.gst_number;
			}
			if (existingRecord.license_number != workplace.license_number) {
				workplace.new_license_number = workplace.license_number;
				workplace.status_code = StatusCode.Unverified_edit;
				delete workplace.license_number;
			}

			//add workplace in pharmacy_workplace
			await PharmaWorkPlace.update(
				{ ...workplace, address_id: address_id },
				{ where: { id: workplace_id } }
			);

			ID.push(workplace_id);

			for (let i = 0; i < employees.length; i++) {
				// add employees in db
				let user = await this.AddPharmaEmployess(
					employees[i],
					RolesEnum.Pharmacy
				);

				let objForPhWkpUserRef: any = {
					workplace_id: workplace_id,
					user_id: user.id,
				};

				if (!user.exists) {
					//add user & workplace refs in pharmacy_workplace_users table
					await PharmacyWorkplaceUsers.create(objForPhWkpUserRef);
					//await Utils.creatVerficationLink(user);
				} else {
					//await Utils.creatVerficationLink(user);

					let isEmployeExists: any = await PharmacyWorkplaceUsers.findOne({
						where: { ...objForPhWkpUserRef },
						raw: true,
					});
					//check if user with workplaces exists if not add it
					if (!isEmployeExists) {
						await PharmacyWorkplaceUsers.create(objForPhWkpUserRef);
					}
				}
			}
		}
		return { pharmacyWorkplaces: ID };
	}

	async AddPharmaEmployess(emp: any, user_role: number) {
		let isEmployeeExist: any = await Users.findOne({
			where: { contact_number: emp.contact_number },
			raw: true,
		});

		if (isEmployeeExist) {
			isEmployeeExist.first_name = emp.first_name;
			isEmployeeExist.last_name = emp.last_name;
			isEmployeeExist.middle_name = emp.middle_name;
			isEmployeeExist.birth_date = emp.birth_date;
			isEmployeeExist.email = emp.email;
			isEmployeeExist.gender = emp.gender;
			isEmployeeExist.lab_or_pharma_employement_number =
				emp.lab_or_pharma_employement_number;
			await Users.upsert(isEmployeeExist);
			await Identity.update(
				{ type: emp.document_type, number: emp.document_number },
				{ where: { user_id: isEmployeeExist.id } }
			);
			return { ...isEmployeeExist, exists: true };
		}
		const usersBody: any = {
			first_name: emp.first_name,
			middle_name: emp.middle_name,
			last_name: emp.last_name,
			email: emp.email,
			gender: emp.gender,
			birth_date: emp.birth_date,
			contact_number: emp.contact_number,
			lab_or_pharma_employement_number: emp.lab_or_pharma_employement_number,
			default_role: user_role,
		};

		const user: any = await Users.create(usersBody, {
			returning: true,
		});

		const identityBody: any = {
			type: emp.document_type,
			number: emp.document_number,
			user_id: user.id,
		};
		let userData = {
			user_id: user.id,
			contact_number: emp.contact_number,
		};
		const tokenOpts = {
			expireIn: "15d",
		};
		const token = Utils.createJWTToken(userData, tokenOpts);

		let mailBody: any = {
			to: emp.email,
			subject: ResponseMessageEnum.EMAIL_VERIFICATION_SUBJECT,
			message: ResponseMessageEnum.EMAIL_VERIFICATION_MESSAGE,
			html: `<a href=${USER_VERIFICATION_LINK + "/" + token
				}>Link to Send Otp for Verfication</a>`,
		};

		let mailStatus = await new EmailServer().sendEmail(mailBody);

		await Identity.create(identityBody);

		const userRoleBody: any = {
			role_id: user_role,
			user_id: user.id,
			isWorkplaceAdmin: emp.edit_profile,
			active_status: 1,
			verify_account: 1,
			status_code: StatusCode.Verified,
		};

		await UserRole.create(userRoleBody);
		const notificationObj = {
			// id: null,
			user_id: user.id,
			role_id: user_role,
		};
		await NotificationSetting.upsert(notificationObj)

		return user;
	}

	async formatProfileImageData(order: any) {
		if (order && order.profile_image)
			order.profile_image = await new FileService().getProfileImageLink(
				order.patient_id,
				RolesEnum.Patient,
				order.profile_image
			);
		return order;
	}
	//ML3
	async getRequestedOrders(pharmacy_id: number, limit: number, offset: number) {
		TemporaryRequestPharmacy.hasMany(TemporaryPatientOrderPharmacy, {
			foreignKey: "temporary_request_pharmacy_id",
		});
		TemporaryPatientOrderPharmacy.belongsTo(TemporaryRequestPharmacy, {
			foreignKey: "temporary_request_pharmacy_id",
		});
		Users.hasOne(TemporaryPatientOrderPharmacy, { foreignKey: "patient_id" });
		TemporaryPatientOrderPharmacy.belongsTo(Users, {
			foreignKey: "patient_id",
		});
		Users.hasOne(PatientUser, { foreignKey: "user_id" });
		PatientUser.belongsTo(Users, { foreignKey: "user_id" });
		Address.hasOne(PatientUser, { foreignKey: "address_id" });
		PatientUser.belongsTo(Address, { foreignKey: "address_id" });

		let requestOrders: any[] = await TemporaryPatientOrderPharmacy.findAll({
			where: {
				pharmacy_id: pharmacy_id,
			},
			attributes: [
				["order_id", "order_id"],
				["temporary_request_pharmacy_id", "request_pharmacy_id"],
				["pharmacy_id", "pharmacist_id"],
				["prescription_type", "prescription_type"],
				[fn("", col("order_type")), "order_type"],
				[fn("", col("order_status")), "order_status"],
				["createdAt", "createdAt"],
				["patient_id", "patient_id"],
				[
					fn("CONCAT", col("first_name"), " ", col("last_name")),
					"patient_name",
				],
				[fn("", col("gender")), "gender"],
				[fn("", col("birth_date")), "birth_date"],
				[fn("", col("profile_image")), "profile_image"],
				[fn("", col("contact_number")), "contact_number"],
				[fn("", col("address_id")), "address_id"],
				[fn("ST_X", col("location")), "latitude"],
				[fn("ST_Y", col("location")), "longitude"],
				[fn("", col("locality")), "locality"],
				[fn("", col("address")), "address"],
				[fn("", col("city")), "city"],
				[fn("", col("pincode")), "pincode"],
			],
			include: [
				{
					model: TemporaryRequestPharmacy,
					attributes: [],
					where: {
						order_type: "request",
						is_cancelled: 0,
						accept_order_pharmacy: 0, // For those Req orders that are accept by pharmacy side only
						// order_status_code: 5
					},
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: PatientUser,
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
			raw: true,
			group: ["patient_id", "prescription_type", "order_id"],
			order: [["createdAt", "DESC"]],
			limit: limit,
			offset: offset,
		});

		if (requestOrders.length > 0) {
			let getProfileImgPromises: any[] = [];
			for (let order of requestOrders) {
				getProfileImgPromises.push(this.formatProfileImageData(order));
			}
			requestOrders = await Promise.all(getProfileImgPromises);
		}
		return { requestedOrders: requestOrders, limit: limit, offset: offset };
	}

	async formatPrescibeMedicineData(prescriptions: any) {
		prescriptions.specialities = prescriptions.specialities
			? prescriptions.specialities.split(",")
			: [];

		let medicines = await TemporaryRxImmunisation.findAll({
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
				"is_substituted",
				"substituted",
				"accepted_risk",
				"drug_unit",
				"packaging",
				"mrp",
				"is_pharmacy_selected",
			],
			where: {
				temporary_patient_order_pharmacy_id: prescriptions.prescribed_order_id,
			},
			raw: true,
		});

		prescriptions.medicines = medicines;
		return prescriptions;
	}

	async getElectronicPrescriptions(request_id: number) {
		DrPatientAppoiment.hasOne(TemporaryPatientOrderPharmacy, {
			foreignKey: "booking_id",
		});
		TemporaryPatientOrderPharmacy.belongsTo(DrPatientAppoiment, {
			foreignKey: "booking_id",
		});
		dr_Workplaces.hasOne(DrPatientAppoiment, { foreignKey: "workplace_id" });
		DrPatientAppoiment.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasOne(TemporaryPatientOrderPharmacy, { foreignKey: "doctor_id" });
		TemporaryPatientOrderPharmacy.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

		let orderedPrescriptions = await TemporaryPatientOrderPharmacy.findAll({
			where: {
				temporary_request_pharmacy_id: request_id,
				prescription_type: "electronic",
			},
			attributes: [
				["order_id", "order_id"],
				["id", "prescribed_order_id"],
				["prescription_id", "prescription_id"],
				["prescription_type", "prescription_type"],
				["patient_id", "patient_id"],
				["booking_id", "booking_id"],
				["doctor_id", "doctor_id"],
				["temporary_request_pharmacy_id", "temporary_request_pharmacy_id"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "doctor_name"],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
				[fn("", col("date")), "date"],
				[fn("", col("end_time")), "end_time"],
			],
			include: [
				{
					model: DrPatientAppoiment,
					attributes: [],
					include: [
						{
							model: dr_Workplaces,
							attributes: [],
						},
					],
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
			],
			raw: true,
			group: ["prescription_id"],
		});

		if (orderedPrescriptions.length > 0) {
			let promises: any[] = [];
			for (let prescription of orderedPrescriptions) {
				promises.push(this.formatPrescibeMedicineData(prescription));
			}
			let orderedPrescriptionPromises: any = await Promise.all(promises);
			let [order_summary, pharmacy_delivery_info] = await Promise.all([
				TemporaryOrderSummary.findOne({
					where: { temporary_request_pharmacy_id: request_id },
					raw: true,
				}),
				this.pharmacyDeliveryInfoFromOrderRequest(request_id),
			]);
			return {
				prescriptions: orderedPrescriptionPromises,
				order_summary,
				pharmacy_delivery_info,
			};
		}

		return { msg: "No Prescription Data found" };
	}

	async pharmacyDeliveryInfoFromOrderRequest(request_id: number) {
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

		return TemporaryRequestPharmacy.findOne({
			where: {
				id: request_id,
			},
			attributes: [
				[fn("", col("delivery_customer")), "delivery_customer"],
				[fn("", col("delivery_distance")), "delivery_distance"],
				[fn("", col("minimum_order_amount")), "minimum_order_amount"],
				[fn("", col("minimum_delivery_charges")), "minimum_delivery_charges"],
				[fn("", col("additional_charges")), "additional_charges"],
				[
					fn("", col("minimum_additional_charges")),
					"minimum_additional_charges",
				],
				[fn("", col("discount")), "discount"],
			],
			include: [
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
								},
							],
						},
					],
				},
			],
			raw: true,
		});
	}

	async getAcceptedOrders(pharmacy_id: number, limit: number, offset: number) {
		TemporaryRequestPharmacy.hasMany(TemporaryPatientOrderPharmacy, {
			foreignKey: "temporary_request_pharmacy_id",
		});
		TemporaryPatientOrderPharmacy.belongsTo(TemporaryRequestPharmacy, {
			foreignKey: "temporary_request_pharmacy_id",
		});
		Users.hasOne(TemporaryPatientOrderPharmacy, { foreignKey: "patient_id" });
		TemporaryPatientOrderPharmacy.belongsTo(Users, {
			foreignKey: "patient_id",
		});
		Users.hasOne(PatientUser, { foreignKey: "user_id" });
		PatientUser.belongsTo(Users, { foreignKey: "user_id" });
		Address.hasOne(PatientUser, { foreignKey: "address_id" });
		PatientUser.belongsTo(Address, { foreignKey: "address_id" });

		let acceptedOrders: any[] = await TemporaryPatientOrderPharmacy.findAll({
			where: {
				pharmacy_id: pharmacy_id,
			},
			attributes: [
				["order_id", "order_id"],
				["temporary_request_pharmacy_id", "request_pharmacy_id"],
				["pharmacy_id", "pharmacist_id"],
				["prescription_type", "prescription_type"],
				[fn("", col("order_type")), "order_type"],
				[fn("", col("order_status")), "order_status"],
				[fn("", col("full_order")), "full_order"],
				[fn("", col("partial_order")), "partial_order"],
				[fn("", col("substituted_medicines")), "substituted_medicines"],
				["createdAt", "createdAt"],
				["patient_id", "patient_id"],
				[
					fn("CONCAT", col("first_name"), " ", col("last_name")),
					"patient_name",
				],
				[fn("", col("gender")), "gender"],
				[fn("", col("birth_date")), "birth_date"],
				[fn("", col("profile_image")), "profile_image"],
				[fn("", col("contact_number")), "contact_number"],
				[fn("", col("address_id")), "address_id"],
				[fn("ST_X", col("location")), "latitude"],
				[fn("ST_Y", col("location")), "longitude"],
				[fn("", col("locality")), "locality"],
				[fn("", col("address")), "address"],
				[fn("", col("city")), "city"],
				[fn("", col("pincode")), "pincode"],
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
				},
				{
					model: Users,
					attributes: [],
					include: [
						{
							model: PatientUser,
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
			raw: true,
			group: ["patient_id", "prescription_type", "order_id"],
			order: [["createdAt", "DESC"]],
			limit: limit,
			offset: offset,
		});

		if (acceptedOrders.length > 0) {
			let getProfileImgPromises: any[] = [];
			for (let order of acceptedOrders) {
				getProfileImgPromises.push(this.formatProfileImageData(order));
			}
			acceptedOrders = await Promise.all(getProfileImgPromises);
		}
		return { acceptedOrders, limit: limit, offset: offset };
	}
	async addSubstituteMedicines(medicine: any) {
		return TemporaryRxImmunisation.update(
			{ is_substituted: true, substituted: medicine.substituted },
			{
				where: {
					medicine_id: medicine.medicine_id,
					prescriptions_id: medicine.prescriptions_id,
					temporary_patient_order_pharmacy_id: medicine.prescribed_order_id,
				},
			}
		);
	}

	async updateNotAvailableMedicineStatus(medicine: any) {
		return TemporaryRxImmunisation.update(
			{ is_pharmacy_selected: false },
			{
				where: {
					medicine_id: medicine.medicine_id,
					prescriptions_id: medicine.prescriptions_id,
					temporary_patient_order_pharmacy_id: medicine.prescribed_order_id,
				},
			}
		);
	}

	async acceptOrderRequest(pharmacyOrders: any, user: any) {

		let returnData = await Utils.setTransaction(async () => {
			let { requestPharmacy, prescriptions, order_summary } = pharmacyOrders;

			let requestOrder: any = await TemporaryRequestPharmacy.findOne({
				where: {
					id: requestPharmacy.request_pharmacy_id,
					order_type: "request",
				},
				raw: true,
			});

			if (!requestOrder)
				throw new BadRequestError("No Such Order Request exits for Pharmacy");
			else {
				let isActive: boolean = await Utils.compareTime(requestOrder.updatedAt);
				if (!isActive) {
					throw new BadRequestError("Order Request Timeout");
				}
			}

			let orderReqAndBillingPromises: any[] = [];
			let addSubstitutePromises: any[] = [];
			let isNotAvailablePromises: any[] = [];

			if (prescriptions.length > 0) {
				orderReqAndBillingPromises.push(
					//update Requested Order
					TemporaryRequestPharmacy.update(
						{
							accept_order_pharmacy: true,
							full_order: requestPharmacy.full_order,
							partial_order: requestPharmacy.partial_order,
							substituted_medicines: requestPharmacy.substituted_medicines,
							order_status_code: 4,
						},
						{
							where: {
								id: requestPharmacy.request_pharmacy_id,
								pharmacy_id: user.id, //only pharmacy employee can accept or decline the order for pharmacy profile
							},
						}
					)
				);

				orderReqAndBillingPromises.push(
					//add Order Summary for Billing purpose
					TemporaryOrderSummary.create({
						...order_summary,
						pharmacy_id: user.id,
						temporary_request_pharmacy_id: requestPharmacy.request_pharmacy_id,
					})
				);

				//add substitutes or update status for medicine that aren't available at Pharmacy
				for (let prescription of prescriptions) {
					if (prescription.medicines)
						for (let medicine of prescription.medicines) {
							if (medicine.is_pharmacy_selected) {
								if (medicine.is_substituted) {
									addSubstitutePromises.push(
										this.addSubstituteMedicines({
											...medicine,
											prescriptions_id: prescription.prescriptions_id,
											prescribed_order_id: prescription.prescribed_order_id,
										})
									);
								}
							} else {
								isNotAvailablePromises.push(
									this.updateNotAvailableMedicineStatus({
										...medicine,
										prescriptions_id: prescription.prescriptions_id,
										prescribed_order_id: prescription.prescribed_order_id,
									})
								);
							}
						}
				}
				await Promise.all([
					...orderReqAndBillingPromises,
					...addSubstitutePromises,
					...isNotAvailablePromises,
				]);

				let [patient, pharmacy] = await Promise.all([
					Users.findOne({
						where: {
							id: requestOrder.patient_id
						},
						attributes: [
							"contact_number"
						],
					}),
					this.getPharmacyDetail(user.id)
				]);

				let patientDetail: any = patient;
				let pharmacyDetails: any = pharmacy;

				let dynamicPatienData = { pharmacy: pharmacyDetails.workplace_name, orderId: requestOrder.order_id };
				await new Notifications().sendNotification("PATIENT_PHARMACY_MEDICINE_ORDER_RESPONSE", dynamicPatienData, { contact_number: [patientDetail.contact_number] })
			} else {
				throw new BadRequestError(
					"No prescriptions found for Medicine Order Request"
				);
			}

			return { msg: ResponseMessageEnum.PHARMACY_ACCEPT_REQ_ORDER };
		});

		return returnData;
	}

	async declineOrderRequest(pharmacyOrders: any, userID: number) {
		let requestOrder: any = await TemporaryRequestPharmacy.findOne({
			where: {
				id: pharmacyOrders.request_pharmacy_id,
				order_type: "request",
			},
			raw: true,
		});

		if (!requestOrder)
			throw new BadRequestError("No Such Order Request exits for Pharmacy");
		else {
			let isActive: boolean = await Utils.compareTime(requestOrder.updatedAt);
			if (!isActive) {
				throw new BadRequestError("Order Request Timeout");
			}
		}
		await TemporaryRequestPharmacy.update(
			{
				is_cancelled: true,
				order_status_code: 2,
			},
			{
				where: { id: pharmacyOrders.request_pharmacy_id, pharmacy_id: userID },
			}
		);

		return { msg: "Request Order Declined By Pharmacy" };
	}

	async cancelPharmacyOrder(cancelOrder: any) {
		return Utils.setTransaction(async () => {
			let pharmacyRequest = await this.generateOriginalPharmacyOrder(
				cancelOrder.order_request_pharmacy_id,
				true
			);
			await PharmacyCancelOrder.create(
				{ ...cancelOrder, order_request_pharmacy_id: pharmacyRequest.id },
				{ raw: true }
			);

			let [patient, pharmacy] = await Promise.all([
				Users.findOne({
					where: {
						id: pharmacyRequest.patient_id
					},
					attributes: [
						"contact_number"
					],
				}),
				this.getPharmacyDetail(cancelOrder.pharmacy_id)
			]);

			let patientDetail: any = patient;
			let pharmacyDetails: any = pharmacy;
			let dynamicPatienData = { pharmacy: pharmacyDetails.workplace_name, orderId: cancelOrder.order_id, reason: cancelOrder.cancel_reason };
			await new Notifications().sendNotification("PATIENT_PHARMACY_MEDICINE_ORDER_CANCELLED", dynamicPatienData, { contact_number: [patientDetail.contact_number] })
			return { msg: "Order Cancel Successfully" };
		});
	}

	async generateOriginalPharmacyOrder(temporderID: any, is_cancelled: boolean, is_timed_out: boolean = false, is_for_cancel: boolean = false) {
		//Get Request Order
		let orderRequest: any = await TemporaryRequestPharmacy.findOne({
			where: { id: temporderID },
			raw: true,
		});
		//Get Asscociated PresciptionOrder on that Order
		let prescribedOrders: any[] = await TemporaryPatientOrderPharmacy.findAll({
			where: { temporary_request_pharmacy_id: orderRequest.id },
			raw: true,
		});
		//Get Associated Medicine on that PrescriptionOrder
		let prescribedMedicines: any[] = [];
		let orderIds: any[] = [];
		for (let order of prescribedOrders) {
			orderIds.push(order.id);
		}

		const isScannedPrescription = !!prescribedOrders.some(
			(x) => x.prescription_type == "scanned"
		);

		if (!isScannedPrescription) {
			prescribedMedicines = await TemporaryRxImmunisation.findAll({
				where: {
					temporary_patient_order_pharmacy_id: {
						[Op.in]: orderIds,
					},
				},
				raw: true,
			});
		}
		orderRequest.prescribedOrders = prescribedOrders.map((obj) => {
			if (!isScannedPrescription) {
				obj.prescribedMedicines = prescribedMedicines.filter((mobj) => {
					return mobj.temporary_patient_order_pharmacy_id === obj.id;
				});
			}
			return obj;
		});

		let [order_summary, clearStatus] = (await Promise.all([
			TemporaryOrderSummary.findOne({
				where: { temporary_request_pharmacy_id: temporderID },
				raw: true,
			}),
			//clear all temporary Entires for this Request Order
			is_timed_out ?
				this.clearOtherTemproryOrders(temporderID, orderRequest.order_id) :
				new PatientService().clearRemainingOrder({ id: temporderID }, true),
		])) as any;

		orderRequest.order_summary = order_summary;
		orderRequest.order_status_code = is_for_cancel ? OrderStatusEnum['Cancelled by Patient'] : is_timed_out ? OrderStatusEnum['Timed Out'] : is_cancelled ? 3 : 10;
		return this.generateOriginalPharmacyRequest({
			...orderRequest,
			is_cancelled,
			is_timed_out
		});
	}

	async clearOtherTemproryOrders(currentOrderId: number, order_id: string) {

		let orderRequest: any = await TemporaryRequestPharmacy.findAll({
			where: { order_id: order_id },
			raw: true,
		});
		let clearPromise: any = []
		orderRequest.map(async (singleOrder: any) => {
			clearPromise.push(await new PatientService().clearRemainingOrder({ id: singleOrder.id }, true))

		});

		await Promise.all(clearPromise)
		return true;

	}

	async generateOriginalPharmacyRequest(orderRequest: any) {
		let {
			prescribedOrders,
			order_summary,
			order_status_code,
			is_timed_out,
			...currentOrderRequest
		} = orderRequest;
		delete currentOrderRequest.id;
		delete currentOrderRequest.updatedAt;
		currentOrderRequest.order_status_code = order_status_code;
		if (is_timed_out) {
			currentOrderRequest.pharmacy_id = null;
		}
		let requestedOrder: any = await RequestPharmacy.create(currentOrderRequest);

		if (!requestedOrder)
			throw new BadRequestError(
				"Issue while generating Order for Pharmacy request"
			);

		if (!is_timed_out) {

			// create Order Summary
			delete order_summary.id;
			delete order_summary.temporary_request_pharmacy_id;
			delete order_summary.updatedAt;
			order_summary.request_pharmacy_id = requestedOrder.id;
			let orderSummary: any = await OrderSummary.create(order_summary);

			if (!orderSummary)
				throw new BadRequestError(
					"Issue while generating Order Summary for Pharmacy request"
				);

		}
		let geenratePharmacyOrderPromises = [];
		if (!!prescribedOrders && prescribedOrders.length > 0) {
			for (let order of prescribedOrders) {
				geenratePharmacyOrderPromises.push(
					this.generateOriginalPatientOrderPharmacy(order, requestedOrder.id, is_timed_out)
				);
			}
			await Promise.all(geenratePharmacyOrderPromises);
		}
		return requestedOrder;
	}

	async generateOriginalPatientOrderPharmacy(
		prescribedOrder: any,
		request_pharmacy_id: number,
		is_timed_out: boolean = false
	) {
		let { prescribedMedicines, ...currentOrder } = prescribedOrder;
		delete currentOrder.id;
		delete currentOrder.temporary_request_pharmacy_id;
		if (is_timed_out) {
			currentOrder.pharmacy_id = null;
		}
		let pharmacyOrder: any = await PatientOrderPharmacy.create({
			...currentOrder,
			request_pharmacy_id,
		});

		if (!pharmacyOrder)
			throw new BadRequestError(
				"Issue while generating Order for Patient Order Pharmacy"
			);

		if (!!prescribedMedicines && prescribedMedicines.length > 0) {
			let genratePharmacyRxInfoPromises = [];

			for (let medicine of prescribedMedicines) {
				genratePharmacyRxInfoPromises.push(
					this.generateOriginalPharmacyRxInformation(medicine, pharmacyOrder.id)
				);
			}
			await Promise.all(genratePharmacyRxInfoPromises);
		}
	}

	async generateOriginalPharmacyRxInformation(
		prescribedMedicine: any,
		patient_order_pharmacy_id: number
	) {
		delete prescribedMedicine.id;
		delete prescribedMedicine.temporary_patient_order_pharmacy_id;
		let pharmacyRxInfo: any = await PharmacyRxImmunisation.create({
			...prescribedMedicine,
			patient_order_pharmacy_id,
		});

		if (!pharmacyRxInfo)
			throw new BadRequestError(
				"Issue while generating Order for PharmacyRxInformation"
			);
	}

	async markOrderAsDelivered(order: any, user: any) {
		return Utils.setTransaction(async () => {
			let response = await this.generateOriginalPharmacyOrder(
				order.order_request_pharmacy_id,
				false
			);

			let [patient, pharmacy] = await Promise.all([
				Users.findOne({
					where: {
						id: response.patient_id
					},
					attributes: [
						[
							fn("CONCAT", col("first_name"), " ", col("last_name")),
							"name",
						],
						["contact_number", "contact_number"]
					],
				}),
				this.getPharmacyDetail(user.id)
			]);

			let patientDetail: any = patient;
			let pharmacyDetails: any = pharmacy;
			let dynamicData = { patientName: patientDetail.name, orderId: response.order_id };
			let dynamicPatienData = { pharmacy: pharmacyDetails.workplace_name, orderId: response.order_id };
			await Promise.all([new Notifications().sendNotification(user.isAdmin == 1 ? "PHARM_ADMIN_DELIVERY_COMPLETED" : "PHARM_EMPLOYEE_DELIVERY_COMPLETED", dynamicData, { contact_number: [user.contact_number] }), new Notifications().sendNotification("PATIENT_PHARMACY_DELIVERY_COMPLETED", dynamicPatienData, { contact_number: [patientDetail.contact_number] })])
			return { msg: "Order Marked as Delivered Successfully" };
		});
	}

	async getPastOrders(
		pharmacy_id: number,
		limit: number,
		offset: number,
		date: string
	) {
		RequestPharmacy.hasOne(PatientOrderPharmacy, {
			foreignKey: "request_pharmacy_id",
		});
		PatientOrderPharmacy.belongsTo(RequestPharmacy, {
			foreignKey: "request_pharmacy_id",
		});
		Users.hasOne(RequestPharmacy, { foreignKey: "patient_id" });
		RequestPharmacy.belongsTo(Users, { foreignKey: "patient_id" });

		let dateCase = date
			? {
				[Op.and]: [
					sequelize.where(
						sequelize.fn("date", sequelize.col("request_pharmacy.createdAt")),
						"=",
						date
					),
				],
			}
			: {};

		let pastOrders = await RequestPharmacy.findAll({
			where: {
				pharmacy_id: pharmacy_id,
				//is_cancelled: 0, //cancelled orders will not show in Pharmacy Past order
				...dateCase,
			},
			attributes: [
				["id", "id"],
				["order_id", "order_id"],
				["full_order", "full_order"],
				["partial_order", "partial_order"],
				["substituted_medicines", "substituted_medicines"],
				["order_status", "order_status"],
				["patient_id", "patient_id"],
				["is_cancelled", "is_cancelled"],
				["createdAt", "createdAt"],
				["updatedAt", "updatedAt"],
				[fn("", col("prescription_type")), "prescription_type"],
				[
					fn("CONCAT", col("first_name"), " ", col("last_name")),
					"patient_name",
				],
				[fn("", col("gender")), "gender"],
				[fn("", col("birth_date")), "birth_date"],
				[fn("", col("profile_image")), "profile_image"],
				[fn("", col("contact_number")), "contact_number"],
			],
			include: [
				{
					model: PatientOrderPharmacy,
					attributes: [],
				},
				{
					model: Users,
					attributes: [],
				},
			],
			raw: true,
			limit: limit,
			offset: offset,
			group: ["request_pharmacy.id"],
			order: [["createdAt", "DESC"]],
		});

		if (pastOrders.length) {
			let getProfileImgPromises: any[] = [];
			for (let order of pastOrders) {
				getProfileImgPromises.push(this.formatProfileImageData(order));
			}
			pastOrders = await Promise.all(getProfileImgPromises);
		}
		return { pastOrders, limit: limit, offset: offset };
	}

	async viewPastOrderDetails(order_id: string) {
		DrPatientAppoiment.hasOne(PatientOrderPharmacy, {
			foreignKey: "booking_id",
		});
		PatientOrderPharmacy.belongsTo(DrPatientAppoiment, {
			foreignKey: "booking_id",
		});
		dr_Workplaces.hasOne(DrPatientAppoiment, { foreignKey: "workplace_id" });
		DrPatientAppoiment.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasOne(PatientOrderPharmacy, { foreignKey: "doctor_id" });
		PatientOrderPharmacy.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

		let orderedPrescriptions = await PatientOrderPharmacy.findAll({
			where: {
				order_id: order_id,
				prescription_type: "electronic",
			},
			attributes: [
				["id", "order_pharmacy_id"],
				["order_id", "order_id"],
				["prescription_id", "prescription_id"],
				["prescription_type", "prescription_type"],
				["patient_id", "patient_id"],
				["booking_id", "booking_id"],
				["doctor_id", "doctor_id"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "doctor_name"],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
				[fn("", col("date")), "date"],
				[fn("", col("end_time")), "end_time"],
			],
			include: [
				{
					model: DrPatientAppoiment,
					attributes: [],
					include: [
						{
							model: dr_Workplaces,
							attributes: [],
						},
					],
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
			],
			raw: true,
			group: ["prescription_id"],
		});

		if (orderedPrescriptions.length > 0) {
			let fetchRxInfoPromises: any[] = [];
			for (let prescription of orderedPrescriptions) {
				fetchRxInfoPromises.push(
					this.formatPastOrderedMedicineData(prescription)
				);
			}
			let orderedPrescription: any = await Promise.all(fetchRxInfoPromises);
			let order_summary: any = await OrderSummary.findOne({
				where: { order_id: order_id },
				raw: true,
			});
			return { prescriptions: orderedPrescription, order_summary };
		}

		return { msg: "No Prescription Data found" };
	}

	async getPastScannedOrders(order_id: string) {
		UserScannedDocument.hasOne(PatientOrderPharmacy, {
			foreignKey: "scanned_doc_id",
		});
		PatientOrderPharmacy.belongsTo(UserScannedDocument, {
			foreignKey: "scanned_doc_id",
		});

		Users.hasOne(PatientOrderPharmacy, { foreignKey: "patient_id" });
		PatientOrderPharmacy.belongsTo(Users, { foreignKey: "patient_id" });

		const data = await UserScannedDocument.findAll({
			include: [
				{
					model: PatientOrderPharmacy,
					required: true,
					attributes: [],
					where: {
						order_id: order_id,
						prescription_type: "scanned",
					},
					include: [
						{
							model: Users,
							required: true,
							attributes: [],
						},
					],
				},
			],

			attributes: [
				[fn("", col("order_id")), "order_id"],
				[fn("", col("prescription_type")), "prescription_type"],
				[fn("", col("patient_id")), "patient_id"],
				[fn("", col("pharmacy_id")), "pharmacy_id"],
				[fn("CONCAT", `${AWS_FILE_UPLOAD_LINK}/`, col("key")), "link"],
				[
					fn("CONCAT", col("first_name"), " ", col("last_name")),
					"patient_name",
				],
				[fn("", col("medical_record_date")), "medical_record_date"],
				[fn("", col("group_id")), "group_id"],
				[fn("", col("original_file_name")), "original_file_name"],
				[fn("", col("user_scanned_documents.createdAt")), "upload_date"],
				[fn("", col("file_name")), "file_name"],
			],
			raw: true,
		});
		return data.reduce((acc: any[], current: any) => {
			let isExists = acc.find((x) => x.group_id == current.group_id);

			if (isExists) {
				isExists.files.push({
					original_file_name: current.original_file_name,
					link: current.link,
				});
				return acc;
			}

			const obj = {
				order_id: current.order_id,
				prescription_type: current.prescription_type,
				patient_id: current.patient_id,
				pharmacy_id: current.pharmacy_id,
				name: current.patient_name,
				group_id: current.group_id,
				file_name: current.file_name,
				upload_date: current.upload_date,
				medical_record_date: current.medical_record_date,
				files: [
					{
						original_file_name: current.original_file_name,
						link: current.link,
					},
				],
			};
			acc.push(obj);

			return acc;
		}, []);
	}
	async formatPastOrderedMedicineData(prescriptions: any) {
		prescriptions.specialities = prescriptions.specialities
			? prescriptions.specialities.split(",")
			: [];

		let medicines = await PharmacyRxImmunisation.findAll({
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
				"is_substituted",
				"substituted",
				"accepted_risk",
				"drug_unit",
				"packaging",
				"mrp",
				"is_pharmacy_selected",
			],
			where: {
				patient_order_pharmacy_id: prescriptions.order_pharmacy_id,
			},
			raw: true,
		});

		prescriptions.medicines = medicines;
		return prescriptions;
	}

	async getScannedPrescription(request_pharmacy_id: number) {
		UserScannedDocument.hasOne(TemporaryPatientOrderPharmacy, {
			foreignKey: "scanned_doc_id",
		});
		TemporaryPatientOrderPharmacy.belongsTo(UserScannedDocument, {
			foreignKey: "scanned_doc_id",
		});

		Users.hasOne(TemporaryPatientOrderPharmacy, { foreignKey: "patient_id" });
		TemporaryPatientOrderPharmacy.belongsTo(Users, {
			foreignKey: "patient_id",
		});

		const data = UserScannedDocument.findAll({
			include: [
				{
					model: TemporaryPatientOrderPharmacy,
					required: true,
					attributes: [],
					where: {
						temporary_request_pharmacy_id: request_pharmacy_id,
					},
					include: [
						{
							model: Users,
							required: true,
							attributes: [],
						},
					],
				},
			],
			attributes: [
				[fn("", col("scanned_doc_id")), "scanned_doc_id"],
				[fn("", col("order_id")), "order_id"],
				[
					fn("", col("temporarypatient_order_pharmacy.id")),
					"prescribed_order_id",
				],
				[fn("", col("temporary_request_pharmacy_id")), "request_pharmacy_id"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "name"],
				[fn("CONCAT", `${AWS_FILE_UPLOAD_LINK}/`, col("key")), "link"],
				[fn("", col("medical_record_date")), "medical_record_date"],
				[fn("", col("file_name")), "file_name"],
				[fn("", col("group_id")), "group_id"],
				[fn("", col("original_file_name")), "original_file_name"],
				[fn("", col("user_scanned_documents.createdAt")), "upload_date"],
				[fn("", col("user_scanned_documents.id")), "scanned_doc_id"],
			],
			raw: true,
			group: ["user_scanned_documents.id"],
		});

		return data.reduce((acc: any[], current: any) => {
			let isExists = acc.find((x) => x.group_id == current.group_id);

			if (isExists) {
				isExists.files.push({
					scanned_doc_id: current.scanned_doc_id,
					original_file_name: current.original_file_name,
					link: current.link,
				});
				return acc;
			}

			const obj = {
				order_id: current.order_id,
				prescribed_order_id: current.prescribed_order_id,
				request_pharmacy_id: current.request_pharmacy_id,
				name: current.name,
				group_id: current.group_id,
				file_name: current.file_name,
				upload_date: current.upload_date,
				medical_record_date: current.medical_record_date,
				files: [
					{
						scanned_doc_id: current.scanned_doc_id,
						original_file_name: current.original_file_name,
						link: current.link,
					},
				],
			};
			acc.push(obj);

			return acc;
		}, []);
	}

	async getPharmacyDetail(userId: number) {
		Users.hasOne(PharmacyWorkplaceUsers, { foreignKey: "user_id" });
		PharmacyWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		PharmacyWorkplaces.hasOne(PharmacyWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		PharmacyWorkplaceUsers.belongsTo(PharmacyWorkplaces, {
			foreignKey: "workplace_id",
		});


		return Users.findOne({
			attributes: [
				[fn("", col("workplace_name")), "workplace_name"],
			],
			where: {
				id: userId,
			},
			include: [
				{
					model: PharmacyWorkplaceUsers,
					attributes: [],
					include: [
						{
							model: PharmacyWorkplaces,
							attributes: []
						},
					],
				},
			],
			raw: true,
		});
	}
}

/*
  //Soft Delete pharmacy employee
  async removePharmacyEmployee(contact_number: string) {
	if (!contact_number) {
	  throw new Error("Please entry proper contact number");
	}

	const user: any = await Users.findOne({
	  attributes: ["id"],
	  where: {
		contact_number: contact_number,
	  },
	});

	//check if user is not admin if yes do not remove him for workplace else remove
	let role: any = await UserRole.findOne({attributes: ['role_id', 'isWorkplaceAdmin'], where: {user_id: user.id}});
	console.log("role", role);
	if(role.isWorkplaceAdmin){
	  throw new Error("You cannot remove admin from workplace");
	}else{
	  //remove employee from workplace
	  await PharmacyWorkplaceUsers.update({where: {user_id: user.id}});

	  //remove user role data
	  await UserRole.update({verify_account: 0, active_status: 0},{where: {role_id: role.role_id,user_id: user.id}});

	  //update user data & deactivate account
	  await Users.update({
		account_activation: 0,
		lab_or_pharma_employement_number: 0,
		email_verify: 0,
		default_role: null,
		isSetupComplete: 0
	  }, {where: {id: user.id}});

	}

	return { msg: "user removed from Workplace Sucessfully" };
  }

*/
