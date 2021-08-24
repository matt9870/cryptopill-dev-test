import {
	NotFoundError,
	UnauthorizedError,
	BadRequestError,
} from "routing-controllers";
import Users from "../../../models/users.model";
const otpGenerator = require("otp-generator");
import { ResponseMessageEnum } from "../../../constants/constant.enum";
import { Utils, Notifications } from "../../../helpers";
import UserRole from "../../../models/user_role.model";
import Roles from "../../../models/roles.model";
import Identity from "../../../models/identity.model";
import { DoctorService } from "../doctor/doctor.service";
import LabWorkplaces from "../../../models/lab_workplaces.model";
import PharmacyWorkplaces from "../../../models/pharmacy_workplaces.model";
import { LaboratoryService } from "../../mobile/laboratory/laboratory.service";
import { PharmacyService } from "../pharmacy/pharmacy.service";
import LabInformation from "../../../models/lab_information.model";
import PharmacyInformation from "../../../models/pharmacy_information.model";
import { DoctorStaffService } from "../doctorstaff/doctorstaff.service";
import UserEmergencyContact from "../../../models/user_emergency_contact.model";
import PatientUser from "../../../models/patient_user.model";
import Address from "../../../models/address.model";
import * as moment from "moment";
import { FileService } from "../../shared/file.service";
import { RolesEnum } from "../../../constants/roles.enum";
import dr_Workplaces from "../../../models/dr_workplaces.model";
import { UserRoleService } from "../../shared/user-role.service";
import DrWorkplaceUsers from "../../../models/dr_workplace_users.model";
import LabWorkplaceUsers from "../../../models/lab_workplace_users.model";
import PharmacyWorkplaceUsers from "../../../models/pharmacy_workplace_users.model";
import DrDelegate from "../../../models/dr_delegate.model";
import { Op, fn, col, } from "sequelize";
import { StatusCode } from "../../../constants/status_code.enum";
import ProfileDetails from "../../../models/profile_details.model";
import DrUsers from "../../../models/dr_users.model";
const AccessToken = require('twilio').jwt.AccessToken;
import { get } from "config";
const secrets: any = get("APP");
import DrPatientAppoiment from "../../../models/dr_patient_appoiment.model";
import TemporaryRequestPharmacy from "../../../models/temporary_request_pharmacy.model";
import TemporaryRequestLab from "../../../models/temporary_request_lab.model";
import RequestPharmacy from "../../../models/request_pharmacy.model";
import RequestLab from "../../../models/request_lab.model";
import sequelize from "../../../db/sequalise";
import AdminRoles from "../../../models/admin_roles.model";
import AdminRoleAssigned from "../../../models/admin_role_assigned.model";
import AdminRolePermission from "../../../models/admin_role_permission.model";


export class UserService {
	async requestOTP(post: any, isMinor: boolean = false) {
		const OTP = Utils.generateOPT();
		post.phone_otp = OTP;
		post.otp_timer = new Date();
		// const optSent = await Utils.sendMessage(
		// 	`Welcome to Cryptopill. Your verification OTP: ${OTP}`,
		// 	post.contact_number
		// );

		let key = post.role_id == RolesEnum.Patient ? "PATIENT_MOBILE_OTP_VERIFICATION" : (post.role_id == RolesEnum.Doctor ? "DOCTOR_MOBILE_OTP_VERIFICATION" : (post.role_id == RolesEnum.Staff ? "DELEGATE_MOBILE_OTP_VERIFICATION" : (post.role_id == RolesEnum.Pharmacy ? "PHARM_ADMIN_MOBILE_OTP_VERIFICATION" : (post.role_id == RolesEnum.Laboratory ? "LAB_ADMIN_MOBILE_OTP_VERIFICATION" : ""))));
		let dynamicData = {
			OTP: OTP
		}
		let msgSent = await new Notifications().sendNotification(key, dynamicData, { email: post?.email ? [post.email] : [], contact_number: [post.contact_number] }, false);

		// if (!!optSent && optSent.sid) {
		if (!!msgSent) {
			// const result = await this.upsertUserDetails(post);
			const result = isMinor ? await this.updateMinorToNew(post) : await this.upsertUserDetails(post);
			let user: any = {
				id: result,
				msg: ResponseMessageEnum.OTP_SENT,
			};
			return user;
		}
		return ResponseMessageEnum.OTP_SENT_FAIL;
	}

