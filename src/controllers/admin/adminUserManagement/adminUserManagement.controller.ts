import { BadRequestError, Body, Get, JsonController, Post, QueryParam, QueryParams, Param, CurrentUser, UnauthorizedError, Delete } from "routing-controllers";
import { AdminService } from "../../../services/admin/admin.service";
import { AdminAdd, EditDetails, listAdminByRole } from "../../../validations/admin/admin.validation";
import { ResponseMessageEnum } from "../../../constants/constant.enum";
import { Utils } from "../../../helpers/Utils";

@JsonController('/admin')
export class AdminUserController {

	constructor(private adminSrv: AdminService) { }

	/**
	 * method: Post
	 * url: serverUrl:Port/admin/addAdmin
	 * body: @type{string} email, @type{string} contact_number, @type{string} first_name, @type{string} last_name,  @type{string} password, @type{string} confirm_password
	 * description: Admin use this to add new admin.
	 */
	@Post('/addAdmin')
	async addNewAdmin(@Body() body: AdminAdd) {
		const isAdminExists = await this.adminSrv.isAdminExists(body.email, body.contact_number);
		if (!!isAdminExists && ((isAdminExists.isAdmin === 1 && isAdminExists.account_activation === 1) || isAdminExists.isAdmin === 0)) {
			throw new BadRequestError("User already exists")
		}
		// if (body.password !== body.confirm_password) {
		// 	throw new BadRequestError(ResponseMessageEnum.SIGNUP_CONFIRM_PASSWORD_INCORRECT);
		// }
		const msg = await this.adminSrv.saveAdminDetails(!!isAdminExists ? { ...body, id: isAdminExists.id } : body, true);
		return { msg: msg };
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/admin/updateAdminDetail
	 * body: @type{string} email, @type{string} contact_number, @type{string} first_name, @type{string} last_name, 
	 * description: Admin use to API to update his admin details, along with roles.
	 */
	@Post("/updateAdminDetail")
	async updateProfileDetails(@Body() body: EditDetails) {
		const isAdminExists = await this.adminSrv.isDetailExists(body.email, body.contact_number, body.admin_id);
		if (!!isAdminExists) {
			throw new BadRequestError("Contact No./Email already taken")
		}
		const result = await this.adminSrv.EditDetails(body, body.admin_id);
		return result;
	}


	/**
	* method: Get 
	* url: serverUrl:Port/admin/getRoleUsers
	* queryparam: @type{number} role_id 
	* description: To get role user list for given role_id.
	*/
	@Get("/getRoleUsers/:role_id")
	getUsrs(@Param("role_id") role_id: number, @QueryParams({ validate: true }) query: listAdminByRole) {
		const result = this.adminSrv.getUsersByRole(query.limit, query.offset, query.search, query.sort, query.order, role_id);
		return result;
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/admin/verifyEmail
	 * body: @type{string} email, @type{string} token
	 * description: verify the admin user email
	 */
	@Post('/verifyEmail')
	async adminVerifyEmail(@Body() body: any) {
		let tokenDetails: any;
		if (!body.token) {
			throw new BadRequestError("Please provide valid token");
		} else {
			tokenDetails = Utils.varifyToken(body.token)
		}

		const isAdminExist = await this.adminSrv.isAdminExists(tokenDetails.email);
		if (!isAdminExist) {
			throw new UnauthorizedError("Admin not found")
		}
		body.email = tokenDetails.email;
		const reslt = await this.adminSrv.verifyEmail(body);
		return {
			message: 'Email verificed successfully.',
		}
	}

	/**
	 * @deprecated
	 * method: Delete 
	 * url: serverUrl:Port/admin/deleteAdminUser/:user_id
	 * body:  @type{number} user_id 
	 * description: To remove user entries for given contact_number & role.
	 */
	@Delete("/deleteAdminUser/:user_id")
	async removeAdminUser(
		@Param("user_id") user_id: number,
		@CurrentUser() user: any
	) {
		const result = this.adminSrv.deleteAdmin(user_id);
		return result;
	}
}