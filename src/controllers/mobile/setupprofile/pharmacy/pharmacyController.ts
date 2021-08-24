import {
	Get,
	Post,
	Param,
	JsonController,
	Body,
	BadRequestError,
	Put,
	Delete,
	CurrentUser,
	QueryParam,
	QueryParams,
} from "routing-controllers";
import { verify } from "jsonwebtoken";
import { get } from "config";
const secrets = get("APP");
const { JWT_SECRET }: any = secrets;
import { Messages } from "../../../../constants/messages";
import { PharmacyService } from "../../../../services/mobile/pharmacy/pharmacy.service";
import { UserProfileService } from "../../../../services/shared/user-profile.service";
import {
	PharmacyEmployee,
	EditPharmacyEmployee,
	PharmacySetUpProfile,
	EditPharmacySetUpProfile,
	EditPharmacyUserProfile,
	PharmacyOrders,
	PharmacyPastOrders,
	PharmacyCancelOrder,
	PharmacyMarkOrderAsDelivered,
	PharmacyDeclineOrderRequest,
} from "../../../../validations/comman/pharmacyProfile.validations";
import { UserService } from "../../../../services/mobile/user/user.service";
import { ResponseMessageEnum } from "../../../../constants/constant.enum";
import { DoctorService } from "../../../../services/mobile/doctor/doctor.service";
import { PharmacyUserManageServices } from "../../../../services/admin/pharmacyManagement/pharmacyUserManage.service";
import { PharmacyOrderSearch } from "../../../../validations/comman/basicInfo.validations";
import { OrderStatusEnum } from "../../../../constants/order_status.enum";
@JsonController("/pharmacy")
export class PharmacyController {
	constructor(
		private pharmaSrv: PharmacyService,
		private userSrv: UserService,
		private docSrv: DoctorService,
		private pharmaManageSrv: PharmacyUserManageServices
	) {}