	async upsertUserDetails(userObj: any) {
		const ID = {} as any;
		if (!userObj.id) {
			const max = await Users.max("id");
			const user_id = isNaN(max) ? 1 : max + 1;
			// ID["id"] = user_id;
			userObj.id = user_id;
		}
		userObj.default_role = userObj.role_id;
		userObj.image_status_code = null;
		userObj.password = Utils.encrypt(userObj.password);
		const result = await Users.upsert(
			{ ...userObj },
			{
				returning: true,
			}
		);

		const userInfo: any = await this.isUserExists(userObj.contact_number);

		await this.saveUserRole(userObj.id, userObj.role_id);

		return userInfo.id;
	}

	async updateMinorToNew(userObj: any) {
		const ID = {} as any;

		const result = await Users.update(
			{ ...userObj },
			{
				where: {

					id: userObj.id
				}
			}
		);

		const userInfo: any = await this.isUserExists(userObj.contact_number);



		return userInfo.id;
	}

	async verifyOTP(otpInfo: any, isMinor: boolean = false) {
		let { ph_number, otp } = otpInfo;

		const optCheck: any = await Users.findOne({
			where: {
				contact_number: ph_number,
				phone_otp: otp,
			},
		});

		if (!!optCheck) {
			const isOTPExpire =
				moment(new Date()).diff(optCheck.otp_timer, "s") >= 90;

			if (isOTPExpire) {
				throw new BadRequestError("Otp Expire.");
			}
			let updateDataForMinor = {};
			if (isMinor) {
				updateDataForMinor = {
					parent_id: null,
					is_minor_account: 0,
					phone_otp: null
				}
				let currentUser: any = await Users.findOne({
					where: {
						id: otpInfo.id
					}
				})
				let paretntAddress: any = await PatientUser.findOne({
					where: {
						user_id: currentUser.parent_id
					}
				})
				await PatientUser.update({
					address_id: paretntAddress.address_id,
				}, {
					where: {
						user_id: otpInfo.id
					}
				});
			}
			await Users.update(
				{
					phone_verify: 1,
					...updateDataForMinor
				},
				{
					where: {
						contact_number: ph_number,
					},
				}
			);
			return {
				message: "OTP verified successfully.",
				id: optCheck.id,
			};
		} else {
			throw new NotFoundError(`OTP verification failed`);
		}
	}

	public generateOPT() {
		const otp = otpGenerator.generate(6, {
			digits: true,
			alphabets: false,
			upperCase: false,
			specialChars: false,
		});

		return otp;
	}

	async savePassword(body: any) {
		const { password, id } = body;
		const encryptData = Utils.encrypt(password);
		body.password = encryptData;
		const result = Users.update(
			{
				password: encryptData,
			},
			{
				where: {
					id: id,
				},
			}
		);
		return result;
	}

	async saveContactPassword(body: any) {
		const { password, contact_number } = body;
		const encryptData = Utils.encrypt(password);
		body.password = encryptData;
		const result = Users.update(
			{
				password: encryptData,
			},
			{
				where: {
					contact_number: contact_number,
				},
			}
		);
		return result;
	}

	private async saveUserRole(user_id: number, role_id: number) {
		// default status code for user is 1 i.e Verified
		let otherInfo = { isWorkplaceAdmin: 0, status_code: StatusCode.Verified };
		if (
			role_id === RolesEnum.Doctor ||
			role_id === RolesEnum.Pharmacy ||
			role_id === RolesEnum.Laboratory
		) {
			otherInfo.isWorkplaceAdmin = 1;
		}

		// for doctor role .. set status to Unverified (new) i.e status_code = 2
		if (role_id === RolesEnum.Doctor) {
			otherInfo.status_code = StatusCode.New_User;
		}

		await new UserRoleService().upsertUserRole({
			role_id: role_id,
			user_id: user_id,
			...otherInfo,
		});
	}

