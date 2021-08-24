import {
	Get,
	Post,
	Param,
	JsonController,
	Body,
	Put,
	BadRequestError,
	Delete,
	CurrentUser,
	QueryParams,
	QueryParam,
} from "routing-controllers";
import { LaboratoryService } from "../../../../services/mobile/laboratory/laboratory.service";
import {
	EditLabEmployee,
	LabEmployee,
	LabSetUpProfile,
	EditLabSetUpProfile,
	EditLabUserProfile,
	LabTestProfile,
	LabTestSearch,
	LabOrders,
	LabPastOrders,
	LabCancelOrder,
	LabMarkOrderAsDelivered,
	LabDeclineOrderRequest,
} from "../../../../validations/comman/labProfile.validations";
import { UserProfileService } from "../../../../services/shared/user-profile.service";
import { UserService } from "../../../../services/mobile/user/user.service";
import { ResponseMessageEnum } from "../../../../constants/constant.enum";
import { LabOrderSearch } from "../../../../validations/comman/basicInfo.validations";
import { OrderStatusEnum } from "../../../../constants/order_status.enum";
import { AdminLaboratoryService } from "../../../../services/admin/laboratoryManagement/labmanagement.service";
@JsonController("/laboratory")
export class LaboratoryController {
	constructor(
		private labSrv: LaboratoryService,
		private userSrv: UserService,
		private labManageSrv: AdminLaboratoryService,
	) { }

