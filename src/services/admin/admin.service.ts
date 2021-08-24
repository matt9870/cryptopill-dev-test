import { get } from "config";
import { BadRequestError, NotFoundError, UnauthorizedError } from "routing-controllers";
// import sequelize = require("sequelize");
import { EmailServer, Utils, Notifications } from "../../helpers";
import Roles from "../../models/roles.model";
import Users from "../../models/users.model";
import UserRole from "../../models/user_role.model";
// import AdminRoleAssigned from "../../models/admin_role_assigned.model";
import AdminRoles from "../../models/admin_roles.model";
import AdminRolePermission from "../../models/admin_role_permission.model";
import sequelize from "../../db/sequalise";
import { RolesEnum } from "../../constants/roles.enum";
import { count } from "console";
import { UserRoleService } from "../shared/user-role.service";
import DrUsers from "../../models/dr_users.model";
import { Op, fn, col } from "sequelize";
import { StatusCode } from "../../constants/status_code.enum";
import { FileService } from "../shared/file.service";
import AdminRoleAssigned from "../../models/admin_role_assigned.model";
import user_status_code from "../../models/user_status_codes";
const { QueryTypes } = require('sequelize');
const secrets: any = get("APP");
import { userStatusCode, orderStatusCode, role } from '../../constants/dbValues'
import OrderStatusCode from "../../models/order_status_code";


