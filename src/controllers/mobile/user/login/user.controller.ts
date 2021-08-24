import {
	Post,
	Body,
	Get,
	JsonController,
	Param,
	Delete,
	UseBefore,
	BadRequestError,
	Res,
	CurrentUser,
	QueryParam,
} from "routing-controllers";
import { NotAcceptableError } from "routing-controllers";

import {
	BasicInformation,
	ChangePassword,
	OtpVerification,
	PasswordUpdate,
	ResendOTP,
	SwitchRole,
} from "../../../../validations/comman/basicInfo.validations";
import { PreRequestMiddleware } from "../../../../middlewares/common.middleware";
import { UserService } from "../../../../services/mobile/user/user.service";
import { ResponseMessageEnum } from "../../../../constants/constant.enum";
import { body } from "express-validator";
import { RolesEnum } from "../../../../constants/roles.enum";
import { TwilioService } from "../../../../helpers";
import { AddRecordingPermission, AddRecordingRules } from "../../../../validations/comman/users.validation";

@JsonController("/user")
export class UserController {
	constructor(private userSrv: UserService, private twSrv: TwilioService) { }

	/**
	 * method: Post 
	 * url: serverUrl:Port/user/requestOTP
	 * body: @type{JSONObject} body
	 * description: To add User entry & generate OTP on given contact_number.
	 */
	@Post("/requestOTP")
	// @UseBefore(PreRequestMiddleware)
	async requestOTP(@Body({ validate: true }) body: BasicInformation) {
		console.log(body, "Body DATA");
		const exist = await this.userSrv.isUserExists(body.contact_number);
		if (!!exist) {
			if (exist.phone_verify) {
				// let user: any = {
				// 	id: exist.id,
				// 	msg: "User already exits",
				// };
				throw new BadRequestError(ResponseMessageEnum.USER_ALREADY_EXISTS);
			} else {
				body.id = exist.id;
			}
		}

		const result = await this.userSrv.requestOTP(body);
		return result;
	}

	/**
	 * method: Post 
	 * url: serverUrl:Port/user/verifyOTP
	 * body: @type{JSONObject} body
	 * description: To verify OTP sent on contact_number so user's phone can be verfiy.
	 */
	@Post("/verifyOTP")
	async verifyOTP(@Body({ validate: true }) body: OtpVerification) {
		const result = await this.userSrv.verifyOTP(body);
		return result;
	}

	/**
	 * method: Post 
	 * url: serverUrl:Port/user/updatePassword
	 * body: @type{JSONObject} body
	 * description: To update password for user account once user's phone is verified.
	 */
	@Post("/updatePassword")
	async updatePassword(@Body({ validate: true }) body: PasswordUpdate) {
		const result = await this.userSrv.savePassword(body);
		return result;
	}

	// @Post("/passwordUpdate")
	// async Passwordupdates(@Body{{validate:true}} body:) {
	// 	const result = await this.userSrv.saveContactPassword(body);
	// 	return result;
	// }

	/**
	 * method: Post 
	 * url: serverUrl:Port/user/login
	 * body: @type{string} contact_number, @type{string} password 
	 * description: Login API for Users.
	 */
	@Post("/login")
	async login(@Body() body: any) {
		const { contact_number, password, deviceType, deviceToken, fcmToken } = body;
		return await this.userSrv.login(
			contact_number,
			password,
			deviceToken,
			deviceType,
			fcmToken
		);
	}

	/**
	 * method: Get 
	 * url: serverUrl:Port/user/forgotPassword
	 * queryparams: @type{string} ph_number
	 * description: To resend OTP & to change password incase user forgot his/her password.
	 */
	@Get("/forgotPassword/:ph_number")
	async forgotPassword(@Param("ph_number") ph_number: string) {
		const result = await this.userSrv.forgotPassword(ph_number);
		return result;
	}

	/**
	 * method: Post 
	 * url: serverUrl:Port/user/signup
	 * body: @type{JSONObject} body
	 * description: 
	 */
	@Post("/signup")
	userSignUp(@Body() body: any) {
		const result = this.userSrv.upsertUserDetails(body);
		return result;
	}

	/**
	 * method: Get 
	 * url: serverUrl:Port/user/removeUser
	 * queryparam: @type{string} contact_number
	 * description: To remove user entries for given contact_number.
	 */
	@Get("/removeUser/:contact_number")
	async removeUser(@Param("contact_number") contact_number: string) {
		const exist = await this.userSrv.isUserExists(contact_number);
		if (!exist) {
			throw new NotAcceptableError(`Contact number not exits`);
		}
		const result = this.userSrv.userDelete(exist.id);
		return result;
	}

