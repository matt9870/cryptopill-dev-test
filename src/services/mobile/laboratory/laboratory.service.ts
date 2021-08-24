import LabWorkSpace from "../../../models/lab_workplaces.model";
import { get } from "config";
const secrets = get("APP");
const { USER_VERIFICATION_LINK }: any = secrets;
import Users from "../../../models/users.model";
import UserRole from "../../../models/user_role.model";
import Identity from "../../../models/identity.model";
import { UserService } from "../../mobile/user/user.service";
import { EmailServer, Notifications, Utils } from "../../../helpers";
import { ResponseMessageEnum } from "../../../constants/constant.enum";
import LabWorkplaceUsers from "../../../models/lab_workplace_users.model";
import LabWorkplaces from "../../../models/lab_workplaces.model";
import Address from "../../../models/address.model";
import { AddressService } from "../../shared/address.service";
import { fn, col, Op, Sequelize } from "sequelize";
import {
	BadRequestError,
	NotAcceptableError,
	UnauthorizedError,
} from "routing-controllers";
import { RolesEnum } from "../../../constants/roles.enum";
import lab_test from "../../../models/lab_test.model";
import Tests from "../../../models/tests.model";
import { StatusCode } from "../../../constants/status_code.enum";
import TemporaryRequestLab from "../../../models/temporary_request_lab.model";
import TemporaryPatientOrderLab from "../../../models/temporary_patient_order_lab.model";
import PatientUser from "../../../models/patient_user.model";
import { FileService } from "../../shared/file.service";
import DrPatientAppoiment from "../../../models/dr_patient_appoiment.model";
import dr_Workplaces from "../../../models/dr_workplaces.model";
import DrSpeciality from "../../../models/dr_speciality.model";
import Speciality from "../../../models/specialities_speciality.model";
import TemporaryLabTests from "../../../models/temporary_lab_tests.model";
import TemporaryLabOrderSummary from "../../../models/temporary_lab_order_summary.model";
import LabCancelOrder from "../../../models/lab_cancel_order.model";
import { PatientService } from "../patient/patient.service";
import RequestLab from "../../../models/request_lab.model";
import LabOrderSummary from "../../../models/lab_order_summary.model";
import PatientOrderLab from "../../../models/patient_order_lab.model";
import LaboratoryLabTests from "../../../models/laboratory_lab_test.model";
import UserScannedDocument from "../../../models/user_scanned_prescriptions";
import { update } from "lodash";
import NotificationSetting from "../../../models/notification_setting.model";
import Timeouts from "../../../models/timeouts.model";
import { OrderStatusEnum } from "../../../constants/order_status.enum";
const { AWS_FILE_UPLOAD_LINK } = get("APP");

export class LaboratoryService {
	async removeSetupProfileDetails(idObj: any) {
		if (idObj.labWorkplaces) {
			for (let i = 0; i < idObj.labWorkplaces.length; i++) {
				await LabWorkplaceUsers.destroy({
					where: {
						workplace_id: idObj.labWorkplaces[i],
						user_id: idObj.user_id,
					},
				});

				await LabWorkplaces.destroy({
					where: {
						id: idObj.labWorkplaces[i],
					},
				});
			}
		}
	}

	async addWorkplacesDetails(laboratoryDetails: any, isAdmin: boolean = false) {
		if (laboratoryDetails.workplaces.length < 1) {
			throw new Error("Need to add atleast one workplace entry for Pharmacy");
		}
		const ID: any = [];
		for (let wkobj of laboratoryDetails.workplaces) {
			const { address, workplace } = wkobj;

			//add entry fist in adress filed
			const addressEntry: any = await new AddressService().addAddress(address);

			//add workplace in lab_workplace
			if (isAdmin) {
				workplace.status_code = StatusCode.Verified;
			}
			const wkpResult: any = await LabWorkSpace.create(
				{ ...workplace, address_id: addressEntry.id },
				{ raw: true }
			);

			ID.push(wkpResult.id);
			//add user & workplace refs in lab_workplace_users table
			if (laboratoryDetails.user_id) {
				let objForPhWkpUserRef: any = {
					workplace_id: wkpResult.id,
					user_id: laboratoryDetails.user_id,
				};

				await LabWorkplaceUsers.create(objForPhWkpUserRef, { raw: true });
			}
		}
		return { labWorkplaces: ID };
	}

	async upsertSetUpProfileDetails(setUpProifleObj: any, isAdmin: boolean = false) {
		let ID: any = {};
		try {
			const { laboratoryDetails } = setUpProifleObj;

			const labResult: any = await this.addWorkplacesDetails(laboratoryDetails, isAdmin);

			ID.user_id = laboratoryDetails.user_id;
			ID = { ...labResult, ...ID };

			let userRole = {
				user_id: laboratoryDetails.user_id,
				default_role: setUpProifleObj.user_role,
			};
			await new UserService().updateProfileSetup(laboratoryDetails.user_id, RolesEnum.Laboratory);
			return {
				msg: "Lab setup profile created successfully",
				labWorkplaces: ID.labWorkplaces,
			};
		} catch (error) {
			if (ID.user_id) {
				await this.removeSetupProfileDetails(ID);
			}

			throw new Error(error);
		}
	}

