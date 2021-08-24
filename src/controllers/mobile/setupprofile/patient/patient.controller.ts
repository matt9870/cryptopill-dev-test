import {
	Body,
	Get,
	JsonController,
	Post,
	QueryParam,
	CurrentUser,
	QueryParams,
	BadRequestError,
	Put,
	Param
} from "routing-controllers";
import { ResponseMessageEnum } from "../../../../constants/constant.enum";
import { LaboratoryService } from "../../../../services/mobile/laboratory/laboratory.service";
import { PatientService } from "../../../../services/mobile/patient/patient.service";
import { PharmacyService } from "../../../../services/mobile/pharmacy/pharmacy.service";
import { UserService } from "../../../../services/mobile/user/user.service";
import { AdminPatientSearch, ResendOTP } from "../../../../validations/comman/basicInfo.validations";
import { AddLinkAccount, ListLinkAccount, LinkAction, LinkAccount, LinkDetails, MultipaleLinkDetails } from "../../../../validations/comman/patientAccountLink.validations";
import {
	LabOrderRequest,
	LabOrders,
	ReOrderLabRequest,
} from "../../../../validations/comman/labProfile.validations";
import {
	PatientProfile,
	EditPatientProfile,
	BookAppointment,
	NearBySearch,
	Allergies,
	MinorAllergies,
	ReScheduleAppointment,
	MinorAccountValidation,
	EditMinorAccountValidation,
	VerifyPhoneValidation,
	OtpVerification,
	SetPassword,
	RatingAndReview,
	GetRatingAndReview
} from "../../../../validations/comman/patientProfile.validations";
import {
	PharmacyOrderRequest,
	PharmacyOrders,
	ReOrderPharmacyRequest,
} from "../../../../validations/comman/pharmacyProfile.validations";
import { RolesEnum } from "../../../../constants/roles.enum";
import { DoctorService } from "../../../../services/mobile/doctor/doctor.service";
import { Utils } from "../../../../helpers";
import { CancelOrder } from "../../../../validations/comman/users.validation";

