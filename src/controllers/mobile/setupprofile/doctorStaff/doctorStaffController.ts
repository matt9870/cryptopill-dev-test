import {
  Get,
  Post,
  JsonController,
  Body,
  CurrentUser,
  QueryParams,
  QueryParam,
  Param
} from "routing-controllers";
import { DoctorStaffService } from "../../../../services/mobile/doctorstaff/doctorstaff.service";
import { DoctorService } from "../../../../services/mobile/doctor/doctor.service";
import { DoctorStaffSchedules, EditStaffProfile, StaffProfile, DoctorStaffBlockDoctorSchedule, DoctorStaffUnBlockDoctorSchedule, ChangeSchedule } from "../../../../validations/comman/doctorStaff.validation";

@JsonController("/doctorStaff")
export class DoctorStaffController {
  constructor(private staffSrv: DoctorStaffService, private doctorSrv: DoctorService) { }

  /**
   * method: Post 
   * url: serverUrl:Port/doctorStaff/staffprofile
   * body: @type{JSONObject} body
   * description: To add staff setup profile.
   */
  @Post("/staffprofile")
  async setupProfile(@Body({ validate: true }) body: StaffProfile) {
    const result = await this.staffSrv.upsertSetUpProfile(body);
    return result;
  }

  /**
   * method: Get 
   * url: serverUrl:Port/doctorStaff/profile
   * param: None | @requires{access_token}
   * description: To get staff setup profile details as per user passed inside token.
   */
  @Get("/profile")
  async drStaffProfile(@CurrentUser() user: any) {
    const result = await this.staffSrv.getStaffProfile(user.id, user.role_id);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/admin/addDoctor
   * body: @type{JSONObject} body
   * description: Admin use this API to add doctors their setup profile & other details.
   */
  @Post("/updateSetUpProfile")
  async updateStaffProfile(@Body({ validate: true }) body: EditStaffProfile, @CurrentUser() user: any) {
    const result = await this.staffSrv.updateStaffProfile(body, user.id);
    return result;
  }

  /**
   * method: Get 
   * url: serverUrl:Port/doctorStaff/mydoctors
   * queryparam: @type{number} staff_id | @requires{access_token}
   * description: To get list of doctors who have added currentUser as their delegate.
   */
  @Get("/mydoctors")
  async getMyDoctors(@CurrentUser() user: any, @QueryParam('staff_id') staff_id: number) {
    const staffID: number = staff_id ? staff_id : user.id;
    const result = await this.staffSrv.getMyListDoctors(staffID);
    return result;
  }

  /**
   * method: Get 
   * url: serverUrl:Port/doctorStaff/doctorSchedule
   * queryparam: @type{number} doctor_id, @type{string} date, @type{string} day | @requires{access_token}
   * description: To get doctor schedule for given date of workplaces where doctor have assigned currentUser as their delegate.
   */
  @Get("/doctorSchedule")
  async getdoctorSchedule(
    @CurrentUser() user: any,
    @QueryParams({ validate: true }) query: DoctorStaffSchedules) {
    const userID: number = query.user_id ? query.user_id : user.id;
    const result = await this.staffSrv.getMyDoctorSchedule(userID, query.doctor_id, query.date, query.day);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctorStaff/block/schedule
   * body: @type{JSONObject} body | @requires{access_token}
   * description: To block Doctor schedule for specific date & time by staff.
   */
  @Post("/block/schedule")
  async blockSchedule(
    @CurrentUser() user: any,
    @Body({ validate: true }) body: DoctorStaffBlockDoctorSchedule
  ) {
    const result = await this.doctorSrv.blockSchedules(user, body, true);
    return result;
  }

  /**
   * method: Post
   * url: serverUrl:Port/doctorStaff/unBlock/schedule
   * body: @type{JSONObject} body | @requires{access_token}
   * description: To Unblock Doctor schedule for specific date & time by staff.
   */
  @Post("/unBlock/schedule")
  async unBlockSchedule(
    @CurrentUser() user: any,
    @Body({ validate: true }) body: DoctorStaffUnBlockDoctorSchedule
  ) {
    const result = await this.doctorSrv.unBlockSchedules(body.doctor_id, body, user, true);
    return result;
  }

  /**
   * method: Get
   * url: serverUrl:Port/doctorStaff/blockedSchedules/:doctor_id
   * queryparam: @type{number} doctor_id | @requires{access_token}
   * description: To get list of all blocked schedules for a doctor in various workplaces by doctor id.
   */
  @Get("/blockedSchedules/:doctor_id")
  async blockedSchedules(@CurrentUser() user: any, @Param("doctor_id") doctor_id: number) {
    const result = await this.doctorSrv.getBlockedSchedules(doctor_id);
    return result;
  }

  @Post("/changeSchedule")
  async changeSchedule(@Body({ validate: true }) body: ChangeSchedule, @CurrentUser() user: any) {
    const result = await this.staffSrv.changeSchedule(body, user.id, user.role, user);
    return result;
  }

  @Get("/workplaces")
  async getWorkplaceDetails(@CurrentUser() user: any, @QueryParam("doctor_id", { required: true }) doctor_id: number) {
    const result = await this.staffSrv.getStaffWorkplaces(user.id, doctor_id);
    return result;
  }

  @Get("/monthlyAppointments")
  async getAllMonthlyAppointments(
    @QueryParam("doctor_id", { required: true }) doctor_id: number,
   @QueryParam("month", { required: true }) month: number,
   @QueryParam("year", { required: true }) year: number,
  ) {
     return this.doctorSrv.getAllMonthlyAppoinmentList(doctor_id, month, year);
  }
}