	// async upsertLabEmployeeDetails(userObj: any) {
	// 	const {
	// 		document_number,
	// 		document_type,
	// 		role_id,
	// 		edit_profile,
	// 		...userData
	// 	} = userObj;
	// 	const ID = {} as any;
	// 	let user_id: number;
	// 	userObj.default_role = role_id;
	// 	const userResult: any = await Users.findOne({
	// 		attributes: [
	// 			"id",
	// 			"first_name",
	// 			"middle_name",
	// 			"last_name",
	// 			"contact_number",
	// 			"birth_date",
	// 			"gender",
	// 			"lab_or_pharma_employement_number",
	// 			"phone_verify",
	// 			"password",
	// 		],
	// 		where: {
	// 			contact_number: userData.contact_number,
	// 		},
	// 	});

	// 	// if user tries to setup new profile with same verified contact number
	// 	// then throw error "User Alreay Exists"
	// 	if (userResult && userResult.phone_verify) {
	// 		throw new BadRequestError(ResponseMessageEnum.USER_ALREADY_EXISTS);
	// 	}

	// 	if (!userResult) {
	// 		const max = await Users.max("id");
	// 		user_id = isNaN(max) ? 1 : max + 1;
	// 		ID["id"] = user_id;
	// 	} else {
	// 		ID["id"] = userResult.id;
	// 	}

	// 	try {
	// 		const OTP = await Utils.generateOPT();
	// 		userData.phone_otp = OTP;
	// 		userData.otp_timer = new Date();

	// 		const optSent = await Utils.sendMessage(
	// 			`Welcome to Cryptopill. Your verification OTP: ${OTP}`,
	// 			userData.contact_number
	// 		);
	// 		let result;
	// 		if (!!optSent && optSent.sid) {
	// 			result = await Users.upsert(
	// 				{ ...userData, ...ID, ...{ default_role: role_id } },
	// 				{
	// 					returning: true,
	// 				}
	// 			);
	// 		}
	// 	} catch (error) {
	// 		throw new Error(error);
	// 	}

	// 	await Identity.upsert(
	// 		{
	// 			type: document_type,
	// 			number: document_number,
	// 			user_id: ID.id,
	// 		},
	// 		{
	// 			returning: true,
	// 		}
	// 	);

	// 	const savedUser = await this.saveUserRole(ID.id, role_id, edit_profile);

	// 	return savedUser;
	// }

	// Updated Flow lab Setup profile