@JsonController("/patient")
export class PatientController {
	constructor(
		private patientSrv: PatientService,
		private pharmaSrv: PharmacyService,
		private labSrv: LaboratoryService,
		private userSrv: UserService,
		private docSrv: DoctorService,
	) { }

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/addPatient
	 * body: @type{JSONObject} body
	 * description: To add patient & patient profile details.
	 */
	@Post("/addPatient")
	async addPatient(@Body({ validate: true }) body: PatientProfile) {
		return await this.patientSrv.addPatient(body);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/updatePatient
	 * body: @type{JSONObject} body | @requires{access_token}
	 * description: To update current patient profile & other details.
	 */
	@Post("/updatePatient")
	async updatePatient(
		@Body() body: EditPatientProfile,
		@CurrentUser() user: any
	) {
		return this.patientSrv.updatePatient(body, user.id);
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/patient/getPatient
	 * queryparam: @type{number} id
	 * description: To get patient details for the id provided.
	 */
	@Get("/getPatient")
	async getPatientDetails(@QueryParam("id") id: number) {
		return await this.patientSrv.getPatientDetails(id);
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/patient/getAllPatients
	 * queryparams: @type{number} limit, @type{number} offset, @type{string} search, @type{string} status,
	 *              @type{string} sort, @type{string} order
	 * description: Admin used this API to get list of all patients search patient by name, number, email
	 *              & filter on basis of account status.
	 */
	@Get("/getAllPatients")
	async getAllPatients(
		@QueryParams({ validate: true }) query: AdminPatientSearch
	) {
		return await this.patientSrv.getAllPatients(
			query.limit,
			query.offset,
			query.search,
			query.status,
			query.sort,
			query.order
		);
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/patient/profile
	 * queryparams: none |  @requires{access_token}
	 * description: To get Patient profile details for currentPatient.
	 */
	@Get("/profile")
	async patientProfile(@CurrentUser() user: any) {
		return await this.patientSrv.getSetupProfile(user.id, user.role_id);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/bookAppointment
	 * body: @type{JSONObject} body | @requires{access_token}
	 * description: To book an appointment with doctor for specific workplace at specific date & time.
	 */
	@Post("/bookAppointment")
	async bookAppointment(
		@CurrentUser() user: any,
		@Body({ validate: true }) body: BookAppointment
	) {
		let patientID = body.patient_id && body.patient_id !== user.id ? body.patient_id : user.id;
		const requestBody: any = {
			patient_id: patientID,
			bookedby: user.id,
			...body,
		};

		return await this.patientSrv.createAppointment(requestBody);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/fetchNearByDoctors
	 * body: @type{JSONObject} body
	 * description: To fetch list of doctors nearby for a location within particular range or on video call basis, along with that can
	 *              filter doctor on the basis of specialty, health concerns, workplace & doctor name.
	 */
	@Post("/fetchNearByDoctors")
	async fetchNearByDoctors(
		@Body({ validate: true }) locationInfo: NearBySearch
	) {
		if (locationInfo.specialities && locationInfo.healthConcerns) {
			throw new BadRequestError(
				ResponseMessageEnum.INVALID_DOC_SEARCH_CASE_FILTER
			);
		}
		return this.patientSrv.getNearByDoctors(locationInfo, locationInfo.patient_id);
	}

	@Get("/upcomingAppointments")
	async upcomingPatientAppoiments(
		@CurrentUser() user: any,
		@QueryParam("date") date: string,
		@QueryParam("patient_id") patient_id?: number
	) {
		let patient_user = patient_id ? patient_id : user.id;
		return this.patientSrv.getAllPatientUpComingAppointments(patient_user, date);
	}
	@Get("/prescriptionsForLabTest")
	async prescriptionsForLabTest(
		@CurrentUser() user: any,
		@QueryParam("date") date: string,
		@QueryParam("patient_id") patient_id?: number
	) {
		let patient_user = patient_id ? patient_id : user.id;
		return this.patientSrv.getAllPrescibedTests(patient_user, date);
	}

	@Post("/addLabOrderRequest")
	async addLabOrderRequest(@Body() requestedTests: any) {
		return this.patientSrv.addLabOrderRequest(requestedTests);
	}

	@Get("/prescriptionsForMedicine")
	async prescriptionsForMedicine(
		@CurrentUser() user: any,
		@QueryParam("date") date: string,
		@QueryParam("patient_id") patient_id?: number
	) {
		let patient_user = patient_id ? patient_id : user.id;
		return this.patientSrv.getAllPrescibedMedicines(patient_user, date);
	}

	@Post("/addPharmacyOrderRequest")
	async addPharmacyOrderRequest(@Body() requestedMedicines: any) {
		return this.patientSrv.addPharmacyOrderRequest(requestedMedicines);
	}

	@Post("/reorderToPharmacyRequest")
	async reorderToPharmacyRequest(@Body() requestedMedicines: any) {
		return this.patientSrv.addPharmacyWiseOrderRequest(requestedMedicines);
	}

	@Put("/acceptOrder")
	async patientAcceptOrder(
		@CurrentUser() user: any,
		@QueryParam("requestId") requestId: number
	) {
		return this.patientSrv.updatepatientAcceptOrder(user.id, requestId);
	}
	@Get("/pharmacyOrders/currentRequestedOrders")
	async currentPharmacyRequestedOrders(@CurrentUser() user: any) {
		return this.patientSrv.currentPharmacyRequestedOrders(user.id);
	}

	/**
	* method: Get 
	* url: serverUrl:Port/patient/pharmacyOrders/pendingFullfilment
	* description: to get pending fullfilment orders list.
	*/

	@Get("/pharmacyOrders/pendingFullfilment")
	async pendingFullfilmentOrders(@CurrentUser() user: any) {
		return this.patientSrv.pendingFullfilmentOrders(user.id);
	}

	@Get("/pharmacyOrders/requestAcceptedByPharmacies")
	async reqordersAcceptedByPharmacy(
		@CurrentUser() user: any,
		@QueryParam("order_id", { required: true })
		order_id: string
	) {
		return this.patientSrv.reqordersAcceptedByPharmacy(
			user.id,
			order_id
		);
	}

	@Put("/declineOrder")
	async declineOrder(
		@CurrentUser() user: any,
		@QueryParam("requestId") requestId: number
	) {
		return this.patientSrv.patientdeclineOrder(user.id, requestId);
	}

	@Get("/previouslyOrderedPharmacies")
	async previouslySelectedPharmacies(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: PharmacyOrders
	) {
		return this.patientSrv.previouslySelectedPharmacies(
			user.id,
			query.limit,
			query.offset
		);
	}

	@Get("/pharmacyOrders/orderHistory")
	async getOrderHistory(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: PharmacyOrders
	) {
		return this.patientSrv.getOrderHistory(user.id, query.limit, query.offset);
	}

	@Get("/orderHistory/ElectronicPrescription")
	async viewOrderDetailsInOrderHistory(
		@QueryParam("order_id", { required: true })
		order_id: string
	) {
		return this.pharmaSrv.viewPastOrderDetails(order_id);
	}

	@Post("/reorderToLabRequest")
	async reorderToLabRequest(@Body() requestedTests: any) {
		return this.patientSrv.addLabWiseOrderRequest(requestedTests);
	}

	@Get("/labOrders/currentRequestedOrders")
	async currenLabRequestedOrders(@CurrentUser() user: any) {
		return this.patientSrv.currenLabRequestedOrders(user.id);
	}

	/**
	* method: Get 
	* url: serverUrl:Port/patient/labOrders/pendingFullfilment
	* description: to get pending fullfilment lab orders list.
	*/

	@Get("/labOrders/pendingFullfilment")
	async pendingLabFullfilmentOrders(@CurrentUser() user: any) {
		return this.patientSrv.pendingLabFullfilmentOrders(user.id);
	}

	@Get("/labOrders/requestAcceptedByLabs")
	async reqordersAcceptedByLab(
		@CurrentUser() user: any,
		@QueryParam("order_id", { required: true })
		order_id: string
	) {
		return this.patientSrv.reqordersAcceptedByLabs(user.id, order_id);
	}
	@Get("/orderHistory/ScannedPrescription")
	async viewScannedOrderHistory(
		@QueryParam("order_id", { required: true })
		order_id: string
	) {
		return this.pharmaSrv.getPastScannedOrders(order_id);
	}

	@Put("/labOrders/acceptOrder")
	async patientAcceptLabOrder(
		@CurrentUser() user: any,
		@QueryParam("requestId") requestId: number
	) {
		return this.patientSrv.patientAcceptLabOrder(user.id, requestId);
	}

	@Put("/labOrders/declineOrder")
	async patientdeclineLabOrder(
		@CurrentUser() user: any,
		@QueryParam("requestId") requestId: number
	) {
		return this.patientSrv.patientdeclineLabOrder(user.id, requestId);
	}

	@Get("/previouslyOrderedLabs")
	async previouslySelectedLabs(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: LabOrders
	) {
		return this.patientSrv.previouslySelectedLabs(
			user.id,
			query.limit,
			query.offset
		);
	}

	@Get("/labOrders/orderHistory")
	async getLabOrderHistory(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: LabOrders
	) {
		return this.patientSrv.getLabOrderHistory(
			user.id,
			query.limit,
			query.offset
		);
	}

	@Get("/labOrderHistory/ElectronicPrescription")
	async viewLabOrderDetailsInOrderHistory(
		@QueryParam("order_id", { required: true })
		order_id: string
	) {
		return this.labSrv.viewPastOrderDetails(order_id);
	}

	@Get("/labOrderHistory/ScannedPrescription")
	async viewScannedPrescriptionOrderHistory(
		@QueryParam("order_id", { required: true })
		order_id: string
	) {
		return this.labSrv.getPastScannedOrders(order_id);
	}

	@Post("/addAllergies")
	async patientAllergies(
		@CurrentUser() user: any,
		@Body({ validate: true }) allergiesInfo: Allergies
	) {
		let userID = user.id;
		if (allergiesInfo.user_id) userID = allergiesInfo.user_id;
		return this.patientSrv.addAllergies(userID, allergiesInfo.allergies, allergiesInfo.otherAllergies);
	}

	@Get("/AllAllergies")
	async allAllergies() {
		return this.patientSrv.getAllergies();
	}

	@Get("/allergies")
	async getPatientAllergies(
		@CurrentUser() user: any
	) {
		let returnData = await this.patientSrv.getPatientAllergies(user.id, true);
		// let returnData = await this.patientSrv.getPatientAllergies(1, true);
		return returnData.allergies;
	}

	@Get("/getPatientData")
	async getPatientData(@CurrentUser() user: any) {
		return this.patientSrv.getPatientDetails(user.id);
	}

	@Post("/reScheduleAppointment")
	async reScheduleAppointment(
		@CurrentUser() user: any,
		@Body({ validate: true }) body: ReScheduleAppointment
	) {
		const requestBody: any = {
			patient_id: user.id,
			bookedby: user.id,
			role: user.role,
			...body,
		};

		return this.patientSrv.reScheduleAppointment(requestBody);
	}

	@Get("/visitedDoctors")
	async getVisitedDoctorList(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: LabOrders) {
		return this.patientSrv.getVisitedDoctorList(user.id, query.limit, query.offset);
	}

	@Get("/appBasedMedicalHistory")
	async getAppBasedMedicalHistory(
		@CurrentUser() user: any,
		@QueryParams({ validate: true }) query: LabOrders) {
		return this.patientSrv.getAppBasedMedicalHistory(user.id, query.limit, query.offset);
	}


	/**
	 * method: Post
	 * url: serverUrl:Port/patient/linkAccount
	 * body: @type{JSONObject} body
	 * description: patient can send account link request to other signed up patient
	*/
	@Post('/linkAccount')
	async linkPatientAccount(@Body({ validate: true }) body: AddLinkAccount, @CurrentUser() user: any) {
		const patientAccount = await this.patientSrv.isUserExists(body.phone_number);
		if (!patientAccount) {
			throw new BadRequestError("No user exist")
		}
		else if (patientAccount.id == user.id) {
			throw new BadRequestError("You can not link your own account.")
		}
		return this.patientSrv.saveLinkAccountDetails(body, user, patientAccount.id);
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/patient/getLinkedList?user_id=:user_id
	 * queryparams: @type{number} listType
	 * description: patient can see all the link account list/ admin can view the linked users list of the given user_id
	 */
	@Get('/getLinkedList')
	async linkedList(@CurrentUser() user: any, @QueryParam('user_id') user_id: number) {
		return await this.patientSrv.linkedList(user_id != undefined ? user_id : user.id);
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/patient/getSendRequestLists
	 * queryparams: @type{number} listType
	 * description: patient can see all the pending link request send
	 */
	@Get('/getSendRequestLists')
	async sendRequestList(@CurrentUser() user: any) {
		return await this.patientSrv.getRequestList(user.id, "send");
	}

	/**
	 * method: Get
	 * url: serverUrl:Port/patient/getReceivedRequestList
	 * queryparams: @type{number} listType
	 * description: patient can see all the pending link request received
	 */
	@Get('/getReceivedRequestList')
	async receivedRequestList(@CurrentUser() user: any) {
		return await this.patientSrv.getRequestList(user.id, "received");
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/actionOnLinkRequest
	 * body: @type{JSONObject} body
	 * description: user can accept and reject the link request
	*/
	@Post('/actionOnLinkRequest')
	async acceptRejectLinkRequest(@Body({ validate: true }) body: LinkAction, @CurrentUser() user: any) {
		return this.patientSrv.linkRequestAction(body, user);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/cancelLinkRequest
	 * body: @type{JSONObject} body
	 * description: user can cancel the link request
	*/
	@Post('/cancelLinkRequest')
	async cancelRequest(@Body({ validate: true }) body: LinkAction, @CurrentUser() user: any) {
		return this.patientSrv.cancelRequest(body);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/unlinkAccount
	 * body: @type{JSONObject} body
	 * description: unlink the linked account
	*/
	@Post('/unlinkAccount')
	async setUnlinkAccount(@Body({ validate: true }) body: LinkAccount, @CurrentUser() user: any) {
		return this.patientSrv.unlinkLink(body, user);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/updateLinkDetail/:link_id
	 * body: @type{JSONObject} body
	 * description: patient can update account link request details 
	*/
	@Post('/updateLinkDetail/:link_id')
	async updateDetails(@Body({ validate: true }) body: LinkDetails, @Param("link_id") link_id: number, @CurrentUser() user: any) {
		return this.patientSrv.updateDetails(body, link_id, user.id);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/updateMultipaleLinkDetail
	 * body: @type{JSONObject} body
	 * description: admin can update the permission of linked account
	*/
	@Post('/updateMultipaleLinkDetail')
	async updateMultipaleDetails(@Body({ validate: true }) body: MultipaleLinkDetails) {

		return this.patientSrv.updateMultipleDetails(body);
	}

	/**
	* method: Get 
	* url: serverUrl:Port/patient/getLinkDetails
	* queryparam: @type{number} link_id 
	* description: To get link details.
	*/
	@Get("/getLinkDetails/:link_id")
	getDetails(@Param("link_id") link_id: number, @CurrentUser() user: any) {
		const result = this.patientSrv.getDetails(link_id, user.id);
		return result;
	}

	/**
	* method: Get 
	* url: serverUrl:Port/admin/getRequestedLinkDetails
	* queryparam: @type{number} link_id 
	* description: To get link details.
	*/
	@Get("/getRequestedLinkDetails/:link_id")
	getRequestedDetails(@Param("link_id") link_id: number, @CurrentUser() user: any) {
		const result = this.patientSrv.getDetails(link_id, user.id, true);
		return result;
	}


	/**
	* method: Post
	* url: serverUrl:Port/patient/addMinor
	* body: @type{JSONObject} body
	* description: Patient will add minor account to its account
	*/
	@Post('/addMinor')
	async addMinorAccount(@Body({ validate: true }) body: MinorAccountValidation, @CurrentUser() user: any) {
		let age = await Utils.getAge(body.birth_date);
		if (age >= 18) {
			throw new BadRequestError("Minor account can not be of age above 18 years.")
		}
		return this.patientSrv.addMinorDetails(body, user.id);
	}

	/**
	* method: Get 
	* url: serverUrl:Port/patient/getMinorList?parent_id=:parent_id
	* description: get all minor accounts list linked to logged in account/ admin can get all the minor accounts list for given parent account id 
	*/
	@Get('/getMinorList')
	async getMinorAccounts(@CurrentUser() user: any, @QueryParam('parent_id') parent_id: number) {
		return await this.patientSrv.minorList(parent_id != undefined ? parent_id : user.id);
	}

	/**
	 * method: Get 
	 * url: serverUrl:Port/patient/getMinorDetail/:minor_id
	 * queryparam: @type{number} minor_id 
	 * description: get minor account detail using minor_id.
	 */
	@Get("/getMinorDetail/:minor_id")
	minorDetail(@Param("minor_id") minor_id: number, @CurrentUser() user: any) {
		const result = this.patientSrv.getMinorDetails(minor_id);
		return result;
	}

	/**
	* method: Post
	* url: serverUrl:Port/patient/editMinor
	* body: @type{JSONObject} body
	* description: patient can edit minor account detail linked
	*/
	@Post('/editMinor')
	async editMinorAccount(@Body({ validate: true }) body: EditMinorAccountValidation, @CurrentUser() user: any) {
		let age = await Utils.getAge(body.birth_date);
		if (age >= 18) {
			throw new BadRequestError("Minor account can not be of age above 18 years.")
		}
		return this.patientSrv.editAccount(body);
	}
	/**
	* method: Put
	* url: serverUrl:Port/patient/minorActiveInactive?minor_id=:minor_id&status:status
	* body: @type{JSONObject} body
	* description: patient can activate and diactivate minor account
	*/
	@Put("/minorActiveInactive")
	async changeMinorStatus(
		@CurrentUser() user: any,
		@QueryParam("minor_id") minor_id: number,
		@QueryParam("status") status: number
	) {
		return this.patientSrv.updateminorAccountStatus(minor_id, status);
	}

	/**
	 * method: Get 
	 * url: serverUrl:Port/patient/minorAppBasedMedicalHistory/:minor_id
	 * queryparam: @type{number} minor_id 
	 * description: get minor account app based history using minor_id.
	 */

	@Get("/minorAppBasedMedicalHistory/:minor_id")
	async getMinorAppBasedMedicalHistory(
		@Param("minor_id") minor_id: number,
		@QueryParams({ validate: true }) query: LabOrders, @CurrentUser() user: any) {
		return this.patientSrv.getAppBasedMedicalHistory(minor_id, query.limit, query.offset);
	}


	/**
	* method: Post
	* url: serverUrl:Port/patient/addMinorAllergies
	* body: @type{JSONObject} body
	* description: patient can add allergies of minor account
	*/
	@Post("/addMinorAllergies")
	async minorPatientAllergies(
		@Body({ validate: true }) allergiesInfo: MinorAllergies, @CurrentUser() user: any
	) {
		let userID = allergiesInfo.minor_id;
		return this.patientSrv.addAllergies(userID, allergiesInfo.allergies, allergiesInfo.otherAllergies);
	}


	/**
	 * method: Get 
	 * url: serverUrl:Port/patient/minorAllergies/:minor_id
	 * queryparam: @type{number} minor_id 
	 * description: get minor account allergies.
	 */
	@Get("/minorAllergies/:minor_id")
	async getMinorPatientAllergies(@Param("minor_id") minor_id: number, @CurrentUser() user: any) {
		return this.patientSrv.getPatientAllergies(minor_id);
	}

	/**
	 * method: Post 
	 * url: serverUrl:Port/patient/requestOTP
	 * body: @type{JSONObject} body
	 * description: To add phone number to minor account & generate OTP on given contact_number.
	 */
	@Post("/requestOTP")
	async requestOTP(@Body({ validate: true }) body: VerifyPhoneValidation, @CurrentUser() user: any) {
		const exist = await this.userSrv.isUserExists(body.contact_number, body.minor_id);
		if (!!exist) {
			if (exist.phone_verify) {
				throw new BadRequestError(ResponseMessageEnum.USER_ALREADY_EXISTS);
			}
		}
		body.id = body.minor_id;

		const result = await this.userSrv.requestOTP({ ...body, role_id: RolesEnum.Patient }, true);
		return result;
	}

	/**
	 * method: Post 
	 * url: serverUrl:Port/patient/verifyOTP
	 * body: @type{JSONObject} body
	 * description: To verify OTP sent on contact_number so minor to adult phone can be verfiy.
	 */
	@Post("/verifyOTP")
	async verifyOTP(@Body({ validate: true }) body: OtpVerification, @CurrentUser() user: any) {
		const result = await this.userSrv.verifyOTP(body, true);
		return result;
	}


	/**
	 * method: Post 
	 * url: serverUrl:Port/patient/setPassword
	 * body: @type{JSONObject} body
	 * description: To save password for minor user account converted to adult account.
	 */
	@Post("/setPassword")
	async saveNewPassword(@Body({ validate: true }) body: SetPassword, @CurrentUser() user: any) {
		const result = await this.userSrv.savePassword(body);
		return {};
	}

	/**
	 * method: Post 
	 * url: serverUrl:Port/patient/resendOTP
	 * body: @type{string} contact_number
	 * description: To resend OTP to a contact_number in case OTP is expired.
	 */
	@Post("/resendOTP")
	async resendOTP(@Body({ validate: true }) body: ResendOTP, @CurrentUser() user: any) {
		const result = await this.userSrv.resendOTP(body);
		return result;
	}

	@Get("/mylinkedAccounts")
	async getLinkedUsersList(
		@CurrentUser() user: any
	) {
		return this.docSrv.getAllLinkedUsersList(user.contact_number);
	}

	@Post("/addRatingAndReview")
	async addRatingAndReview(
		@Body({ validate: true }) body: RatingAndReview,
		@CurrentUser() user: any
	) {
		return this.patientSrv.addDrRatingAndReview(body, user.id);
	}

	@Get("/getAllDoctorReviews")
	async getAllDoctorReviews(
		@QueryParams({ validate: true }) query: GetRatingAndReview
	) {
		return this.patientSrv.getAllDoctorRatingAndReviews(query.doctor_id, query.limit, query.offset);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/cancelPharmacyOrder
	 * body: @type{JSONObject} body | @requires{access_token}
	 * description: To cancle pharmacy order
	 */
	@Post("/cancelPharmacyOrder")
	async cancelPharmacyOrder(
		@Body() body: CancelOrder,
		@CurrentUser() user: any
	) {
		return this.patientSrv.cancelOrder(body.order_id);
	}

	/**
	 * method: Post
	 * url: serverUrl:Port/patient/cancelLabOrder
	 * body: @type{JSONObject} body | @requires{access_token}
	 * description: To cancle lab order
	 */
	@Post("/cancelLabOrder")
	async cancelLabOrder(
		@Body() body: CancelOrder,
		@CurrentUser() user: any
	) {
		return this.patientSrv.cancelOrder(body.order_id, true);
	}
}