export class AdminService {
	async login(existingUser: any, password: string, role_id: number) {
		const decryptedPw = Utils.decrypt(existingUser.password);

		Roles.hasOne(UserRole, { foreignKey: "role_id" });
		UserRole.belongsTo(Roles, { foreignKey: "role_id" });

		Users.hasOne(UserRole, { foreignKey: "user_id" });
		UserRole.belongsTo(Users, { foreignKey: "user_id" });

		if (decryptedPw === password) {
			const userData: any = await UserRole.findOne({
				where: {
					user_id: existingUser.id,
					role_id: role_id,
				},
				include: [
					{
						model: Roles,
						attributes: ["role"],
					},
					{
						model: Users,
					},
				],
				raw: true,
			});
			const adminUser = await Users.update({
				account_activation: true
			}, {
				where: {
					id: existingUser.id,
					account_activation: false,
					email_verify: true
				}
			});

			delete userData["user.password"];

			const payload = {} as any;
			Object.keys(userData).map((key) => {
				if (key.split(".").length === 1) {
					payload[`${key.split(".").join()}`] = userData[key];
				} else {
					payload[`${key.split(".")[1]}`] = userData[key];
				}
			});
			AdminRoles.hasOne(AdminRoleAssigned, { foreignKey: "role_id" });
			AdminRoleAssigned.belongsTo(AdminRoles, { foreignKey: "role_id" });

			AdminRoles.hasOne(AdminRolePermission, { foreignKey: "role_id" });
			AdminRolePermission.belongsTo(AdminRoles, { foreignKey: "role_id" });

			const adminAssignedRoles: any = await AdminRoleAssigned.findAll({
				attributes: [
					[fn("", col("permission_id")), "permission_id"],
					[fn("", col("permission_name")), "permission_name"],
				],
				where: {
					user_id: existingUser.id,
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
			payload.admin_roles = adminAssignedRoles.map((el: any) => el.permission_id);
			// console.log("adminAssignedRoles============", )

			return { token: Utils.createJWTToken(payload), permissions: adminAssignedRoles };
		}
		throw new UnauthorizedError("Password entered is incorrect");
	}

	async forgotPassword(body: any) {
		const existingUser: any = await Users.findOne({
			where: {
				email: body.email,
				contact_number: body.contact_number,
			},
			attributes: [
				"id",
				"first_name",
				"last_name",
				"email",
				"contact_number",
				"email_verify",
				"phone_verify",
			],
		});

		if (!!existingUser) {
			// if (!existingUser.email_verify) {
			//     throw new UnauthorizedError("Email address is not verified")
			// }

			if (!existingUser.phone_verify) {
				throw new UnauthorizedError("Contact number is not verified");
			}
		} else {
			throw new NotFoundError("Admin user not found");
		}

		const { RESET_LINK_TIMEOUT } = secrets;
		const tokenOptions = {
			expireIn: RESET_LINK_TIMEOUT,
		};
		const resetLinkToken = Utils.createJWTToken(existingUser, tokenOptions);

		const { PW_RESET_LINK } = secrets;
		const emailOption = {
			to: body.email,
			subject: "Password Reset Link",
			html: `click <a href='${PW_RESET_LINK}${resetLinkToken}'> here </a> to reset password`,
		};
		const mailSent = await new EmailServer().sendEmail(emailOption);

		if (!!mailSent) {
			return "Password reset link sent successfully.";
		}

		throw new NotFoundError("Fail to send email");
	}

	async isAdminExists(
		email: string,
		contact_number?: string,
		id?: number
	): Promise<any> {
		const searchEmailCondition: any = { email: email };
		let searchPhoneNoCondition: any = {};
		let searchIdCondition: any = {};
		if (!!contact_number) {
			searchPhoneNoCondition = { contact_number: contact_number };
		}

		if (!!id) {
			searchIdCondition = { id: id };
		}

		const userExists = await Users.findOne({
			where: {
				[Op.or]: {
					...searchEmailCondition,
					...searchPhoneNoCondition
				},
				...searchIdCondition

			},

			attributes: {
				exclude: ["phone_otp", "token"],
			},
		});

		return userExists;
	}
	async isDetailExists(
		email: string,
		contact_number?: string,
		id?: number
	): Promise<any> {
		const searchCondition: any = { email: email };
		if (!!contact_number) {
			searchCondition["contact_number"] = contact_number;
		}

		if (!!id) {
			searchCondition["id"] = {
				[sequelize.Op.not]: id
			};
		}

		const userExists = await Users.findOne({
			where: {
				[Op.and]: [
					{
						[Op.or]: [
							{ email: email },
							{ contact_number: contact_number }
						],
					},
					{ id: { [sequelize.Op.not]: id } }
				]
			},
			attributes: {
				exclude: ["phone_otp", "token", "account_activation"],
			},
		});

		return userExists;
	}
	async validatePasswordResetLink(id: number, valid?: boolean) {
		const isUserExists = await Users.findOne({
			where: {
				id: id,
				email_verify: 1,
				isAdmin: true,
			},
			attributes: ["id", "first_name", "last_name", "email", "contact_number"],
		});

		if (!!isUserExists) {
			const { RESET_LINK_TIMEOUT } = secrets;
			const tokenOptions = {
				expireIn: RESET_LINK_TIMEOUT,
			};
			// create reset token with timeout
			const resetLinkToken = Utils.createJWTToken(isUserExists, tokenOptions);

			return resetLinkToken;
		}
		throw new UnauthorizedError("Email address is not verified");
	}

	async saveAdminDetails(body: any, is_for_role = false) {
		const adminRoleId: any = await Roles.findOne({
			where: {
				role: "admin",
			},
		});

		const max = await Users.max("id");
		const user_id = body.id ? body.id : (isNaN(max) ? 1 : max + 1);
		const { ADMIN_DEFAULT_PASSWORD } = secrets;
		// const user_id = await Users.count() + 1;
		body["isAdmin"] = true;
		body.id = user_id;
		body["password"] = Utils.encrypt(body["password"] ?? ADMIN_DEFAULT_PASSWORD);
		// body["account_activation"] = is_for_role ? false : true;
		body["account_activation"] = true;
		body["phone_verify"] = true;
		body["email_verify"] = is_for_role ? false : true;
		body["default_role"] = adminRoleId.id;

		const adminAdded = await Users.upsert(body);
		if (adminAdded) {
			// const userRoleadd = await UserRole.upsert({
			// 	role_id: adminRoleId.id,
			// 	user_id: user_id,
			// });
			new UserRoleService().upsertUserRole({
				role_id: adminRoleId.id,
				user_id: user_id,
			})

		}
		if (body.role_id) {
			let newValues: any = { role_id: body.role_id, user_id: user_id }
			AdminRoleAssigned.create(newValues);
		}

		if (is_for_role) {
			const existingUser: any = await Users.findOne({
				where: {
					contact_number: body.contact_number,
				},
				attributes: [
					"id",
					"first_name",
					"last_name",
					"email",
					"contact_number",
					"email_verify",
					"phone_verify",
				],
			});
			// const { RESET_LINK_TIMEOUT } = secrets;
			// const tokenOptions = {
			// 	expireIn: RESET_LINK_TIMEOUT,
			// };
			const resetLinkToken = Utils.createJWTToken(existingUser);

			const { EMAIL_VERIFICATION_LINK } = secrets;
			const emailOption = {
				to: body.email,
				subject: "Verification Link",
				html: `click <a href='${EMAIL_VERIFICATION_LINK}${resetLinkToken}'> here </a> to verify your account`,
			};
			const mailSent = await new EmailServer().sendEmail(emailOption);

			if (!!mailSent) {
				return "Verification link sent.";
			}
			throw new NotFoundError("Fail to send verification link");

		}

		return "Admin added Successfully";
	}

	async dashboard() {
		const dashboard = await sequelize.query(
			`select concat(a.first_name , " " , (IF( a.middle_name IS NULL OR a.middle_name != '' , " " , Concat(a.middle_name, " " )))  ,a.last_name) as name, c.id as role_id , c.role as type , 
            IF(b.varify_account = 0  , 0 , 1) as isVerified,
            null as link
            from users a join user_role b on a.id = b.user_id and a.isAdmin = 0 and b.varify_account = 0
            join roles c on c.id = b.role_id

            UNION ALL

            select b.name as name, 
            null as role_id ,
            'Allergy' as type,
            if(b.status = -1 , -1 , if(b.status = 0 , 0,if(b.status = 2 , 2,1))) as isVerified,
            null as link
            from users a join allergies b on a.id = b.user_id 

            Union ALL

            select b.name as name , null as role_id,
            'Speciality' as type ,
            if(b.status = -1 , -1 , if(b.status = 0 , 0,if(b.status = 2 , 2,1))) as isVerified,
            null as link
            from users a join specialities_speciality b on a.id = b.user_id;`,
			{
				type: QueryTypes.SELECT
			}
		);

		return dashboard;
	}

	async getDashboardData(limit: number, offset: number, search: string, type: string, status: string, sort: string, order: string = 'desc', permission: any[]) {
		const limitcase = (offset > 0) ? `limit ${limit} offset ${offset}` : `limit ${limit}`;

		let accesible_roles = Utils.getRolesByPermissionId(permission);

		let subqueryalias = 'dashboard';
		let accoutnStatus: any = {
			all: '',
			awaiting_approval: `${subqueryalias}.status_code is null AND ${subqueryalias}.status_name like '%awaiting approval%'`,
			approved: `${subqueryalias}.status_code is null AND status_name = 'Approved'`,
			unverified_new: `${subqueryalias}.status_code = 2`,
			unverified_edit: `${subqueryalias}.status_code = 3`,
			verified: `${subqueryalias}.status_code = 1`,
			new_user: `${subqueryalias}.status_code = 6`
		};

		let accounttype: any = {
			all: '',
			patient: 'patient',
			doctor: 'doctor',
			supportstaff: 'staff',
			pharmacy: 'pharmacy',
			laboratory: 'laboratory',
			allergies: 'allergies',
			speciality: 'speciality'
		};

		/*
			unverified_new: `${subqueryalias}.active_status = 0 AND ${subqueryalias}.isVerified = 0`,
			unverified_edit: `${subqueryalias}.active_status = 1 AND ${subqueryalias}.isVerified = 0`,
		*/

		let typecase = type && accounttype[type.toLowerCase()] ? `${subqueryalias}.type = '${accounttype[type.toLowerCase()]}'` : true;
		let statuscase = status && accoutnStatus[status.toLowerCase()] ? `${accoutnStatus[status.toLowerCase()]}` : true;
		let filtercase = `${typecase} AND ${statuscase}`;

		let searchcase = `${subqueryalias}.name like '%${search}%'`;
		let orderbycase = sort ? `order by ${subqueryalias}.${sort} ${order}` : `order by ${subqueryalias}.entry_time asc`;
		let adminRoleCondition = !!accesible_roles.length ? `AND role_id in (${accesible_roles})` : '';
		let whereclause = search ? `where (${subqueryalias}.status_code NOT IN(${StatusCode.Declined}, ${StatusCode.Verified}) OR ${subqueryalias}.status_code IS NULL AND (${searchcase})) AND (${filtercase}) ${orderbycase}` :
			`where (${subqueryalias}.status_code NOT IN(${StatusCode.Declined}, ${StatusCode.Verified}) OR ${subqueryalias}.status_code IS NULL) ${adminRoleCondition} AND (${filtercase}) ${orderbycase}`;

		const query = `select * from (select concat(a.first_name , " " , (IF( a.middle_name IS NULL OR a.middle_name != '' , " " , Concat(a.middle_name, " " )))  ,a.last_name) as name,
		c.id as role_id , c.role as type , 
        stat.status_name ,
        stat.id as status_code,
		null as link, a.id as user_id, a.created_at as entry_time
		from users a join user_role b on a.id = b.user_id and a.isAdmin = 0
        join user_status_code stat on b.status_code = stat.id 
		join roles c on c.id = b.role_id

		UNION ALL

		select b.name as name, 
		${RolesEnum.Doctor} as role_id ,
		'Allergy' as type,
		if(b.status = -1 , 'Awaiting Approval' , if(b.status = 2 , 'Not Approved',if(b.status = 0 , 'Inactive','Approved'))) as status_name,
        null as status_code,
		null as link, a.id as user_id, b.date_time as entry_time
		from users a join allergies b on a.id = b.user_id 

		UNION ALL

		select b.name as name , ${RolesEnum.Doctor} as role_id,
		'Speciality' as type ,
		if(b.status = -1 , 'Awaiting Approval' , if(b.status = 2 , 'Not Approved',if(b.status = 0 , 'Inactive','Approved'))) as status_name,
        2 as status_code,
		null as link, a.id as user_id, b.date_time as entry_time
		from users a join specialities_speciality b on a.id = b.user_id) as ${subqueryalias} ${whereclause}`

		const dashboard = await sequelize.query(
			`${query} ${limitcase};`,
			{
				replacements: { limitcase: limitcase },
				type: QueryTypes.SELECT
			}
		);

		const total_count: any = await sequelize.query(`select count(*) as count from (${query}) as tempAllies`, {
			type: QueryTypes.SELECT
		})

		return { users: dashboard, limit: limit, offset: offset, total_count: total_count[0].count };
	}

	async changePassword(body: any) {

		const updatePassword = await Users.update({
			password: Utils.encrypt(body.password)
		}, {
			where: {
				email: body.email,
				isAdmin: true
			}
		})
		return updatePassword;
	}

	async changeAccountStatus(body: any) {
		const { user_role_id, active_status } = body;
		// const userRoleRecord: any = await UserRole.findOne({
		// 	where: {
		// 		id: user_role_id
		// 	}
		// });

		const userRoleRecord: any = await new UserRoleService().isUserRoleExists(null, null, user_role_id);

		if (userRoleRecord) {
			// for patient
			// if (userRoleRecord.role_id == RolesEnum["Patient"]) {
			userRoleRecord.active_status = active_status;
			const changePatientStatus = new UserRoleService().upsertUserRole(userRoleRecord)
			// const changePatientStatus = await UserRole.update({
			// 	active_status: active_status
			// }, {
			// 	where: {
			// 		id: user_role_id
			// 	}
			// })
			// const changePatientStatus = await PatientUser.update({
			//     active_status: active_status
			// }, {
			//     where: {
			//         user_id: userRoleRecord.user_id
			//     }
			// });

			return { updates: changePatientStatus };
			// }
		}
	}

	async verifyProfileImage(body: any) {

		const isProfileUploaded: any = await Users.findOne({
			where: {
				id: body.user_id,
				new_profile_image: {
					[Op.ne]: null
				}
			},
			raw: true,
		})

		if (!isProfileUploaded) {
			throw new BadRequestError("No image found for approval");
		}

		if (body.profile_image_verify) {
			const verify = await Users.update({
				profile_image: isProfileUploaded.new_profile_image,
				new_profile_image: null,
				profile_image_verify: body.profile_image_verify,
				image_status_code: StatusCode.Verified
			}, {
				where: {
					id: body.user_id
				}
			});

			let key = isProfileUploaded.default_role == RolesEnum.Patient ? "PATIENT_IMAGE_ADMIN_VERIFIED" : (isProfileUploaded.default_role == RolesEnum.Doctor ? "DOCTOR_IMAGE_ADMIN_VERIFIED" : (isProfileUploaded.default_role == RolesEnum.Staff ? "DELEGATE_IMAGE_ADMIN_VERIFIED" : ""));
			let dynamicData = {}
			let msgSent = await new Notifications().sendNotification(key, dynamicData, { contact_number: [isProfileUploaded.contact_number], role_id: "none" });

			return verify
		} else {
			const verify = await Users.update({
				new_profile_image: null,
				profile_image_verify: body.profile_image_verify,
				image_status_code: StatusCode.Declined
			}, {
				where: {
					id: body.user_id
				}
			});
			let key = isProfileUploaded.default_role == RolesEnum.Patient ? "PATIENT_IMAGE_ADD_EDIT_ADMIN_DECLINED" : (isProfileUploaded.default_role == RolesEnum.Doctor ? "DOCTOR_IMAGE_ADD_EDIT_ADMIN_DECLINED" : (isProfileUploaded.default_role == RolesEnum.Staff ? "DELEGATE_IMAGE_ADD_EDIT_ADMIN_DECLINED" : ""));
			let dynamicData = {}
			let msgSent = await new Notifications().sendNotification(key, dynamicData, { contact_number: [isProfileUploaded.contact_number], role_id: "none" });
			return verify;
		}
		// // if doctor profile exists 
		// if (isDoctor) {
		// 	// check for doctor's profession info flag
		// 	const isProfessionalInfoVerified = await DrUsers.findOne({
		// 		where: {
		// 			doctor_id: body.user_id,
		// 			is_Profession_Verified: 1
		// 		}
		// 	});

		// 	// if doctor proffessio is not verifid
		// 	// then upate verify_account to 0
		// 	if (body.profile_image_verify && isProfessionalInfoVerified) {
		// 		UserRole.update({
		// 			verify_account: 1
		// 		}, {
		// 			where: {
		// 				id: isDoctor.id
		// 			}
		// 		})
		// 	} else {
		// 		UserRole.update({
		// 			verify_account: 0
		// 		}, {
		// 			where: {
		// 				id: isDoctor.id
		// 			}
		// 		})
		// 	}
		// }
		// return verify;
	}

	async getAdminDetails(user_id: number) {
		const user: any = await Users.findOne({
			attributes: {
				exclude: ["password", "phone_otp", "token", "account_activation", "otp_timer", "deviceToken",
					"deviceType", "lab_or_pharma_employement_number"],
			}, where: { id: user_id }, raw: true
		});

		//get both current & new profile image uploaded
		if (!!user.profile_image) {
			user.profile_image = await new FileService().getProfileImageLink(
				user_id,
				RolesEnum.Admin,
				user.profile_image
			);
		}

		if (!!user.new_profile_image) {
			user.new_profile_image = await new FileService().getProfileImageLink(
				user_id,
				RolesEnum.Admin,
				user.new_profile_image
			);
		}

		return { ...user };
	}

	async updateAdminDetails(body: any, user_id: number) {
		let { first_name, last_name, middle_name, birth_date } = body;
		let userDetails = {
			first_name, last_name, middle_name, birth_date
		};
		const users: any = await Users.update({ ...userDetails }, { where: { id: user_id } });

		if (!users) {
			throw new BadRequestError("Issue while updating Admin profile");
		}
		return { msg: "Admin details updated successfully" };
	}

	async EditDetails(body: any, user_id: number) {
		let { first_name, last_name, email, contact_number, role_id } = body;
		let userDetails = {
			first_name, last_name, email, contact_number
		};



		const users: any = await Users.update({ ...userDetails }, { where: { id: user_id } });

		if (!users) {
			throw new BadRequestError("Issue while updating Admin profile");
		}
		else {
			let newValues: any = { role_id: role_id, user_id: user_id }
			await AdminRoleAssigned
				.findOne({ where: { user_id: user_id } })
				.then((obj: any) => {
					// update
					if (obj)
						return AdminRoleAssigned.update(newValues, { where: { user_id: user_id } });
					// insert
					return AdminRoleAssigned.create(newValues);
				})

		}
		return { msg: "Admin details updated successfully" };
	}



	async getUsersByRole(limit: number, offset: number, search: string, sort: string = "full_name", order: string = "asc", role_id: number) {

		Users.hasOne(AdminRoleAssigned, { foreignKey: "user_id" });
		AdminRoleAssigned.belongsTo(Users, { foreignKey: "user_id" });

		const searchCase = search
			? {
				[Op.or]: {
					full_name: sequelize.where(
						sequelize.fn(
							"concat",
							sequelize.col("first_name"),
							" ",
							sequelize.col("last_name")
						),
						{
							[Op.like]: `%${search}%`,
						}
					),

					// "$user.contact_number$": {
					// 	[Op.like]: `%${search}%`,
					// },
					"$user.email$": {
						[Op.like]: `%${search}%`,
					},

				}
			}
			: {};
		const roleFilter = !!role_id ? { role_id: role_id } : {};
		const orderByCase = sort ? sequelize.literal(`${sort} ${order}`) : sequelize.literal('full_name ASC');

		const { count, rows }: any = await AdminRoleAssigned.findAndCountAll({

			attributes: [
				"user_id",
				"updatedAt",
				[fn("", col("contact_number")), "contact_number"],
				[fn("", col("email")), "email"],
				[
					fn("CONCAT", col("first_name"), " ", col("last_name")),
					"full_name",
				],
			],
			include: [
				{
					model: Users,
					attributes: [],
					where: {
						account_activation: 1
					},
				}
			],
			where: {
				...searchCase,
				...roleFilter
			},
			limit: limit,
			offset: offset,
			order: orderByCase,
			raw: true,
		});
		return {
			permissionList: rows,
			limit: limit,
			offset: offset,
			count,
		};;
	}

	async verifyEmail(body: any) {

		const adminUser = await Users.update({
			email_verify: true
		}, {
			where: {
				email: body.email,
				isAdmin: true
			}
		})
		return adminUser;
	};

	async init() {

		await user_status_code.bulkCreate(userStatusCode);
		await user_status_code.update({
			id: 0
		}, {
			where: {
				status_name: "Declined"
			}
		});
		await OrderStatusCode.bulkCreate(orderStatusCode);
		await Roles.bulkCreate(role);
	}


	async deleteAdmin(user_id: number) {
		await Users.update({
			account_activation: 0
		}, {
			where: {
				id: user_id
			}
		});
		return { message: "Admin deleted successfully" };
	}
}