	async upsertLabEmployeeDetails(userObj: any) {
		const {
			document_number,
			document_type,
			role_id,
			edit_profile,
			gender,
			birth_date,
			lab_or_pharma_employement_number,
			user_id,
		} = userObj;
		userObj.default_role = role_id;
		userObj.isSetupComplete = 1;

		let userIdentity: any = await Identity.findOne({
			where: { user_id: user_id },
			raw: true,
		});
		// add identiy entry
		let docDetails: any = { type: document_type, number: document_number };
		if (userIdentity) {
			await Identity.update(docDetails, { where: { user_id: user_id } });
		} else {
			docDetails.user_id = user_id;
			await Identity.create(docDetails);
		}


		let userRoleObj: any = {
			role_id: role_id,
			user_id: user_id,
			active_status: 1,
			isWorkplaceAdmin: 1,
			// isWorkplaceAdmin: edit_profile,
			verify_account: 1,
			status_code: StatusCode.Verified,
		};

		const isRoleExists = await UserRole.update(userRoleObj, {
			where: {
				role_id: role_id,
				user_id: user_id,
			},
		});

		// if user tries to setup new profile with same verified contact number
		// then throw error "User Alreay Exists"

		let savedUser: any = await Users.update(userObj, {
			where: {
				id: user_id,
			},
		});
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

	async removeLabEmployee(contact_number: string) {
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

	async getEmployeeDetails(user_id: number) {
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

	async updateLabEmployeeDetails(userObj: any) {
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
			throw new Error("User not added");
		}

		//const savedUser = this.saveUserRole(ID.id, userData.role_id, userData.edit_profile);

		return { msg: "Employee Details update Sucessfully" };
	}

	async getLabDetails(lab_user: any) {
		Users.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
		LabWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });

		LabWorkplaces.hasOne(LabWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		LabWorkplaceUsers.belongsTo(LabWorkplaces, {
			foreignKey: "workplace_id",
		});

		let {
			profile_information,
			user_permission,
		}: any = await this.getLabUserDetails(lab_user);
		const personal_information: any = {
			...profile_information,
			...user_permission,
		};

		const lab_information: any = await LabWorkplaceUsers.findAll({
			where: {
				user_id: lab_user,
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
			],
			include: [
				{
					model: LabWorkplaces,
					attributes: [],
				},
			],
			raw: true,
		});

		Identity.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
		LabWorkplaceUsers.belongsTo(Identity, {
			foreignKey: "user_id",
			targetKey: "user_id",
		});

		UserRole.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
		LabWorkplaceUsers.belongsTo(UserRole, {
			foreignKey: "user_id",
			targetKey: "user_id",
		});

		for (let i = 0; i < lab_information.length; i++) {
			// Fetches address information
			const lab_address: any = await Address.findOne({
				where: {
					id: lab_information[i].address_id,
				},
				attributes: {
					exclude: ["id"],
				},
			});

			const latitude = lab_address.location.coordinates[0];
			const longitude = lab_address.location.coordinates[1];

			lab_address.location = {};
			lab_address.location.latitude = latitude;
			lab_address.location.longitude = longitude;

			lab_information[i].workplace = lab_address;

			// Fetches employee's corresponding to the lab
			const employee_details: any = await LabWorkplaceUsers.findAll({
				where: {
					workplace_id: lab_information[i].workplace_id,
					user_id: {
						[Op.not]: lab_user,
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

			lab_information[i].employee_information = employee_details;
		}

		return { personal_information, lab_information };
	}

	async getLabUserDetails(user_id: any) {
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
					required: true,
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

	async addLabEmployee(emp: any, user_role: number) {
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

	async updateLabProfile(body: any, loggedInUser: any) {
		let user_id: number = loggedInUser.id;
		const { workplaces } = body.laboratoryDetails;
		if (workplaces.length < 1) {
			throw new BadRequestError(
				"Need to add atleast one workplace entry for Laboratory"
			);
		}

		try {
			let notificationPromises: any[] = [];

			for (let i = 0; i < workplaces.length; i++) {
				// updating address table
				const {
					address_id,
					address,
					locality,
					city,
					pincode,
					location,
				} = workplaces[i].address;

				const coordinates: number[] = [location.latitude, location.longitude];
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

				// updating lab_workplaces table
				const {
					workplace_id,
					workplace_name,
					is_franchise,
					franchise_name,
					phone_number,
					license_number,
					gst_number,
					delivery_customer,
					delivery_distance,
				} = workplaces[i].workplace;

				const existingRecord: any = await LabWorkplaces.findOne({
					where: {
						id: workplace_id,
					},
				});

				const workplaceObj: any = {
					workplace_name,
					is_franchise,
					new_franchise_name:
						existingRecord && existingRecord.franchise_name == franchise_name
							? null
							: franchise_name,
					phone_number,
					new_license_number:
						existingRecord && existingRecord.license_number == license_number
							? null
							: license_number,
					new_gst_number:
						existingRecord && existingRecord.gst_number == gst_number
							? null
							: gst_number,
					delivery_customer,
					delivery_distance,
					status_code: StatusCode.Unverified_edit,
				};

				await LabWorkplaces.update(workplaceObj, {
					where: {
						id: workplace_id,
					},
				});

				let nearByLabUsers: any = await this.labEmployees(
					[workplace_id], true, user_id
				);

				//details update notification
				let notificationAdminContact: any = [];
				await nearByLabUsers.map((singleEmp: any) => {
					notificationAdminContact.push(singleEmp.contact_number)
				});
				let dynamicProfileUpdateData = { pharmacyAdminName: `${loggedInUser.first_name} ${loggedInUser.last_name}` };
				notificationPromises.push(new Notifications().sendNotification("LAB_ADMIN_LAB_DETAILS_EDITED", dynamicProfileUpdateData, { contact_number: notificationAdminContact }));


				// updating lab_workplace_users table
				const { employees } = workplaces[i];

				employees.forEach(async (emp: any) => {
					const user: any = await this.addLabEmployee(
						emp,
						RolesEnum.Laboratory
					);

					const workplaceBody: any = {
						workplace_id,
						user_id: user.id,
					};

					const workplaceEmployeeExist = await LabWorkplaceUsers.findOne({
						where: {
							user_id: user.id,
						},
					});

					if (!workplaceEmployeeExist && user) {
						await LabWorkplaceUsers.create(workplaceBody);
						// Fetch All contact info regarding notifications
						let nearByLabEmpUsers = await
							this.labEmployees(
								[workplace_id], false, user_id
							);



						let notificationEmpContact: any = [];
						await nearByLabEmpUsers.map((singleEmp: any) => {
							notificationEmpContact.push(singleEmp.contact_number)
						});

						let dynamicData = { employeeName: `${user.first_name} ${user.last_name}`, adminName: `${loggedInUser.first_name} ${loggedInUser.last_name}` };
						notificationPromises.push(new Notifications().sendNotification("LAB_ADMIN_EMPLOYEE_ADDED", dynamicData, { contact_number: notificationAdminContact }));
						notificationPromises.push(new Notifications().sendNotification("LAB_EMPLOYEE_EMP_ADDED", dynamicData, { contact_number: notificationEmpContact }))

					}
				});
			}
			await Promise.all([
				...notificationPromises,
			]);
			return { message: "Laboratory Profile Updated Successfully" };
		} catch (error) {
			console.log(error);
			throw new UnauthorizedError("Something went wrong");
		}
	}

	async labEmployees(workplaceIDs: number[], isAdmin: boolean = true, user_id: number) {
		// Fetch All related device_id for related workplaces & send it to patient for notification purpose

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
				// [fn("", col("deviceToken")), "deviceToken"],
				// [fn("", col("deviceType")), "deviceType"],
				[fn("", col("contact_number")), "contact_number"],
			],
			where: {
				workplace_id: { [Op.in]: workplaceIDs },
				user_id: { [Op.ne]: user_id }
			},
			include: [
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


	async addNewLabTests(body: any) {
		try {
			await lab_test.bulkCreate(body.test_info, { returning: true });

			return { message: "Test added Successfully" };
		} catch (error) {
			console.log(error);
			throw new UnauthorizedError("Something went wrong");
		}
	}

	async removeLabTest(test_id: number) {
		const isExist = await lab_test.findOne({ where: { id: test_id } });

		if (!isExist) throw new NotAcceptableError(`Test does not exist`);

		return await lab_test.destroy({ where: { id: test_id } });
	}

	async getLabTestsData(
		lab_id: number,
		limit?: number,
		offset?: number,
		search?: string,
		addedByAdmin?: boolean
	) {

		let limitObject = addedByAdmin ? { limit, offset } : {};
		Tests.hasOne(lab_test, { foreignKey: "tests_id" });
		lab_test.belongsTo(Tests, { foreignKey: "tests_id" });

		const searchClause = search
			? {
				name: {
					[Op.like]: search,
				},
			}
			: {};

		// Total lab tests
		const tests: any = await lab_test.findAll({
			...limitObject,
			where: {
				lab_id,
			},
			order: [["id", "DESC"]],
			attributes: [
				"id",
				[fn("", col("name")), "test_name"],
				"cost",
				"tests_id",
				"home_collection_charges",
				"home_collection",
				[fn("", col("also_known_as")), "also_known_as"]
			],
			include: [
				{
					model: Tests,
					attributes: [],
					where: searchClause,
				},
			],
			raw: true,
		});

		if (addedByAdmin)
			return { total_test: tests };

		const count = await lab_test.count({ where: { lab_id } });
		return { total_count: count, total_test: tests, limit, offset };


	}

	async getRequestedOrders(lab_id: number, limit: number, offset: number) {
		TemporaryRequestLab.hasMany(TemporaryPatientOrderLab, {
			foreignKey: "temporary_request_lab_id",
		});
		TemporaryPatientOrderLab.belongsTo(TemporaryRequestLab, {
			foreignKey: "temporary_request_lab_id",
		});
		Users.hasOne(TemporaryPatientOrderLab, { foreignKey: "patient_id" });
		TemporaryPatientOrderLab.belongsTo(Users, {
			foreignKey: "patient_id",
		});
		Users.hasOne(PatientUser, { foreignKey: "user_id" });
		PatientUser.belongsTo(Users, { foreignKey: "user_id" });
		Address.hasOne(PatientUser, { foreignKey: "address_id" });
		PatientUser.belongsTo(Address, { foreignKey: "address_id" });

		let requestOrders: any[] = await TemporaryPatientOrderLab.findAll({
			where: {
				lab_id: lab_id,
			},
			attributes: [
				["order_id", "order_id"],
				["temporary_request_lab_id", "request_lab_id"],
				["lab_id", "lab_id"],
				["prescription_type", "prescription_type"],
				["custom_order", "custom_order"],
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
					model: TemporaryRequestLab,
					attributes: [],
					where: {
						order_type: "request",
						is_cancelled: 0,
						accept_order_lab: 0, // For those Req orders that are accept by lab side only
						// order_status_code: 8
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

	async formatProfileImageData(order: any) {
		if (order && order.profile_image)
			order.profile_image = await new FileService().getProfileImageLink(
				order.patient_id,
				RolesEnum.Patient,
				order.profile_image
			);
		return order;
	}

	async getElectronicPrescriptions(request_id: number) {
		DrPatientAppoiment.hasOne(TemporaryPatientOrderLab, {
			foreignKey: "booking_id",
		});
		TemporaryPatientOrderLab.belongsTo(DrPatientAppoiment, {
			foreignKey: "booking_id",
		});
		dr_Workplaces.hasOne(DrPatientAppoiment, { foreignKey: "workplace_id" });
		DrPatientAppoiment.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasOne(TemporaryPatientOrderLab, { foreignKey: "doctor_id" });
		TemporaryPatientOrderLab.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

		let orderedPrescriptions = await TemporaryPatientOrderLab.findAll({
			where: {
				temporary_request_lab_id: request_id,
				prescription_type: "electronic",
			},
			attributes: [
				["order_id", "order_id"],
				["id", "prescribed_order_id"],
				["prescription_id", "prescription_id"],
				["scanned_doc_id", "scanned_doc_id"],
				["prescription_type", "prescription_type"],
				["patient_id", "patient_id"],
				["lab_id", "lab_id"],
				["booking_id", "booking_id"],
				["doctor_id", "doctor_id"],
				["temporary_request_lab_id", "temporary_request_lab_id"],
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
			let formatLabTestDatapromises: any[] = [];
			for (let prescription of orderedPrescriptions) {
				formatLabTestDatapromises.push(
					this.formatPrescibedTestData(prescription)
				);
			}
			let orderedPrescriptionPromises: any = await Promise.all(
				formatLabTestDatapromises
			);
			let [order_summary, lab_delivery_info] = await Promise.all([
				TemporaryLabOrderSummary.findOne({
					where: { temporary_request_lab_id: request_id },
					raw: true,
				}),
				this.LabDeliveryInfoFromOrderRequest(request_id),
			]);
			return {
				prescriptions: orderedPrescriptionPromises,
				order_summary,
				lab_delivery_info,
			};
		}

		return { msg: "No Prescription Data found" };
	}

	async formatPrescibedTestData(prescriptions: any) {
		prescriptions.specialities = prescriptions.specialities
			? prescriptions.specialities.split(",")
			: [];

		let tests = await TemporaryLabTests.findAll({
			attributes: [
				"lab_test_id",
				"test_name",
				"details",
				"mrp",
				"is_home_collection",
				"home_collection_charges",
				"is_lab_selected",
				"lab_test_report",
			],
			where: {
				temporary_patient_order_lab_id: prescriptions.prescribed_order_id,
			},
			raw: true,
		});

		prescriptions.tests = tests;
		return prescriptions;
	}

	async LabDeliveryInfoFromOrderRequest(request_id: number) {
		Users.hasOne(TemporaryRequestLab, { foreignKey: "lab_id" });
		TemporaryRequestLab.belongsTo(Users, { foreignKey: "lab_id" });
		Users.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
		LabWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		LabWorkplaces.hasOne(LabWorkplaceUsers, { foreignKey: "workplace_id" });
		LabWorkplaceUsers.belongsTo(LabWorkplaces, { foreignKey: "workplace_id" });

		return TemporaryRequestLab.findOne({
			where: {
				id: request_id,
			},
			attributes: [
				[fn("", col("delivery_customer")), "deliver_electronic_reports"],
				[fn("", col("delivery_distance")), "delivery_distance"],
				[fn("", col("discount")), "discount"],
			],
			include: [
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
								},
							],
						},
					],
				},
			],
			raw: true,
		});
	}

	async acceptOrderRequest(labOrders: any, userID: number) {
		let result = await Utils.setTransaction(async () => {
			let { requestLab, prescriptions, order_summary } = labOrders;

			let requestOrder: any = await TemporaryRequestLab.findOne({
				where: {
					id: requestLab.request_lab_id,
					order_type: "request",
				},
				raw: true,
			});

			if (!requestOrder)
				throw new BadRequestError("No Such Order Request exits for Laboratory");
			else {
				let isActive: boolean = await Utils.compareTime(requestOrder.updatedAt);
				if (!isActive) {
					throw new BadRequestError("Order Request Timeout");
				}
			}

			let orderReqAndBillingPromises: any[] = [];
			let updateLadTestPromises: any[] = [];
			if (prescriptions.length > 0) {
				orderReqAndBillingPromises.push(
					//update Requested Order
					TemporaryRequestLab.update(
						{
							accept_order_lab: true,
							order_status_code: 4,
						},
						{
							where: {
								id: requestLab.request_lab_id,
								lab_id: userID, //only lab employee can accept or decline the order for lab profile
							},
						}
					)
				);

				orderReqAndBillingPromises.push(
					//add Order Summary for Billing purpose
					TemporaryLabOrderSummary.create({
						...order_summary,
						lab_id: userID,
						temporary_request_lab_id: requestLab.request_lab_id,
					})
				);

				//add substitutes or update status for medicine that aren't available at Pharmacy
				for (let prescription of prescriptions) {
					let prescriptionCase: any = true;
					if (prescription.prescriptions_id) {
						prescriptionCase = {
							prescriptions_id: prescription.prescriptions_id,
						};
					}
					if (prescription.tests)
						for (let test of prescription.tests) {
							updateLadTestPromises.push(
								TemporaryLabTests.update(
									{
										is_lab_selected: test.is_lab_selected,
									},
									{
										where: {
											temporary_patient_order_lab_id:
												prescription.prescribed_order_id,
											lab_test_id: test.lab_test_id,
											...prescriptionCase,
										},
									}
								)
							);
						}
				}
				await Promise.all([
					...orderReqAndBillingPromises,
					...updateLadTestPromises,
				]);

				let [patient, lab] = await Promise.all([
					Users.findOne({
						where: {
							id: requestOrder.patient_id
						},
						attributes: [
							"contact_number"
						],
					}),
					this.getLabDetail(userID)
				]);

				let patientDetail: any = patient;
				let labDetails: any = lab;

				let dynamicPatienData = { labName: labDetails.workplace_name, orderId: requestOrder.order_id };
				await new Notifications().sendNotification("PATIENT_LAB_ORDER_COMPLETED", dynamicPatienData, { contact_number: [patientDetail.contact_number] })
			} else {
				throw new BadRequestError(
					"No prescriptions found for Test Order Request"
				);
			}

			return { msg: ResponseMessageEnum.LAB_ACCEPT_REQ_ORDER };
		});

		return result;
	}

	async declineOrderRequest(labOrders: any, userID: number) {
		let requestOrder: any = await TemporaryRequestLab.findOne({
			where: {
				id: labOrders.request_lab_id,
				order_type: "request",
			},
			raw: true,
		});

		if (!requestOrder)
			throw new BadRequestError("No Such Order Request exits for Laboratory");
		else {
			let isActive: boolean = await Utils.compareTime(requestOrder.updatedAt);
			if (!isActive) {
				throw new BadRequestError("Order Request Timeout");
			}
		}
		await TemporaryRequestLab.update(
			{
				is_cancelled: true,
				order_status_code: 12,
			},
			{
				where: { id: labOrders.request_lab_id, lab_id: userID },
			}
		);

		return { msg: "Request Order Declined By Laboratory" };
	}

	async getAcceptedOrders(lab_id: number, limit: number, offset: number) {
		TemporaryRequestLab.hasMany(TemporaryPatientOrderLab, {
			foreignKey: "temporary_request_lab_id",
		});
		TemporaryPatientOrderLab.belongsTo(TemporaryRequestLab, {
			foreignKey: "temporary_request_lab_id",
		});
		Users.hasOne(TemporaryPatientOrderLab, { foreignKey: "patient_id" });
		TemporaryPatientOrderLab.belongsTo(Users, {
			foreignKey: "patient_id",
		});
		Users.hasOne(PatientUser, { foreignKey: "user_id" });
		PatientUser.belongsTo(Users, { foreignKey: "user_id" });
		Address.hasOne(PatientUser, { foreignKey: "address_id" });
		PatientUser.belongsTo(Address, { foreignKey: "address_id" });

		let acceptedOrders: any[] = await TemporaryPatientOrderLab.findAll({
			where: {
				lab_id: lab_id,
			},
			attributes: [
				["order_id", "order_id"],
				["temporary_request_lab_id", "request_lab_id"],
				["lab_id", "lab_id"],
				["prescription_type", "prescription_type"],
				["custom_order", "custom_order"],
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
					model: TemporaryRequestLab,
					attributes: [],
					where: {
						order_type: "accept",
						accept_order_lab: 1,
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

	async cancelLabOrder(cancelOrder: any) {
		return Utils.setTransaction(async () => {
			let labRequest = await this.generateOriginalLabOrder(
				cancelOrder.order_request_lab_id,
				true
			);
			await LabCancelOrder.create(
				{ ...cancelOrder, order_request_lab_id: labRequest.id },
				{ raw: true }
			);
			return { msg: "Order Cancel Successfully" };
		});
	}

	async generateOriginalLabOrder(temporderID: any, is_cancelled: boolean, is_timed_out: boolean = false, is_for_cancel: boolean = false) {
		//Get Request Order
		let orderRequest: any = await TemporaryRequestLab.findOne({
			where: { id: temporderID },
			raw: true,
		});
		//Get Asscociated PresciptionOrder on that Order
		let prescribedOrders: any[] = await TemporaryPatientOrderLab.findAll({
			where: { temporary_request_lab_id: orderRequest.id },
			raw: true,
		});
		//Get Associated Tests on that PrescriptionOrder
		let prescribedTests: any[] = [];
		let orderIds: any[] = [];
		for (let order of prescribedOrders) {
			orderIds.push(order.id);
		}

		prescribedTests = await TemporaryLabTests.findAll({
			where: {
				temporary_patient_order_lab_id: {
					[Op.in]: orderIds,
				},
			},
			raw: true,
		});

		orderRequest.prescribedOrders = prescribedOrders.map((obj) => {
			obj.prescribedTests = prescribedTests.filter((mobj) => {
				return mobj.temporary_patient_order_lab_id === obj.id;
			});
			return obj;
		});

		let [order_summary, clearStatus] = (await Promise.all([
			TemporaryLabOrderSummary.findOne({
				where: { temporary_request_lab_id: temporderID },
				raw: true,
			}),
			//clear all temporary Entires for this Request Order
			is_timed_out ?
				this.clearOtherTemproryOrders(temporderID, orderRequest.order_id) :
				new PatientService().clearRemainingLabOrder({ id: temporderID }, true),
		])) as any;

		orderRequest.order_summary = order_summary;
		orderRequest.order_status_code = is_for_cancel ? OrderStatusEnum['Cancelled by Patient'] : is_timed_out ? OrderStatusEnum['Timed Out'] : is_cancelled ? 3 : 10;
		return this.generateOriginalLabRequest({
			...orderRequest,
			is_cancelled,
			is_timed_out
		});
	}

	async clearOtherTemproryOrders(currentOrderId: number, order_id: string) {

		let orderRequest: any = await TemporaryRequestLab.findAll({
			where: { order_id: order_id },
			raw: true,
		});
		let clearPromise: any = []
		orderRequest.map(async (singleOrder: any) => {
			clearPromise.push(await new PatientService().clearRemainingLabOrder({ id: singleOrder.id }, true))

		});

		await Promise.all(clearPromise)
		return true;

	}

	async generateOriginalLabRequest(orderRequest: any) {
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
			currentOrderRequest.lab_id = null;
		}
		let requestedOrder: any = await RequestLab.create(currentOrderRequest);

		if (!requestedOrder)
			throw new BadRequestError("Issue while generating Order for Lab request");
		if (!is_timed_out) {

			// create Order Summary
			delete order_summary.id;
			delete order_summary.temporary_request_lab_id;
			delete order_summary.updatedAt;
			order_summary.request_lab_id = requestedOrder.id;
			let orderSummary: any = await LabOrderSummary.create(order_summary);

			if (!orderSummary)
				throw new BadRequestError(
					"Issue while generating Order Summary for Lab request"
				);
		}
		let genrateLabOrderPromises = [];
		for (let order of prescribedOrders) {
			genrateLabOrderPromises.push(
				this.generateOriginalPatientOrderLab(order, requestedOrder.id, is_timed_out)
			);
		}
		await Promise.all(genrateLabOrderPromises);
		return requestedOrder;
	}

	async generateOriginalPatientOrderLab(
		prescribedOrder: any,
		request_lab_id: number,
		is_timed_out: boolean = false
	) {
		let { prescribedTests, ...currentOrder } = prescribedOrder;
		delete currentOrder.id;
		delete currentOrder.temporary_request_lab_id;
		if (is_timed_out) {
			currentOrder.lab_id = null;
		}
		let labOrder: any = await PatientOrderLab.create({
			...currentOrder,
			request_lab_id,
		});

		if (!labOrder)
			throw new BadRequestError(
				"Issue while generating Order for Patient Order Laboratory"
			);

		let genrateLabTestInfoPromises = [];
		for (let test of prescribedTests) {
			genrateLabTestInfoPromises.push(
				this.generateOriginalPharmacyRxInformation(test, labOrder.id)
			);
		}
		await Promise.all(genrateLabTestInfoPromises);
	}

	async generateOriginalPharmacyRxInformation(
		prescribedTests: any,
		patient_order_lab_id: number
	) {
		delete prescribedTests.id;
		delete prescribedTests.temporary_patient_order_lab_id;
		let labTestInfo: any = await LaboratoryLabTests.create({
			...prescribedTests,
			patient_order_lab_id,
		});

		if (!labTestInfo)
			throw new BadRequestError(
				"Issue while generating Order for Lab Test Information"
			);
	}

	async markOrderAsDelivered(order: any, user: any) {
		return Utils.setTransaction(async () => {
			let response = await this.generateOriginalLabOrder(order.order_request_lab_id, false);

			let [patient, lab] = await Promise.all([
				Users.findOne({
					where: {
						id: response.patient_id
					},
					attributes: [
						[
							fn("CONCAT", col("first_name"), " ", col("last_name")),
							"name",
						],
					],
				}),
				this.getLabDetail(user.id)
			]);

			let patientDetail: any = patient;
			let labDetails: any = lab;

			let dynamicData = { patientName: patientDetail.name, orderId: response.order_id };
			let dynamicPatienData = { labName: labDetails.workplace_name, orderId: response.order_id };
			await Promise.all([new Notifications().sendNotification(user.isAdmin == 1 ? "LAB_ADMIN_ORDER_COMPLETED" : "LAB_EMPLOYEE_ORDER_COMPLETED", dynamicData, { contact_number: [user.contact_number] }), new Notifications().sendNotification("PATIENT_LAB_ORDER_COMPLETED", dynamicPatienData, { contact_number: [user.contact_number] })])
			return { msg: "Order Marked as Delivered Successfully" };
		});
	}

	async getLabDetail(userId: number) {
		Users.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
		LabWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });
		LabWorkplaces.hasOne(LabWorkplaceUsers, {
			foreignKey: "workplace_id",
		});
		LabWorkplaceUsers.belongsTo(LabWorkplaces, {
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
					model: LabWorkplaceUsers,
					attributes: [],
					include: [
						{
							model: LabWorkplaces,
							attributes: []
						},
					],
				},
			],
			raw: true,
		});
	}

	async getPastOrders(
		lab_id: number,
		limit: number,
		offset: number,
		date: string
	) {
		RequestLab.hasOne(PatientOrderLab, {
			foreignKey: "request_lab_id",
		});
		PatientOrderLab.belongsTo(RequestLab, {
			foreignKey: "request_lab_id",
		});
		Users.hasOne(RequestLab, { foreignKey: "patient_id" });
		RequestLab.belongsTo(Users, { foreignKey: "patient_id" });

		let dateCase = date
			? {
				[Op.and]: [
					Sequelize.where(
						Sequelize.fn("date", Sequelize.col("request_lab.createdAt")),
						"=",
						date
					),
				],
			}
			: {};

		let pastOrders = await RequestLab.findAll({
			where: {
				lab_id: lab_id,
				//is_cancelled: 0, //cancelled orders will not show in lab Past order
				...dateCase,
			},
			attributes: [
				["id", "id"],
				["order_id", "order_id"],
				["order_status", "order_status"],
				["patient_id", "patient_id"],
				["is_cancelled", "is_cancelled"],
				["createdAt", "createdAt"],
				["updatedAt", "updatedAt"],
				[fn("", col("prescription_type")), "prescription_type"],
				[fn("", col("custom_order")), "custom_order"],
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
					model: PatientOrderLab,
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
			group: ["order_id"],
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
		DrPatientAppoiment.hasOne(PatientOrderLab, {
			foreignKey: "booking_id",
		});
		PatientOrderLab.belongsTo(DrPatientAppoiment, {
			foreignKey: "booking_id",
		});
		dr_Workplaces.hasOne(DrPatientAppoiment, { foreignKey: "workplace_id" });
		DrPatientAppoiment.belongsTo(dr_Workplaces, { foreignKey: "workplace_id" });
		Users.hasOne(PatientOrderLab, { foreignKey: "doctor_id" });
		PatientOrderLab.belongsTo(Users, { foreignKey: "doctor_id" });
		Users.hasOne(DrSpeciality, { foreignKey: "d_id" });
		DrSpeciality.belongsTo(Users, { foreignKey: "d_id" });
		Speciality.hasOne(DrSpeciality, { foreignKey: "speciality_id" });
		DrSpeciality.belongsTo(Speciality, { foreignKey: "speciality_id" });

		let orderedPrescriptions = await PatientOrderLab.findAll({
			where: {
				order_id: order_id,
				prescription_type: "electronic",
			},
			attributes: [
				["id", "order_lab_id"],
				["order_id", "order_id"],
				["prescription_id", "prescription_id"],
				["scanned_doc_id", "scanned_doc_id"],
				["prescription_type", "prescription_type"],
				["patient_id", "patient_id"],
				["booking_id", "booking_id"],
				["doctor_id", "doctor_id"],
				[fn("CONCAT", col("first_name"), " ", col("last_name")), "doctor_name"],
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("GROUP_CONCAT", fn("DISTINCT", col("name"))), "specialities"],
				[fn("", col("date")), "date"],
				[fn("", col("end_time")), "end_time"],
				//[fn("CONCAT", `${AWS_FILE_UPLOAD_LINK}/`, col("lab_test_report")), "lab_test_report"]
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
			let fetchLabTestInfoPromises: any[] = [];
			for (let prescription of orderedPrescriptions) {
				fetchLabTestInfoPromises.push(
					this.formatPastOrderedLabTestData(prescription)
				);
			}
			let orderedPrescription: any = await Promise.all(
				fetchLabTestInfoPromises
			);
			let order_summary: any = await LabOrderSummary.findOne({
				where: { order_id: order_id },
				raw: true,
			});
			return { prescriptions: orderedPrescription, order_summary };
		}

		return { msg: "No Prescription Data found" };
	}

	async formatPastOrderedLabTestData(prescriptions: any) {
		prescriptions.specialities = prescriptions.specialities
			? prescriptions.specialities.split(",")
			: [];

		let tests = await LaboratoryLabTests.findAll({
			attributes: [
				"test_name",
				"details",
				"mrp",
				"is_home_collection",
				"home_collection_charges",
				"is_lab_selected",
				[
					fn("CONCAT", `${AWS_FILE_UPLOAD_LINK}/`, col("lab_test_report")),
					"lab_test_report",
				],
			],
			where: {
				patient_order_lab_id: prescriptions.order_lab_id,
			},
			raw: true,
		});

		prescriptions.tests = tests;
		return prescriptions;
	}

	async getPastScannedOrders(order_id: string) {
		UserScannedDocument.hasOne(PatientOrderLab, {
			foreignKey: "scanned_doc_id",
		});
		PatientOrderLab.belongsTo(UserScannedDocument, {
			foreignKey: "scanned_doc_id",
		});

		Users.hasOne(PatientOrderLab, { foreignKey: "patient_id" });
		PatientOrderLab.belongsTo(Users, { foreignKey: "patient_id" });

		const data = await UserScannedDocument.findAll({
			include: [
				{
					model: PatientOrderLab,
					required: true,
					attributes: [],
					where: {
						order_id: order_id,
						//prescription_type: "scanned",
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
				[fn("", col("lab_id")), "lab_id"],
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
				lab_id: current.lab_id,
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
	async getScannedPrescription(request_lab_id: number) {
		UserScannedDocument.hasOne(TemporaryPatientOrderLab, {
			foreignKey: "scanned_doc_id",
		});
		TemporaryPatientOrderLab.belongsTo(UserScannedDocument, {
			foreignKey: "scanned_doc_id",
		});

		Users.hasOne(TemporaryPatientOrderLab, { foreignKey: "patient_id" });
		TemporaryPatientOrderLab.belongsTo(Users, { foreignKey: "patient_id" });

		const data = await UserScannedDocument.findAll({
			include: [
				{
					model: TemporaryPatientOrderLab,
					required: true,
					attributes: [],
					where: {
						temporary_request_lab_id: request_lab_id,
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
				[fn("", col("temporarypatient_order_lab.id")), "prescribed_order_id"],
				[fn("", col("temporary_request_lab_id")), "request_pharmacy_id"],
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
					file_name: current.file_name,
					link: current.link,
					original_file_name: current.original_file_name,
				});
				return acc;
			}

			const obj = {
				order_id: current.order_id,
				prescribed_order_id: current.prescribed_order_id,
				request_lab_id: current.request_lab_id,
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

	async viewCustomOrderDetails(request_id: number) {
		let [scannedPrescriptionData, orderedPrescriptions] = (await Promise.all([
			this.getScannedPrescription(request_id),
			TemporaryPatientOrderLab.findAll({
				where: {
					temporary_request_lab_id: request_id,
					prescription_type: "electronic",
					custom_order: 1,
				},
				attributes: [
					["order_id", "order_id"],
					["id", "prescribed_order_id"],
					["scanned_doc_id", "scanned_doc_id"],
					["prescription_type", "prescription_type"],
					["custom_order", "custom_order"],
					["lab_id", "lab_id"],
					["temporary_request_lab_id", "temporary_request_lab_id"],
				],
				raw: true,
				group: ["scanned_doc_id"],
			}),
		])) as any;

		if (orderedPrescriptions.length > 0) {
			let [tests, order_summary, lab_delivery_info] = await Promise.all([
				this.formatCustomPrescibedTestData(orderedPrescriptions[0]),
				TemporaryLabOrderSummary.findOne({
					where: { temporary_request_lab_id: request_id },
					raw: true,
				}),
				this.LabDeliveryInfoFromOrderRequest(request_id),
			]);
			return {
				electronic_prescription: orderedPrescriptions,
				scanned_prescription: scannedPrescriptionData,
				ordered_tests: tests,
				order_summary,
				lab_delivery_info,
			};
		}

		return { msg: "No Custom Prescription Data found" };
	}

	async formatCustomPrescibedTestData(prescriptions: any) {
		return TemporaryLabTests.findAll({
			attributes: [
				"lab_test_id",
				"test_name",
				"details",
				"mrp",
				"is_home_collection",
				"home_collection_charges",
				"is_lab_selected",
				"lab_test_report",
			],
			where: {
				temporary_patient_order_lab_id: prescriptions.prescribed_order_id,
			},
			raw: true,
		});
	}

	async viewPastCustomOrderDetails(order_id: string) {
		let [scannedPrescriptionData, orderedPrescriptions] = (await Promise.all([
			this.getPastScannedOrders(order_id),
			await PatientOrderLab.findAll({
				where: {
					order_id: order_id,
					prescription_type: "electronic",
					custom_order: 1,
				},
				attributes: [
					["id", "order_lab_id"],
					["order_id", "order_id"],
					["scanned_doc_id", "scanned_doc_id"],
					["prescription_type", "prescription_type"],
					["custom_order", "custom_order"],
					["lab_id", "lab_id"],
					["request_lab_id", "request_lab_id"],
				],
				raw: true,
				group: ["scanned_doc_id"],
			}),
		])) as any;

		if (orderedPrescriptions.length > 0) {
			let [tests, order_summary] = await Promise.all([
				this.formatPastCustomPrescibedTestData(orderedPrescriptions[0]),
				LabOrderSummary.findOne({
					where: { order_id: order_id },
					raw: true,
				}),
			]);

			return {
				electronic_prescription: orderedPrescriptions,
				scanned_prescription: scannedPrescriptionData,
				ordered_tests: tests,
				order_summary,
			};
		}

		return { msg: "No Prescription Data found" };
	}

	async formatPastCustomPrescibedTestData(prescriptions: any) {
		return LaboratoryLabTests.findAll({
			attributes: [
				"test_name",
				"details",
				"mrp",
				"is_home_collection",
				"home_collection_charges",
				"is_lab_selected",
				[
					fn("CONCAT", `${AWS_FILE_UPLOAD_LINK}/`, col("lab_test_report")),
					"lab_test_report",
				],
			],
			where: {
				patient_order_lab_id: prescriptions.order_lab_id,
			},
			raw: true,
		});
	}
}
