import {
  Post,
  Body,
  Get,
  JsonController,
  Param,
  CurrentUser,
  QueryParam,
  Delete,
  QueryParams,
  BadRequestError,
} from "routing-controllers";

import {
  AddDelegates,
  DoctorSetUpProfile,
  EditDelegates,
  EditDoctorSetUpProfile,
  RemoveDelegates,
  DoctorSchedules,
  BlockDoctorSchedule,
  UnBlockDoctorSchedule,
  CancelAppointment,
  Prescription,
  GetBookingDetails,
  DoctorPatients
} from "../../../../validations/comman/doctorProfile.validations";
import { DoctorService } from "../../../../services/mobile/doctor/doctor.service";
import { RolesEnum } from "../../../../constants/roles.enum";
import { ResponseMessageEnum } from "../../../../constants/constant.enum";

@JsonController("/doctor")
export class DoctorController {
  constructor(private doctorSrv: DoctorService) { }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/drprofile
   * body: @type{JSONObject} body
   * description: 
   */
  @Post("/drprofile")
  async drProfessional(@Body() body: any) {
    const result = await this.doctorSrv.professionalInfo(body);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/drEducation
   * body: @type{JSONObject} body
   * description: 
   */
  @Post("/drEducation")
  async drEducation(@Body() body: any) {
    const result = await this.doctorSrv.education(body);
    return result;
  }

  /**
   * @NotInUse
   * method: Get
   * url: serverUrl:Port/doctor/drEducation
   */
  @Get("/drEducation")
  async getDrEducation(@Body() body: any) {
    const result = await this.doctorSrv.getEducation(body);
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/drUpdateEducation
   * body: @type{JSONObject} body
   * description: 
   */
  @Post("/drUpdateEducation/:education_id")
  async drUpdateEducation(
    @Param("education_id") education_id: number,
    @Body() body: any
  ) {
    const result = await this.doctorSrv.updateEducation(education_id, body);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/mciRegistory
   * body: @type{JSONObject} body
   * description: 
   */
  @Post("/mciRegistory")
  async mciRegistory(@Body() body: any) {
    const result = await this.doctorSrv.mciRegistory(body);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/signup/addSetupProfileDetails
   * body: @type{JSONObject} body
   * description: To add doctor setup profile details.
   */
  @Post("/signup/addSetupProfileDetails")
  addSetupProfileDetails(@Body({ validate: true }) body: DoctorSetUpProfile) {
    const result = this.doctorSrv.upsertSetUpProfileDetails(body);
    return result;
  }

  /**
   * method: Get
   * url: serverUrl:Port/doctor/dashboard
   * queryparams: @type{string} date, @type{string} day |  @requires{access_token}
   * description: To get list of schedule, appointment related to current doctor's workplaces for a particular date.
   */
  @Get("/dashboard")
  async drSchedules(
    @CurrentUser({ required: false }) user: any,
    @QueryParams({ validate: true }) query: DoctorSchedules
  ) {
    const doctor_id: number = query.doctor_id;

    const body: any = {
      doctor_id: doctor_id ? doctor_id : user.id,
      appointment_date: query.date,
      appointment_day: query.day,
    };

    const result = await this.doctorSrv.getSchedules(body);
    return result;
  }

  /**
   * method: Get
   * url: serverUrl:Port/doctor/profile
   * queryparams: none |  @requires{access_token}
   * description: To get currentDoctor setup profile details.
   */
  @Get("/profile")
  async drProfile(@CurrentUser() user: any) {
    const result = await this.doctorSrv.getSetupProfile(user.id, user.role_id);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/updateSetupProfile
   * body: @type{JSONObject} body | @requires{access_token}
   * description: To update doctor setup profile details.
   */
  @Post("/updateSetupProfile")
  updateSetupProfile(
    @Body({ validate: true }) body: EditDoctorSetUpProfile,
    @CurrentUser() user: any
  ) {
    const result = this.doctorSrv.updateDoctorProfile(body, user);
    return result;
  }

  /**
   * method: Get
   * url: serverUrl:Port/doctor/workplaces
   * queryparam: @type{number} doctor_id
   * description: To get list of all workplaces where doctor practices.
   */
  @Get("/workplaces")
  async getDrWorkplaces(@QueryParam("doctor_id") doctor_id: number) {
    const result = await this.doctorSrv.getAllWorkplaces(doctor_id);
    return result;
  }

  /**
   * method: Get
   * url: serverUrl:Port/doctor/workplace/staffList
   * queryparam: @type{number} workplace_id
   * description: To get list of all staff working in a workplace i.e a hospital, clinic.
   */
  @Get("/workplace/staffList")
  async getStaffList(
    @QueryParam("workplace_id", { required: true }) workplace_id: number
  ) {
    const result = await this.doctorSrv.getStaffInfo(workplace_id);
    return result;
  }

  /**
   * method: Get
   * url: serverUrl:Port/doctor/getAllDelegates
   * queryparam: @type{number} doctor_id | @requires{access_token}
   * description: To get list of all delegates working for a doctor in various workplaces.
   */
  @Get("/getAllDelegates")
  async getAllDelegates(
    @CurrentUser() user: any,
    @QueryParam("doctor_id") doctor_id: number
  ) {
    const user_id = doctor_id ? doctor_id : user.id;
    const result = await this.doctorSrv.getAllDelegates(user_id);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/addDelegates
   * body: @type{JSONObject} body | @requires{access_token}
   * description: To add delegates for currentDoctor for specific workplace.
   */
  @Post("/addDelegates")
  async addDelegate(
    @Body({ validate: true }) body: AddDelegates,
    @CurrentUser() user: any
  ) {
    const user_id = body.doctor_id ? body.doctor_id : user.id;
    const result = await this.doctorSrv.addDelegates(body, user_id);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/updateDelegates
   * body: @type{JSONObject} body | @requires{access_token}
   * description: To update delegates permission's for current Doctor selected workplace.
   */
  @Post("/updateDelegates")
  async updateDelegate(
    @Body({ validate: true }) body: EditDelegates,
    @CurrentUser() user: any
  ) {
    const user_id = body.doctor_id ? body.doctor_id : user.id;
    const result = await this.doctorSrv.editDelegates(body, user_id);
    return result;
  }

  /**
   * method: Delete
   * url: serverUrl:Port/doctor/removeDelegates
   * queryparam: @type{number} staff_id, @type{number} workplaces_id | @requires{access_token}
   * description: To remove a delegate from current doctor selected workplace.
   */
  @Delete("/removeDelegates")
  async removeDelegate(
    @QueryParams({ validate: true }) body: RemoveDelegates,
    @CurrentUser() user: any
  ) {
    const user_id = body.doctor_id ? body.doctor_id : user.id;

    const result = await this.doctorSrv.removeDelegates(
      body.workplaces_id,
      body.staff_id,
      user_id
    );
    return result;
  }

  /**
   * method: Get
   * url: serverUrl:Port/doctor/blockedSchedules
   * queryparam: @type{number} doctor_id | @requires{access_token}
   * description: To get list of all blocked schedules for a doctor in various workplaces.
   */
  @Get("/blockedSchedules")
  async blockedSchedules(@CurrentUser() user: any) {
    const result = await this.doctorSrv.getBlockedSchedules(user.id);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/block/schedule
   * body: @type{JSONObject} body | @requires{access_token}
   * description: To block currentDoctor schedule for specific date & time.
   */
  @Post("/block/schedule")
  async blockSchedule(
    @CurrentUser() user: any,
    @Body({ validate: true }) body: BlockDoctorSchedule
  ) {
    const result = await this.doctorSrv.blockSchedules(user, body);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/unBlock/schedule
   * body: @type{JSONObject} body | @requires{access_token}
   * description: To Unblock currentDoctor schedule for specific date & time.
   */
  @Post("/unBlock/schedule")
  async unBlockSchedule(
    @CurrentUser() user: any,
    @Body({ validate: true }) body: UnBlockDoctorSchedule
  ) {
    const result = await this.doctorSrv.unBlockSchedules(user.id, body, user);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctor/cancelAppointment
   * body: @type{JSONObject} body | @requires{access_token}
   * description: To cancel Appointment for specific date & time for particular workplace.
   */
  @Post("/cancelAppointment")
  async cancelAppointment(
    @CurrentUser() user: any,
    @Body({ validate: true }) body: CancelAppointment
  ) {
    const result = await this.doctorSrv.cancelBooking(
      body.bookingID,
      user.role,
      body.bookingID,
      body.reason
    );
    return result;
  }

  /**
   * method: Get
   * url: serverUrl:Port/doctor/drProfile
   * queryparam: @type{number} doctor_id
   * description: To get doctor workplace details along with schedule after patient click on any doctor
   *              from doctor list in Patient Search Module.
   */
  @Get("/drProfile")
  async getDrProfiles(
    @QueryParam("doctor_id", { required: true }) doctor_id: number
  ) {
    const result = await this.doctorSrv.getDrProfile(doctor_id);
    return result;
  }

  /**
   * method: Get
   * url: serverUrl:Port/doctor/verifyStatus
   * queryparam: @type{number} doctor_id
   * description: To get doctor account verfication status.
   */
  @Get("/verifyStatus")
  async getVerifyStatus(@QueryParam("doctor_id", { required: true }) doctor_id: number) {
    const result = await this.doctorSrv.getVerficationStatus(doctor_id);
    return result;
  }

  @Get("/patientBookingDetails")
  async getPatientDetails(@QueryParams({ required: true }) query: GetBookingDetails) {
    return this.doctorSrv.getPatientBookingDetails(query.booking_id, query.limit, query.offset);
  }

  @Get("/doctorsbyname")
  async getAllDoctorsByName(@QueryParam("name", { required: true }) name: string) {
    return this.doctorSrv.getAllDoctorsByName(name);
  }

  @Post("/addPrescription")
  async addPrescription(@CurrentUser() user: any,
    @Body({ validate: true }) body: any) {
    if (user.role_id !== RolesEnum.Doctor) throw new BadRequestError(ResponseMessageEnum.DOCTOR_ONLY_GIVE_PRESCRIPTION);
    return this.doctorSrv.addPrescrption(body);
  }

  @Get("/medicine")
  async getMedicineName(@QueryParam("medicine_name", { required: true }) medicine_name: string,
    @QueryParam("immunisation", { required: false }) immunisation: boolean,
  ) {
    return this.doctorSrv.getMedicineDetailsByName(medicine_name, immunisation);
  }

  @Get("/prescriptionDetails")
  async getPrescriptionDetails(@QueryParam("prescriptions_id", { required: true }) prescriptions_id: number) {
    return this.doctorSrv.getPrescriptionDetails(prescriptions_id);
  }

  @Get("/myPatients")
  async getMyPatientList(
    @CurrentUser() user: any,
    @QueryParams({ validate: true }) query: DoctorPatients,
  ) {
    return this.doctorSrv.getMyPatientList(user.id, query.limit, query.offset, query.search, query.date);
  }

  @Post("/addOfflinePrescription")
  async addOfflinePrescription(@CurrentUser() user: any,
    @Body({ validate: true }) body: any) {
    if (user.role_id !== RolesEnum.Doctor) throw new BadRequestError(ResponseMessageEnum.DOCTOR_ONLY_GIVE_PRESCRIPTION);
    return this.doctorSrv.addOfflinePrescrptionDetails(body, user.id);
  }

  @Get("/linkedUsers")
  async getLinkedUsersList(
    @QueryParam("contact_number", { required: true }) contact_number: string,
  ) {
    return this.doctorSrv.getAllLinkedUsersList(contact_number);
  }

  @Get("/monthlyAppointments")
  async getAllMonthlyAppointments(
    @CurrentUser() user: any,
    @QueryParam("month", { required: true }) month: number,
    @QueryParam("year", { required: true }) year: number,
  ) {
    return this.doctorSrv.getAllMonthlyAppoinmentList(user.id, month, year);
  }

  /**
     * method: Post 
     * url: serverUrl:Port/doctor/sharePrescription
     * body: @type{JSONObject} body
     * description: to share the offline prescription pdf link to the patient, by sms.
     */
  @Post("/sharePrescription")
  async shareOfflinePrescription(@Body() body: any) {
    return this.doctorSrv.sendOfflinePrescriptionSms(body.patientName, body.doctorName, body.link, body.contact_number);
  }
}