	/**
	 * method: Post 
	 * url: serverUrl:Port/user/updateUserRole
	 * body: @type{number} contact_number, @type{string} password 
	 * description: Login API for Users.
	 */
	@Post("/updateUserRole")
	async updateUserRole(@Body() body: any) {
		const result = this.userSrv.updateUserRole(body);

		return result;
	}

	/**
	 * @deprecated
	 * method: Delete 
	 * url: serverUrl:Port/user/removeUserDetails
	 * body: @type{number} contact_number, @type{string} role 
	 * description: To remove user entries for given contact_number & role.
	 */
	@Delete("/removeUserDetails/:contact_number/:role")
	async removeUserDetails(
		@Param("contact_number") contact_number: string,
		@Param("role") role: string
	) {
		const result = this.userSrv.deleteAllUserDetails(contact_number, role);
	}

	/**
	 * method: Post 
	 * url: serverUrl:Port/user/resendOTP
	 * body: @type{string} contact_number
	 * description: To resend OTP to a contact_number in case OTP is expired.
	 */
	@Post("/resendOTP")
	async resendOTP(@Body({ validate: true }) body: ResendOTP) {
		const result = await this.userSrv.resendOTP(body);
		return result;
	}

	/**
	 * method: Get 
	 * url: serverUrl:Port/user/logOut
	 * queryparam: @requires{access_token}
	 * description: To log out from app.
	 */
	// @UseBefore(PreRequestMiddleware)
	@Get("/logOut")
	async logOut(@CurrentUser() user?: any) {
		const id: number = user.id;
		const result = await this.userSrv.logout(id);
		return result;
	}

	/**
	 * method: Post 
	 * url: serverUrl:Port/user/changePassword
	 * body: @type{string} current_password, @type{string} new_password, 
	 * 		 @type{string} confirm_new_password | @requires{access_token}
	 * description: To change password for CurrentUser.
	 */
	@Post("/changePassword")
	async changePassword(@Body({ validate: true }) body: ChangePassword, @CurrentUser() user?: any) {
		const result = await this.userSrv.changePassword(body, user.id);
		return result;
	}

	@Post("/switchUser")
	async switchUserRole(@Body({ validate: true }) body: SwitchRole, @CurrentUser() user?: any) {
		// check if user not switching to its default role
		if (user.default_role === body.role_id)
			throw new BadRequestError(`Cannot Switch to Same role for ${RolesEnum[user.default_role]}`);

		return this.userSrv.switchUserRole(body, user);
	}

	@Get("/video/getRoomAccessToken")
	async getVideoRoomAccessToken(
		@QueryParam('booking_id', { required: true }) booking_id: number,
		@QueryParam('record_session') record_session: boolean,
		@CurrentUser() user?: any) {
		return this.twSrv.generateRoomWithVideoAccessToken(user, booking_id, record_session);
	}

	@Get("/video/getRecording")
	async getRecordingUrl(
		@QueryParam('room_id', { required: true }) room_id: string,
		@QueryParam('booking_id', { required: true }) booking_id: number,
	) {
		return this.twSrv.getVideoCallRecordingUrl(room_id, booking_id);
	}

	@Post("/chat/createFriendlyService")
	async createFriendlyService(@Body({ validate: true }) body: any) {
		return this.twSrv.createFriendlyChatService(body.topic);
	}

	@Get("/chat/getRoomAccessToken")
	async getChatRoomAccessToken(
		// @QueryParam('service_id', {required: true}) service_id: string,
		@CurrentUser() user?: any) {
		return this.twSrv.generateChatRoomAccessToken(user.contact_number, user.first_name);
	}

	@Get("/video/recordingPermissions")
	async getRecordingPermissions(
		@QueryParam('booking_id', { required: true }) booking_id: number,
	) {
		return this.userSrv.getRecordingPermission(booking_id);
	}

	@Post("/video/addRecordingPermission")
	async addRecordingPermission(
		@Body({ validate: true }) body: AddRecordingPermission
	) {
		return this.userSrv.addRecordingPermission(body);
	}

	@Get("/recordingStatus")
	async checkrecordingStatus(
		@QueryParam('MediaUri') uri: string,
		@QueryParam('CompositionSid') sid: string,
		@QueryParam('StatusCallbackEvent') callbackEvent: string
	) {
		console.log("in recording controller")
		return this.userSrv.checkrecordingStatus(uri, sid, callbackEvent);
	}

	@Post("/video/addRecordingRules")
	async addRecordingRulesForRoom(
		@Body({ validate: true }) body: AddRecordingRules
	) {
		return this.twSrv.addRecordingRulesForRoom(body.room_id, body.booking_id);
	}
}
