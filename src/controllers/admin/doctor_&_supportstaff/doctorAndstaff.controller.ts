import { BadRequestError, Body, Get, JsonController, Post, QueryParams } from "routing-controllers";
import { ResponseMessageEnum } from "../../../constants/constant.enum";
import { RolesEnum } from "../../../constants/roles.enum";
import { DoctorAndStaffService } from "../../../services/admin/doctorAndStaff/doctorAndStaff.service";
import { DoctorService } from "../../../services/mobile/doctor/doctor.service";
import { DoctorStaffService } from "../../../services/mobile/doctorstaff/doctorstaff.service";
import { UserRoleService } from "../../../services/shared/user-role.service";
import { AdminDoctorAndStaffSearch, AdminPateintAppointmentSearch } from "../../../validations/comman/basicInfo.validations";

@JsonController('/admin')
export class DoctorAndStaffController {

    constructor(private drAndstaffSrv: DoctorAndStaffService, private drSrv: DoctorService, private staffSrv: DoctorStaffService, private usrroleSrv: UserRoleService) { }
    /**
     * method: Get
     * url: serverUrl:Port/admin/getAllDoctorAndStaff
     * queryparams: @type{number} limit, @type{number} offset, @type{string} search, @type{string} status, @type{string} type, @type{string} sort, @type{string} order
     * description: To fetch list of all doctors & staff along with their details of personal, workplace, schedule & account info.
     * 
     * For Doc/Staff By ID Case
     * queryparams: @type{number} limit, @type{number} offset, @type{number} user_id
     * description: To fetch single doctor or staff details by just passing user_id in above query to obtain same details as above but or a specific user.
     */
    @Get('/getAllDoctorAndStaff')
    async getAllDoctorsAndStaff(@QueryParams({ validate: true }) query: AdminDoctorAndStaffSearch) {

        const data = await this.drAndstaffSrv.getDoctorAndStaff(query.limit, query.offset, query.search, query.status, query.type, query.sort, query.order, query.user_id);
        return data;
    }

    /**
     * method: Post
     * url: serverUrl:Port/admin/addDoctor
     * body: @type{JSONObject} body
     * description: Admin use this API to add doctors their setup profile & other details.
     */
    @Post('/addDoctor')
    async addDoctorAndStaff(@Body() body: any) {

        const data = await this.drSrv.upsertSetUpProfileDetails(body);
        return data;

    }

    /**
    * method: Post
    * url: serverUrl:Port/admin/addStaff
    * body: @type{JSONObject} body
    * description: Admin use this API to add Staff their setup profile & other details.
    */
    @Post('/addStaff')
    async addStaff(@Body() body: any) {

        const data = await this.staffSrv.upsertSetUpProfile(body);
        return data;

    }

    /**
    * method: Post
    * url: serverUrl:Port/admin/verifyProffession
    * body: @type{JSONObject {@type{number} doctor_id, @type{number} isVerified }} body
    * description: Admin use this API for verifying Professinal details of any doctor.
    */
    @Post('/verifyProffession')
    async verifyProffessionInformation(@Body() body: any) {
        const isProfileExists = await this.usrroleSrv.isUserRoleExists(body.doctor_id, RolesEnum.Doctor);
        if (!isProfileExists) {
            throw new BadRequestError("No doctor profile found for this user")
        }
        const data = await this.drSrv.verifyProffessionalInfo(body.doctor_id, body.isVerified, body.profile_id);
        return data;

    }

    /**
    * method: Get
    * url: serverUrl:Port/admin/getAllPatientAppointments
    * queryparams: @type{number} limit, @type{number} offset, @type{string} search, @type{string} status, 
    *              @type{string} sort, @type{string} order
    * 
    * params to add for AppointmentsByDoctorID: @type{number} doctor_id
    * params to add for AppointmentsByPatientID: @type{number} patient_id
    * 
    * description: To fetch list of all appoinments entry till date along with thier status & timing.
    */
    @Get('/getAllPatientAppointments')
    async getAllDoctorsAppointments(@QueryParams({ validate: true }) query: AdminPateintAppointmentSearch) {
        if(query.doctor_id && query.patient_id){
            throw new BadRequestError(ResponseMessageEnum.BOTH_DOC_PATIENT_NOT_ALLOWED);
        }
        const data = await this.drAndstaffSrv.getAllAppointments(query.limit, query.offset, query.search, query.status, query.sort, query.order, query.doctor_id, query.patient_id);
        return data;
    }
}