	async login(
		contact_number: string,
		pswrd: string,
		deviceToken: string,
		deviceType: string,
		fcmToken: string = ""
	) {
		const userValidate = await this.isUserExists(contact_number);

		if (!userValidate) {
			throw new NotFoundError(`Contact number does not exists or invalid`);
		}

		if (userValidate) {
			delete userValidate.token;
			delete userValidate.created_at;
			delete userValidate.updated_at;
			delete userValidate.otp_timer;
			delete userValidate.phone_otp;
			delete userValidate.token
		}

		if (userValidate.phone_verify == false) {
			throw new NotFoundError(`Contact number is not verifed`);
		}

		// if (userValidate.account_activation == false) {
		// 	throw new NotFoundError(`Admin side account verification is remaining`);
		// }

		const userData = await this.isUserRole(
			userValidate.id,
			userValidate.default_role
		);

		// check verify flag only if user has complete its setup profile
		if (userValidate && userData) {
			if (userData.isSetupComplete && userData.status_code == StatusCode.Declined) {
				throw new NotFoundError(ResponseMessageEnum.DECLINED_MESSAGE);
			}
			if (userData.isSetupComplete && userData.status_code == StatusCode.Unverified_new) {
				throw new NotFoundError(ResponseMessageEnum.UNVERIFIED_NEW_MESSAGE);
			}
		}

		if (userData && !userData.active_status) {
			throw new UnauthorizedError("User Account is deactivated. Contact Admin");
		}

		const decryptedPassword = Utils.decrypt(userValidate.password);
		if (pswrd === decryptedPassword) {
			delete userValidate.password;
			userValidate.role_id = userData["role_id"];
			userValidate.role = userData["role.role"];
			userValidate.isWorkplaceAdmin = userData["isWorkplaceAdmin"];

			const profile_image_name =
				userValidate.new_profile_image || userValidate.profile_image;

			if (!!profile_image_name) {
				const { id, role_id } = userValidate;
				userValidate.profile_image = await new FileService().getProfileImageLink(
					id,
					role_id,
					profile_image_name
				);
			}
			const tokenOpts = {
				expireIn: "15d",
			};
			const token = Utils.createJWTToken(userValidate, tokenOpts);
			//delete fcm token of other users if it has same fcm token
			if (fcmToken != "") {
				await Users.update(
					{ fcmToken: null },
					{
						where: {
							fcmToken: fcmToken,
							contact_number: {
								[Op.not]: contact_number
							}
						}
					}
				);
			}
			//const token = Utils.createJWTToken(userValidate);
			const updateUser = await this.userUpdate(
				userValidate.id,
				token,
				deviceToken,
				deviceType,
				fcmToken
			);

			const documents: any = await Identity.findOne({
				where: { user_id: userValidate.id },

				attributes: ["type", "number"],
				raw: true
			});
			return {
				token: token,
				default_role: userValidate.default_role,
				id: userValidate.id,
				isSetupComplete: userData.isSetupComplete,
				profile_image: userValidate.profile_image,
				first_name: userValidate.first_name,
				middle_name: userValidate.middle_name,
				last_name: userValidate.last_name,
				DOB: userValidate.birth_date,
				document_number: documents ? documents.number : "",
				document_type: documents ? documents.type : "",
				verified_on: userData.verified_on ? moment(userData.verified_on).format('YYYY-MM-DD hh:mm') : null
			};
		}
		throw new UnauthorizedError("Invalid Password");
	}

	public async isUserExists(contact_number: string, user_id?: number) {
		const searchCondition: any = {}
		if (!!user_id) {
			searchCondition["id"] = {
				[Op.not]: user_id
			};
		}
		const userValidate: any = await Users.findOne({
			where: {
				contact_number: contact_number,
				...searchCondition
			},
		});

		return userValidate;
	}

