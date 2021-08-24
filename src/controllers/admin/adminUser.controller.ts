import {
	BadRequestError,
	Body,
	Controller,
	Get,
	JsonController,
	NotFoundError,
	Post,
	QueryParam,
	QueryParams,
	Res,
	UnauthorizedError,
} from "routing-controllers";
import { AdminService } from "../../services/admin/admin.service";
import {
	AdminSignup,
	changeAccountStatusBody,
	EditAdminDetails,
	ForgotPasswordValidation,
	LoginValidation,
} from "../../validations/admin/admin.validation";
import { Response } from "express";
import { get } from "config";
import { Utils } from "../../helpers/Utils";
import { AdminDashboardSearch } from "../../validations/comman/basicInfo.validations";
import { CurrentUser } from "routing-controllers";
const secrets: any = get("APP");
@JsonController("/admin")
export class AdminUserController {

	constructor(private adminSrv: AdminService) { }

	/**
	 * method: Post
	 * url: serverUrl:Port/admin/login
	 * body: @type{string} email, @type{string} password, @type{number} role_id
	 * description: Admin use this login into Admin Panel.
	 */
	@Post('/login')
	async adminLogin(@Body() body: LoginValidation) {
		const existingUser = await this.adminSrv.isAdminExists(body.email);
		if (existingUser && existingUser.account_activation == 1) {
			if (existingUser.email_verify) {
				const usrToken = await this.adminSrv.login(existingUser, body.password, body.role_id);
				return usrToken;
			}
			else {
				throw new UnauthorizedError("Email address is not verified");
			}
		}
		throw new NotFoundError('User not found ')

	}

	/**
	 * method: Post
	 * url: serverUrl:Port/admin/forgotPassword
	 * body: @type{string} email, @type{string} contact_number
	 * description: Admin use this incase if forgot password then password reset link is sent to its mail.
	 */
	@Post('/forgotPassword')
	async forgotPassword(@Body() body: ForgotPasswordValidation) {


		const result = await this.adminSrv.forgotPassword(body);
		return result;
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/admin/verifyresetlink
	 * queryparams: @type{number} id, @type{boolean} email_verify
	 * description:
	 */
	@Get('/verifyresetlink')
	async verifyPasswordResetLink(@QueryParam("id") id: number, @QueryParam('email_verify') email_verify: boolean, @Res() res: Response) {
		const resetToken = await this.adminSrv.validatePasswordResetLink(id);
		const resetPasswordLink = `${secrets['PW_RESET_LINK']}${resetToken}`;
		// console.log(resetPasswordLink, "rsetpaswordlink");
		// localhost:reset-password?resetToke=,djsakjdnaskjdaskjdbsksbdsakjbd

		return res.redirect(resetPasswordLink)
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/admin/signup
	 * body: @type{string} email, @type{string} contact_number, @type{string} first_name, @type{string} last_name
	 * description: Admin use this incase if forgot password then password reset link is sent to its mail.
	 */
	@Post('/signup')
	async signup(@Body() body: AdminSignup) {

		const isAdminExists = await this.adminSrv.isAdminExists(body.email, body.contact_number);
		if (!!isAdminExists) {
			throw new UnauthorizedError("Admin already exists")
		}
		const user = await this.adminSrv.saveAdminDetails(body);
		return user;
	}

	/**
	 * @deprecated
	 * method: Get
	 * url: serverUrl:Port/admin/getDashboard
	 */
	@Get('/dashboard')
	async get() {
		const dashboardData = await this.adminSrv.dashboard();
		return dashboardData;
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/admin/changePassword
	 * body: @type{string} email, @type{string} password, @type{string} resetToken
	 * description: Admin use this change password for Admin Panel login.
	 */
	@Post('/changePassword')
	async changePassword(@Body() body: any) {
		let tokenDetails: any;
		if (!body.resetToken) {
			throw new BadRequestError("Please provide valid token");
		} else {
			tokenDetails = Utils.varifyToken(body.resetToken)
			console.log(tokenDetails, "TokenDetails");
		}

		const isAdminExist = await this.adminSrv.isAdminExists(tokenDetails.email);
		if (!isAdminExist) {
			throw new UnauthorizedError("Admin not found")
		}
		body.email = tokenDetails.email;
		const changepw = await this.adminSrv.changePassword(body);
		return {
			message: 'Password change successfull.',
			data: changepw
		}
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/admin/changeAccountStatus
	 * body: @type{JSONObject}
	 * description: Admin use it to update status for account to activate or deactivate.
	 */
	@Post('/changeAccountStatus')
	async changeAccountStatus(@Body() body: changeAccountStatusBody) {

		const changedStatus = await this.adminSrv.changeAccountStatus(body);
		return changedStatus

	}

	/**
	 * method: Post
	 * url: serverUrl:Port/admin/verifyProfileImage
	 * body: @type{number} user_id, @type{number} profile_image_verify
	 * description: Admin use it to update status for account to activate or deactivate.
	 */
	@Post('/verifyProfileImage')
	async verifyProfileImage(@Body() body: any) {
		const verify = await this.adminSrv.verifyProfileImage(body);
		return verify;
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/admin/getDashboard
	 * queryparams: @type{number} limit, @type{number} offset, @type{string} search, @type{string} type, @type{string} status, @type{string} sort, @type{string} order
	 * description: To get list of all entries added in db that needs Admin side verification.
	 */
	@Get("/getDashboard")
	async getDashboard(@QueryParams({ validate: true }) query: AdminDashboardSearch, @CurrentUser() user: any) {
		const result = await this.adminSrv.getDashboardData(query.limit, query.offset, query.search, query.type, query.status, query.sort, query.order, user.admin_roles);
		return result;
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/admin/profileDetails
	 * queryparams: @requires{access_token} or @type{number} user_id
	 * description: Admin get his profile details from this API.
	 */
	@Get("/profileDetails")
	async getProfileDetails(@CurrentUser() user: any, user_id?: number) {
		let id = user_id ? user_id : user.id;
		const result = await this.adminSrv.getAdminDetails(id);
		return result;
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/admin/updateProfile
	 * body: @type{string} first_name, @type{string} last_name, @type{string} birth_date
	 * description: Admin use to API to update his basic details.
	 */
	@Post("/updateProfile")
	async updateProfileDetails(@CurrentUser() user: any, @Body() body: EditAdminDetails, user_id?: number) {
		let id = user_id ? user_id : user.id;
		const result = await this.adminSrv.updateAdminDetails(body, id);
		return result;
	}

	@Get("/initialConfiguration")
	async init() {
		await this.adminSrv.init();
		return "ok"
	}
}