	/**
	 * method: Post
	 * url: serverUrl:Port/laboratory/signup/addSetupProfileDetails
	 * body: @type{JSONObject} body
	 * description: To add laboratory setup profile details.
	 */
	@Post("/signup/addSetupProfileDetails")
	addSetupProfileDetails(@Body({ validate: true }) body: LabSetUpProfile) {
		const result = this.labSrv.upsertSetUpProfileDetails(body);
		return result;
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/laboratory/signup/addEmployeeDetails
	 * body: @type{JSONObject} body
	 * description: To add laboratory admin otp will be send to contact_number added in request.
	 */
	@Post("/signup/addEmployeeDetails")
	async addEmployeeDetails(@Body({ validate: true }) body: any) {
		// const exist = await this.userSrv.isUserExists(body.contact_number);
		// if (!!exist) {
		// 	throw new BadRequestError(ResponseMessageEnum.USER_ALREADY_EXISTS);
		// }
		const result = this.labSrv.upsertLabEmployeeDetails(body);
		return result;
	}

	/**
	 * method: Put
	 * url: serverUrl:Port/laboratory/signup/editEmployeeDetails
	 * body: @type{JSONObject} body
	 * description: To Update laboratory employee details.
	 */
	@Put("/signup/editEmployeeDetails")
	editEmployeeDetails(@Body({ validate: true }) body: EditLabEmployee) {
		const result = this.labSrv.updateLabEmployeeDetails(body);
		return result;
	}

	/**
	 * method: Delete
	 * url: serverUrl:Port/laboratory/signup/removeEmployeeDetails
	 * queryparam: @type{number} contact_number
	 * description: To remove current employee.
	 */
	@Delete("/signup/removeEmployeeDetails/:contact_number")
	removeEmployeeDetails(@Param("contact_number") contact_number: string) {
		const result = this.labSrv.removeLabEmployee(contact_number);
		return result;
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/laboratory/signup/getEmployeeDetails
	 * queryparam: @type{number} user_id
	 * description: To get employee details for current user.
	 */
	@Get("/signup/getEmployeeDetails/:user_id")
	getEmployeeDetails(@Param("user_id") user_id: number) {
		const result = this.labSrv.getEmployeeDetails(user_id);
		return result;
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/laboratory/updateLab
	 * body: @type{JSONObject} body | @requires{access_token}
	 * description: To update laboratory setup profile & to add employees in laboratory.
	 */
	@Post("/updateLab")
	async updateLab(
		@Body({ validate: true }) body: EditLabSetUpProfile,
		@CurrentUser() user: any
	) {
		const updatedLab = await this.labSrv.updateLabProfile(body, user);
		return updatedLab;
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/laboratory/updateProfile
	 * body: @type{JSONObject} body
	 * description: To update laboratory employee details for currentUser.
	 */
	@Post("/updateProfile")
	async updateProfile(@Body({ validate: true }) body: EditLabUserProfile) {
		const updatedProfile = UserProfileService.updateProfile(body);
		return updatedProfile;
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/laboratory/LabProfile
	 * queryparam: none | @requires{access_token}
	 * description: To get laboratory setup profile details along with current employee details.
	 */
	@Get("/LabProfile")
	async labInfo(@CurrentUser() user: any) {
		const result = await this.labSrv.getLabDetails(user.id);
		return result;
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/laboratory/profile
	 * queryparam: none | @requires{access_token}
	 * description: To get laboratory current employee details.
	 */
	@Get("/profile")
	async labUserInfo(@CurrentUser() user: any) {
		const result = await this.labSrv.getLabUserDetails(user.id);
		return result;
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/laboratory/add/test
	 * body: @type{JSONObject} body
	 * description: To add test to be conducted by currentLaboratory.
	 */
	@Post("/add/test")
	async addLabTests(@Body() body: LabTestProfile) {
		const labTest = await this.labSrv.addNewLabTests(body);
		return labTest;
	}

	/**
	 * method: Delete
	 * url: serverUrl:Port/laboratory/remove/test
	 * queryparam: @type{number} test_id
	 * description: To remove current test from laboratory.
	 */
	@Delete("/remove/test/:test_id")
	async removeLabTest(@Param("test_id") test_id: number) {
		const removeLabTest = await this.labSrv.removeLabTest(test_id);
		return removeLabTest;
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/laboratory/labTests
	 * queryparam: @type{number} lab_id, @type{number} limit, @type{number} offset, @type{string} search
	 * description: To get list of all tests conducted by currentLaboratory or search test by name.
	 */
	@Get("/labTests")
	async getLabTests(@QueryParams({ validate: true }) query: LabTestSearch) {
		const result = await this.labSrv.getLabTestsData(
			query.lab_id,
			query.limit,
			query.offset,
			query.search
		);
		return result;
	}

	@Get("/requestedOrders")
	async getLabReqOrders(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: LabOrders
	) {
		return this.labSrv.getRequestedOrders(user.id, query.limit, query.offset);
	}

	@Get("/viewOrder/ElectonicPrescritpion")
	async getElectronicPrescriptions(
		@QueryParam("request_lab_id", { required: true })
		request_lab_id: any
	) {
		return this.labSrv.getElectronicPrescriptions(request_lab_id);
	}

	@Get("/viewOrder/ScannedPrescription")
	get(@QueryParam("request_lab_id") request_lab_id: number) {
		return this.labSrv.getScannedPrescription(request_lab_id);
	}

	@Post("/acceptOrderRequest")
	async acceptOrderRequest(
		@Body({ validate: true }) body: any,
		@CurrentUser() user: any
	) {
		return this.labSrv.acceptOrderRequest(body, user.id);
	}

	@Post("/declineOrderRequest")
	async declineOrderRequest(
		@Body({ validate: true }) body: LabDeclineOrderRequest,
		@CurrentUser() user: any
	) {
		return this.labSrv.declineOrderRequest(body, user.id);
	}

	@Get("/acceptedOrders")
	async getPharmacyAcceptOrders(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: LabOrders
	) {
		return this.labSrv.getAcceptedOrders(user.id, query.limit, query.offset);
	}

	@Post("/cancelOrder")
	async cancelLabOrder(@Body({ validate: true }) body: LabCancelOrder) {
		return this.labSrv.cancelLabOrder(body);
	}

	@Post("/markOrderAsDelivered")
	async markOrderAsDelivered(
		@Body({ validate: true }) body: LabMarkOrderAsDelivered,
		@CurrentUser() user: any
	) {
		return this.labSrv.markOrderAsDelivered(body, user);
	}

	@Get("/pastOrders")
	async getLabPastOrders(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: LabPastOrders
	) {
		return this.labSrv.getPastOrders(
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
		return this.labSrv.viewPastOrderDetails(order_id);
	}

	@Get("/pastOrders/ScannedPrescription")
	async viewPastScannedOrderDetails(
		@QueryParam("order_id", { required: true })
		order_id: string
	) {
		return this.labSrv.getPastScannedOrders(order_id);
	}

	@Get("/viewOrder/customPrescription")
	async viewCustomOrderDetails(
		@QueryParam("request_lab_id", { required: true })
		request_lab_id: any
	) {
		return this.labSrv.viewCustomOrderDetails(request_lab_id);
	}

	@Get("/pastOrders/customPrescription")
	async viewPastCustomOrderDetails(
		@QueryParam("order_id", { required: true })
		order_id: string
	) {
		return this.labSrv.viewPastCustomOrderDetails(order_id);
	}

	@Get("/awaitingOrders")
	async getPharmacyAwaitingOrders(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: LabOrderSearch
	) {
		return this.labManageSrv.getLabOrder(query.limit, query.offset, query.search, OrderStatusEnum["Sent to Patient for Confirmation"], query.sort, query.order, query.patient_id, user.id)
	}
}