	public async isUserRole(user_id: number, role_id: number) {
		Roles.hasOne(UserRole, { foreignKey: "role_id" });
		UserRole.belongsTo(Roles, { foreignKey: "role_id" });

		Users.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });

		const userData: any = await UserRole.findOne({
			include: [
				{
					model: Roles,
				},
				{
					model: Users,
				},
			],
			where: {
				user_id: user_id,
				role_id: role_id,
			},
			raw: true,
		});
		return userData;
	}

	async forgotPassword(ph_number: string) {
		const existingUser = await this.isUserExists(ph_number);
		if (!!existingUser) {
			const otp = Utils.generateOPT();
			const msgSent = await Utils.sendMessage(`OTP: ${otp}`, ph_number);
			if (msgSent && msgSent.sid) {
				const update = await Users.update(
					{
						phone_otp: otp,
						otp_timer: new Date(),
					},
					{
						where: {
							contact_number: ph_number,
						},
					}
				);

				return ResponseMessageEnum.OTP_SENT;
			} else {
				return ResponseMessageEnum.OTP_SENT_FAIL;
			}
		} else {
			throw new UnauthorizedError("Invalid user");
		}
	}

	async userDelete(userId: number, roleId?: number) {
		await UserRole.destroy({
			where: {
				user_id: userId,
				// role_id: roleId,
			},
		});

		await Identity.destroy({
			where: {
				user_id: userId,
			},
		});

		await UserEmergencyContact.destroy({
			where: {
				user_id: userId,
			},
		});

		await DrWorkplaceUsers.destroy({
			where: {
				user_id: userId,
			},
		});

		await LabWorkplaceUsers.destroy({
			where: {
				user_id: userId,
			},
		});

		await PharmacyWorkplaceUsers.destroy({
			where: {
				user_id: userId,
			},
		});
		await PatientUser.destroy({
			where: {
				user_id: userId,
			},
		});

		await DrDelegate.destroy({
			where: {
				[Op.or]: [{ doctor_id: userId }, { staff_id: userId }],
			},
		});

		await DrUsers.destroy({
			where: {
				doctor_id: userId
			},
		});

		await ProfileDetails.destroy({
			where: {
				user_id: userId
			},
		});

		await DrPatientAppoiment.destroy({
			where: {
				[Op.or]: [
					{
						doctor_id: userId
					},
					{
						patient_id: userId
					}
				]
			}
		});

		TemporaryRequestPharmacy.destroy({
			where: {
				[Op.or]: [{
					pharmacy_id: userId
				}, {
					patient_id: userId
				}]
			}
		})

		TemporaryRequestLab.destroy({
			where: {
				[Op.or]: [{
					lab_id: userId
				}, {
					patient_id: userId
				}]
			}
		});

		RequestPharmacy.destroy({
			where: {
				[Op.or]: [{
					pharmacy_id: userId
				}, {
					patient_id: userId
				}]
			}
		})

		RequestLab.destroy({
			where: {
				[Op.or]: [{
					lab_id: userId
				}, {
					patient_id: userId
				}]
			}
		})
		// await LabWorkplaces.destroy({
		// 	where: {
		// 		user_id: userId
		// 	}
		// })

		// await PharmacyWorkplaces.destroy({
		// 	where: {
		// 		user_id: userId
		// 	}
		// })

		// await Address.destroy({
		// 	where: {
		// 		user_id: userId,
		// 	},
		// });

		let user = await Users.destroy({
			where: {
				id: userId,
			},
		});

		return user;
	}

	async updateUserRole(userObj: any) {
		await Users.update(
			{ default_role: userObj.default_role },
			{
				where: {
					id: userObj.user_id,
				},
			}
		);
	}

	public async updateProfileSetup(userId: number, role_id: number) {
		await UserRole.update({ isSetupComplete: 1 }, { where: { user_id: userId } });
		//update default role at setup profile
		await Users.update({ default_role: role_id }, { where: { id: userId } });
	}

	async deleteAllUserDetails(contact_number: string, role: string) {
		//alaway use trycatch for handling mysql thrown exception
		try {
			//check user & fetch its id
			if (!contact_number || !role) {
				throw new Error("Please entry proper contact number & role");
			}

			const user: any = await Users.findOne({
				attributes: ["id"],
				where: {
					contact_number: contact_number,
				},
			});

			let userRole = role.toLowerCase();
			if (userRole === "laboratory" || userRole === "pharmacy") {
				let wkpObj: any = {};
				//fetch workplace id from userId
				let wkp: any = await dr_Workplaces.findOne({
					where: {
						user_id: user.id,
					},
				});
				wkpObj.workplace_id = wkp.id;
				let commonWkp: any =
					userRole === "laboratory"
						? await LabWorkplaces.findOne({
							where: { workplaces_id: wkpObj.workplace_id },
						})
						: await PharmacyWorkplaces.findOne({
							where: { workplaces_id: wkpObj.workplace_id },
						});

				let commonSrv;
				if (userRole === "laboratory") {
					await LabInformation.destroy({
						where: { workplaces_id: wkpObj.workplace_id },
					});

					wkpObj.lab_workplace_id = commonWkp.id;
					commonSrv = new LaboratoryService();
				} else {
					await PharmacyInformation.destroy({
						where: { workplaces_id: wkpObj.workplace_id },
					});

					wkpObj.pharma_workplace_id = commonWkp.id;
					commonSrv = new PharmacyService();
				}

				await commonSrv.removeSetupProfileDetails(wkpObj);
				commonSrv = undefined;
			} else if (userRole === "doctor") {
				let docObj: any = {
					doctor_id: user.id,
				};

				let wkpObjArr = await dr_Workplaces.findAll({
					attributes: ["id"],
					where: {
						user_id: user.id,
					},
				});

				docObj.doctorWorkplaces = wkpObjArr.reduce(
					(workplaces: number[], currentObj: any) => {
						return workplaces.push(currentObj.id);
					},
					[]
				);
				let doctorSrv = new DoctorService();
				await doctorSrv.friendlyRollback(docObj);
				doctorSrv = undefined;
			} else if (userRole === "staff") {
				let staffServ = new DoctorStaffService();
				await staffServ.removeSetUpProfileDetails(user.id);
				staffServ = undefined;
			}

			await UserRole.destroy({
				where: {
					user_id: user.id,
				},
			});

			await Identity.destroy({
				where: {
					user_id: user.id,
				},
			});

			await Users.destroy({
				where: {
					id: user.id,
				},
			});

			return { msg: "User deleted with all profile data" };
		} catch (error) {
			return error;
		}
	}

	async resendOTP(post: any) {
		const OTP = await Utils.generateOPT();
		post.phone_otp = OTP;

		const isUserExists = await Users.findOne({
			where: { contact_number: post.contact_number },
		});

		if (!isUserExists) {
			throw new Error("User not Exists");
		}
		const optSent = await Utils.sendMessage(
			`Welcome to Cryptopill. Your verification OTP: ${OTP}`,
			post.contact_number
		);

		if (!!optSent && optSent.sid) {
			const result = await Users.update(
				{ phone_otp: post.phone_otp, otp_timer: new Date() },
				{ where: { contact_number: post.contact_number } }
			);

			return { msg: ResponseMessageEnum.OTP_RESEND };
		}
		return ResponseMessageEnum.OTP_SENT_FAIL;
	}

	public async userUpdate(
		userId: number,
		token: string,
		deviceToken: string,
		deviceType: string,
		fcmToken: string = ""
	) {
		let updateData: any = {
			token: token,
			deviceToken: deviceToken,
			deviceType: deviceType,
		};
		if (fcmToken != "") {
			updateData.fcmToken = fcmToken;
		}
		return await Users.update(
			{
				...updateData
			},
			{ where: { id: userId } }
		);
	}

	public async logout(id: number) {
		return await Users.update(
			{
				fcmToken: null,
				token: null,
				deviceToken: null,
			},
			{ where: { id: id } }
		);
	}

	//Only for Password Updation
	async changePassword(body: any, userID: number) {
		const { current_password, new_password, confirm_new_password } = body;

		if (new_password !== confirm_new_password) {
			throw new BadRequestError(ResponseMessageEnum.CONFIRM_PASSWORD_INCORRECT);
		}
		let encryptData = Utils.encrypt(new_password);
		let dataInDB: any = await Users.findOne({
			attributes: ["password"],
			where: { id: userID },
			raw: true,
		});
		let existingPassword = Utils.decrypt(dataInDB.password);
		if (current_password !== existingPassword) {
			throw new BadRequestError(ResponseMessageEnum.INVALID_PASSWORD);
		}
		await Users.update({ password: encryptData }, { where: { id: userID } });
		return { msg: ResponseMessageEnum.SUCCESS_PASSWORD_CHANGED };
	}

	async switchUserRole(reqBody: any, userTokenData: any) {
		const response = await Utils.setTransaction(async () => {
			// check if user role exists
			const userValidate = await this.isUserExists(userTokenData.contact_number);

			if (!userValidate) {
				throw new NotFoundError(`Contact number does not exists or invalid`);
			}

			if (userValidate) {
				delete userValidate.token;
				delete userValidate.created_at;
				delete userValidate.updated_at;
				delete userValidate.otp_timer;
				delete userValidate.phone_otp;
				delete userValidate.token
			}

			if (userValidate.phone_verify == false) {
				throw new NotFoundError(`Contact number is not verifed`);
			}

			let userData: any = await this.isUserRole(
				userValidate.id,
				reqBody.role_id
			);

			// Add User role if not exists
			if (!userData || !userData.id) {
				// create User Role
				await this.saveUserRole(userValidate.id, reqBody.role_id);
				// update userdata
				userData = await this.isUserRole(
					userValidate.id,
					reqBody.role_id
				);
			} else {
				// check verify flag only if user has complete its setup profile
				if (userValidate && userData) {
					if (userData.isSetupComplete && userData.status_code == StatusCode.Declined) {
						throw new NotFoundError(ResponseMessageEnum.DECLINED_MESSAGE);
					}
					if (userData.isSetupComplete && userData.status_code == StatusCode.Unverified_new) {
						throw new NotFoundError(ResponseMessageEnum.UNVERIFIED_NEW_MESSAGE);
					}
				}

				if (userData && !userData.active_status) {
					throw new UnauthorizedError("User Account is deactivated. Contact Admin");
				}
			}

			// update default role & token for the role user switched to
			if (userData && userData.isSetupComplete) {
				//Only Update Role in case of isSetupComplete is done for switched role
				userValidate.default_role = reqBody.role_id;
				await Users.update({ default_role: reqBody.role_id }, { where: { id: userValidate.id } });
			}

			const tokenOpts = {
				expireIn: "15d",
			};
			// Generate new Token
			const token = Utils.createJWTToken(userValidate, tokenOpts);
			const updateUser = await this.userUpdate(
				userValidate.id,
				token,
				userTokenData.deviceToken,
				userTokenData.deviceType
			);
			const documents: any = await Identity.findOne({
				where: { user_id: userValidate.id },

				attributes: ["type", "number"],
				raw: true
			});

			return {
				token: token,
				default_role: userValidate.default_role,
				id: userValidate.id,
				isSetupComplete: userData.isSetupComplete,
				profile_image: userValidate.profile_image,
				first_name: userValidate.first_name,
				middle_name: userValidate.middle_name,
				last_name: userValidate.last_name,
				DOB: userValidate.birth_date,
				document_number: documents ? documents.number : "",
				document_type: documents ? documents.type : "",
				verified_on: userData && userData.verified_on ? moment(userData.verified_on).format('YYYY-MM-DD hh:mm') : null
			};
		});

		return response;
	}

	async generateTwillioRoomAccessToken(user_id: number, user_name: string, booking_id: number) {
		//dummy credential for test account
		const DEMO_ACCOUNT_SID = "ACe9b39eb400c08fa8ff6738500ede100d";
		const DEMO_AUTH_TOKEN = "d8fc3ca430aad6cb053564521b4d87c3";
		const VideoGrant = AccessToken.VideoGrant;
		const { JWT_SECRET }: any = secrets;
		//console.log(`${DEMO_ACCOUNT_SID}, ${DEMO_AUTH_TOKEN}`);
		// Used when generating any kind of Access Token
		const twilioAccountSid = DEMO_ACCOUNT_SID;
		const twilioApiKey = DEMO_AUTH_TOKEN;
		const twilioApiSecret = JWT_SECRET;//await Utils.generateSecretToken();

		// Createan access token which we will sign and return to the client,
		// containing the grant we just created
		const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret);
		token.identity = `${user_name}_${user_id}`;

		// Create a Video grant which enables a client to use Video 
		// and limits access to the specified Room (DailyStandup)
		const videoGrant = new VideoGrant({
			room: `booking_${booking_id}`
		});

		// Add the grant to the token
		token.addGrant(videoGrant);

		// Serialize the token to a JWT string
		let twillioToken = token.toJwt();
		return { twillioToken };
	}

	async getVideoCallRecordingUrl(token: any, limit: number = 10, offset: number = 0) {
		//dummy credential for test account
		const DEMO_ACCOUNT_SID = "ACe9b39eb400c08fa8ff6738500ede100d";
		const DEMO_AUTH_TOKEN = "d8fc3ca430aad6cb053564521b4d87c3";
		const demo_client = require("twilio")(DEMO_ACCOUNT_SID, DEMO_AUTH_TOKEN);

		const room: any = await Utils.verifyRoomToken(token);
		console.log(`room => ${room.iss}`);
		if (!room || !room.iss)
			throw new BadRequestError("Invalid Room Token");

		return demo_client.video.rooms(room.iss).recordings.list({ limit: limit, offset: offset });
	}

	async getAdminRolePermissions(user_id: number) {
		AdminRoles.hasOne(AdminRoleAssigned, { foreignKey: "role_id" });
		AdminRoleAssigned.belongsTo(AdminRoles, { foreignKey: "role_id" });

		AdminRoles.hasOne(AdminRolePermission, { foreignKey: "role_id" });
		AdminRolePermission.belongsTo(AdminRoles, { foreignKey: "role_id" });

		const adminAssignedRoles: any = await AdminRoleAssigned.findAll({
			attributes: [
				[fn("", col("permission_id")), "permission_id"],
			],
			where: {
				user_id: user_id,
			},
			include: [
				{
					model: AdminRoles,
					attributes: [],
					include: [
						{
							model: AdminRolePermission,
							attributes: [],

						},
					],
				},
			],
			raw: true,
		});
		let permissions: any = adminAssignedRoles.map((el: any) => el.permission_id);
		return permissions
	}

	async getRecordingPermission(booking_id: number) {
		let permissions: any = await DrPatientAppoiment.findOne({
			attributes: [
				["id", "booking_id"],
				["video_call", "video_call"],
				["is_patient_recording", "is_patient_recording"],
				["is_doctor_recording", "is_doctor_recording"]
			],
			where: {
				id: booking_id
			},
			raw: true,
		});

		if (!permissions) throw new BadRequestError("BookingId not Found");

		return { permissions };
	}

	async addRecordingPermission(bookingData: any) {
		let { booking_id, ...permission } = bookingData;
		return DrPatientAppoiment.update({ ...permission }, { where: { id: booking_id } });
	}

	async updateRecordingURL(recordingSid: string, booking_id: number) {
		return DrPatientAppoiment.update({ recording_url: recordingSid }, { where: { id: booking_id } });
	}

	async checkrecordingStatus(mediaUri: string, sid: string, callbackEvent: string) {
		console.log("callbackEvent======", callbackEvent)
		// media processing tasks completed and the Composition media file can be downloaded
		if (callbackEvent === "composition-available") {
			let bookingDetails: any = await DrPatientAppoiment.findOne({ where: { recording_url: sid }, raw: true });
			if (!mediaUri) {
				throw new BadRequestError("Video Recording Url is not Generated Properly");
			}
			const downloadUrl = "https://video.twilio.com/v1/Compositions/" + bookingDetails.recording_url + "/Media";
			let [doctorDetails, patientDetails] = await Promise.all([
				Users.findOne({
					where: {
						id: bookingDetails.doctor_id
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
						id: bookingDetails.patient_id
					},
					attributes: [
						[
							fn("CONCAT", col("first_name"), " ", col("last_name")),
							"name",
						],
						"email",
						"contact_number",
					],
				})
			]) as any;

			//values to be pushed in notification
			let pushNotificationValue: any = {url: downloadUrl};
			//Push Notification to Doctor & Patient as per the permission given by them
			let patientDynamicData = { doctorName: doctorDetails.name, bookingId: bookingDetails.id, url: downloadUrl, pushNotificationValue};
			let doctorDynamicData = { patientName: patientDetails.name, bookingId: bookingDetails.id, url: downloadUrl, pushNotificationValue };

			let notificationPromises: any[] = [];

			if (bookingDetails.is_patient_recording)
				notificationPromises.push(new Notifications().sendNotification("PATIENT_RECORD_SESSION_AVAILABLE", patientDynamicData, { contact_number: [patientDetails.contact_number] }));

			if (bookingDetails.is_doctor_recording)
				notificationPromises.push(new Notifications().sendNotification("DOCTOR_RECORD_SESSION_AVAILABLE", doctorDynamicData, { contact_number: [doctorDetails.contact_number] }));

			if (notificationPromises.length)
				await Promise.all([...notificationPromises]);

		}

		return true;
	}
}
