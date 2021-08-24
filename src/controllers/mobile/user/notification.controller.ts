import { NotificationService } from "../../../services/shared/notification.service";
import {
    Post,
    Body,
    Get,
    JsonController,
    BadRequestError,
    CurrentUser,
    QueryParam,
    Delete
} from "routing-controllers";
import { Notifications } from "../../../helpers";
import { SettingsEdit } from "../../../validations/mobile/settings.validations";
import * as path from "path";


@JsonController("/notifications")
export class NotificationController {
    constructor(private notfySrv: NotificationService) { }
    /**
     * method: Post 
     * url: serverUrl:Port/notifications
     * description: To add the data to database for notification.
     */
    @Post("/")
    async addNotificationData() {
        const response: boolean = await this.notfySrv.addData();
        if (!response) {
            throw new BadRequestError("Something went wrong.");
        }
        return response;
    }

    /**
     * method: GET 
     * url: serverUrl:Port/notifications/dummy
     * description: To add the data to database for notification.
     */
    @Get("/dummy")
    async dummySendNotification() {
        let mailStatus = await new Notifications().sendNotification("DOCTOR_RECORD_SESSION_AVAILABLE", { patientName: "Satyam Sharma", bookingId: 511, url: "https://video.twilio.com/v1/Compositions/CJa79d70d4af0fc66e968bef46c6be67f4/Media", pushNotificationValue: { url: "https://video.twilio.com/v1/Compositions/CJa79d70d4af0fc66e968bef46c6be67f4/Media" } }, { contact_number: ["+917982924635"] });

        return mailStatus;
    }

    /**
     * method: GET 
     * url: serverUrl:Port/notifications/settings
     * description: To get the settings of particular user role
     */
    @Get("/settings")
    async getNotificationSettings(@CurrentUser() user: any) {
        const response: any = await this.notfySrv.getSettings(user);
        if (!response) {
            throw new BadRequestError("Something went wrong.");
        }
        return response;
    }

    /**
     * method: Post 
     * url: serverUrl:Port/notifications/settings
     * description: To add the data to database for notification.
     */
    @Post("/settings")
    async editSettings(@Body({ validate: true }) body: SettingsEdit, @CurrentUser() user: any) {
        return await this.notfySrv.settingsEdit(body, user);
    }

    /**
    * method: GET 
    * url: serverUrl:Port/notifications/list
    * queryparams: @type{number} limit, @type{number} offset
    * description: To get notifications list
    */
    @Get("/list")
    async getNotificationsList(@CurrentUser() user: any, @QueryParam("limit") limit: number, @QueryParam("offset") offset: number,) {
        const response: any = await this.notfySrv.getList(user, limit, offset);
        if (!response) {
            throw new BadRequestError("Something went wrong.");
        }
        return response;
    }

    /**
     * method: Delete
     * url: serverUrl:Port/notifications/clearAll
     * queryparam: @type{number} contact_number
     * description: To remove current employee.
     */
    @Delete("/clearAll")
    clearNotifications(@CurrentUser() user: any,) {
        const result = this.notfySrv.removeAllNotifications(user);
        return result;
    }

    // /**
    //  * method: Post 
    //  * url: serverUrl:Port/notifications/dummy
    //  * description: To add the data to database for notification.
    //  */
    // @Get("/dummy")
    // async dummySendNotrification() {
    // 	let mailStatus = await new Notifications().sendNotification("PATIENT_NEW_APPOINTMENT_REQUEST", { patientName: "Khushboo Modi", doctorName: "testing Name" }, { email: "khushboo.modi@neosoftmail.com", subject: "patient new appointment request", contact_number: "+918114438874" });

    // 	return mailStatus;
    // }

    /**
     * method: GET 
     * url: serverUrl:Port/notifications/dummy
     * description: To add the data to database for notification.
     */
    @Get("/demo")
    async demo() {

        const test = path.join(__dirname, "../../../../src/assets/template/pdf_template.html")

        // await exists(test) 

        return test;
        // let mailStatus = await new Notifications().sendNotification("PATIENT_NEW_APPOINTMENT_REQUEST", { patientName: "Khushboo Modi", doctorName: "testing Name" }, { email: "khushboo.modi@neosoftmail.com", subject: "patient new appointment request", contact_number: "+918114438874" });

        // return mailStatus;
    }



}