	/**
	 * method: Post
	 * url: serverUrl:Port/pharmacy/signup/addSetupProfileDetails
	 * body: @type{JSONObject} body
	 * description: To add pharmacy setup profile details.
	 */
	@Post("/signup/addSetupProfileDetails")
	addSetupProfileDetails(@Body({ validate: true }) body: PharmacySetUpProfile) {
		return this.pharmaSrv.upsertSetUpProfileDetails(body);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/pharmacy/signup/addEmployeeDetails
	 * body: @type{JSONObject} body
	 * description: To add pharmacy admin otp will be send to contact_number added in request.
	 */
	@Post("/signup/addEmployeeDetails")
	async addEmployeeDetails(@Body({ validate: true }) body: any) {
		// const exist = await this.userSrv.isUserExists(body.contact_number);
		// if (!!exist) {
		// 	throw new BadRequestError(ResponseMessageEnum.USER_ALREADY_EXISTS);
		// }
		return this.pharmaSrv.upsertPharmacyEmployeeDetails(body);
	}

	/**
	 * method: Put
	 * url: serverUrl:Port/pharmacy/signup/editEmployeeDetails
	 * body: @type{JSONObject} body
	 * description: To Update pharmacy employee details.
	 */
	@Put("/signup/editEmployeeDetails")
	editEmployeeDetails(@Body({ validate: true }) body: EditPharmacyEmployee) {
		return this.pharmaSrv.updatePharmacyEmployeeDetails(body);
	}

	/**
	 * method: Delete
	 * url: serverUrl:Port/pharmacy/signup/removeEmployeeDetails
	 * queryparam: @type{number} contact_number
	 * description: To remove current employee.
	 */
	@Delete("/signup/removeEmployeeDetails/:contact_number")
	removeEmployeeDetails(@Param("contact_number") contact_number: string) {
		return this.pharmaSrv.removePharmacyEmployee(contact_number);
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/pharmacy/signup/getEmployeeDetails
	 * queryparam: @type{number} user_id
	 * description: To get employee details for current user.
	 */
	@Get("/signup/getEmployeeDetails/:user_id")
	getEmployeeDetails(@Param("user_id") user_id: number) {
		return this.pharmaSrv.getEmplyoeeDetails(user_id);
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/pharmacy/PharmacyProfile
	 * queryparam: none | @requires{access_token}
	 * description: To get pharmacy setup profile details along with current employee details.
	 */
	@Get("/PharmacyProfile")
	async pharmacyInfo(@CurrentUser() user: any) {
		return this.pharmaSrv.getPharmacyDetails(user.id);
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/pharmacy/profile
	 * queryparam: none | @requires{access_token}
	 * description: To get pharmacy current employee details.
	 */
	@Get("/profile")
	async pharmacyUserInfo(@CurrentUser() user: any) {
		return await this.pharmaSrv.getPharmacyUserDetails(user.id);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/pharmacy/updateProfile
	 * body: @type{JSONObject} body
	 * description: To update pharmacy employee details for currentUser.
	 */
	@Post("/updateProfile")
	async updateProfile(@Body({ validate: true }) body: EditPharmacyUserProfile) {
		return UserProfileService.updateProfile(body);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/pharmacy/updateSetupProfile
	 * body: @type{JSONObject} body | @requires{access_token}
	 * description: To update pharmacy setup profile & to add employees in laboratory.
	 */
	@Post("/updateSetupProfile")
	updateSetupProfile(
		@Body({ validate: true }) body: EditPharmacySetUpProfile,
		@CurrentUser() user: any
	) {
		return this.pharmaSrv.updatePharmacyDetails(body, user.id);
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/pharmacy/sendOtpEmploye
	 * queryparam: @type{string} token
	 * description:
	 */
	@Get("/sendOtpEmploye/:token")
	getSendOtpEmployee(@Param("token") token: any) {
		const isVerified: any = verify(token, JWT_SECRET);
		let userData: any = {};
		if (isVerified) {
			userData.user_id = isVerified.user_id;
			userData.contact_number = isVerified.contact_number;
			return this.userSrv.resendOTP(userData);
		}
		throw new Error(Messages.INVALID_CREDENTIALS);
	}

	@Get("/requestedOrders")
	async getPharmacyReqOrders(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: PharmacyOrders
	) {
		return this.pharmaSrv.getRequestedOrders(
			user.id,
			query.limit,
			query.offset
		);
	}

	@Get("/acceptedOrders")
	async getPharmacyAcceptOrders(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: PharmacyOrders
	) {
		return this.pharmaSrv.getAcceptedOrders(user.id, query.limit, query.offset);
	}
	@Get("/viewOrder/ElectonicPrescritpion")
	async getElectronicPrescriptions(
		@QueryParam("request_pharmacy_id", { required: true })
		request_pharmacy_id: any
	) {
		return this.pharmaSrv.getElectronicPrescriptions(request_pharmacy_id);
	}

	@Get("/viewOrder/ScannedPrescription")
	get(@QueryParam("request_pharmacy_id") request_pharmacy_id: number) {
		return this.pharmaSrv.getScannedPrescription(request_pharmacy_id);
	}

	@Post("/acceptOrderRequest")
	async acceptOrderRequest(
		@Body({ validate: true }) body: any,
		@CurrentUser() user: any
	) {
		return this.pharmaSrv.acceptOrderRequest(body, user);
	}

	@Post("/cancelOrder")
	async cancelPharmacyOrder(
		@Body({ validate: true }) body: PharmacyCancelOrder
	) {
		return this.pharmaSrv.cancelPharmacyOrder(body);
	}
	@Post("/declineOrderRequest")
	async declineOrderRequest(
		@Body({ validate: true }) body: PharmacyDeclineOrderRequest,
		@CurrentUser() user: any
	) {
		return this.pharmaSrv.declineOrderRequest(body, user.id);
	}

	@Get("/substitute")
	async getMedicineName(
		@QueryParam("substitute_name", { required: true }) substitute_name: string,
		@QueryParam("immunisation", { required: false }) immunisation: boolean
	) {
		return this.docSrv.getMedicineDetailsByName(substitute_name, immunisation);
	}

	@Post("/markOrderAsDelivered")
	async markOrderAsDelivered(
		@CurrentUser() user: any,
		@Body({ validate: true }) body: PharmacyMarkOrderAsDelivered
	) {
		return this.pharmaSrv.markOrderAsDelivered(body, user);
	}

	@Get("/pastOrders")
	async getPharmacyPastOrders(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: PharmacyPastOrders
	) {
		return this.pharmaSrv.getPastOrders(
			user.id,
			query.limit,
			query.offset,
			query.date
		);
	}

	@Get("/pastOrders/ElectronicPrescription")
	async viewPastOrderDetails(
		@QueryParam("order_id", { required: true })
		order_id: string
	) {
		return this.pharmaSrv.viewPastOrderDetails(order_id);
	}
	@Get("/pastOrders/ScannedPrescription")
	async viewPastScannedOrderDetails(
		@QueryParam("order_id", { required: true })
		order_id: string
	) {
		return this.pharmaSrv.getPastScannedOrders(order_id);
	}

	@Get("/awaitingOrders")
	async getPharmacyAwaitingOrders(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: PharmacyOrderSearch
	) {
		return this.pharmaManageSrv.getPhramacyOrder(query.limit, query.offset, query.search, OrderStatusEnum["Sent to Patient for Confirmation"], query.sort, query.order, query.patient_id, user.id)
	}

	
}
