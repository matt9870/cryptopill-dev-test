import { BadRequestError, Body, Get, JsonController, Post, QueryParam, QueryParams, Param, CurrentUser } from "routing-controllers";
import { listNotification, notificationEdit } from "../../../validations/admin/notification.validations";
import { NotificationService } from "../../../services/shared/notification.service";
import { UserService } from "../../../services/mobile/user/user.service";
import { AdminPermission } from "../../../constants/adminPermission.enum";


@JsonController('/admin')
export class NotificationManagementController {

    constructor(private notfySrv: NotificationService, private userSrv: UserService) { }


    /**
     * method: Get
     * url: serverUrl:Port/admin/getNotificationTemplateList
     * queryparams: @type{number} limit, @type{number} offset, @type{string} search, @type{string} order,@type{string} sort
     * description: admin can fetch all the notification templates
     */
    @Get('/getNotificationTemplateList')
    async getList(@QueryParams({ validate: true }) query: listNotification, @CurrentUser() user: any) {
        // let permissions: any = await this.userSrv.getAdminRolePermissions(user.id);
        // let isError = false;
        // if (query.role_type == "Patient" && !permissions.includes(AdminPermission.notification_patient)) {
        //     isError = true;
        // }
        // if ((query.role_type == "Doctor" || query.role_type == "Staff") && !permissions.includes(AdminPermission.notification_doctor)) {
        //     isError = true;
        // }
        // if ((query.role_type == "PharmacyAdmin" || query.role_type == "PharmacyEmployee") && !permissions.includes(AdminPermission.notification_pharmacist)) {
        //     isError = true;
        // }
        // if ((query.role_type == "LabAdmin" || query.role_type == "LabEmployee") && !permissions.includes(AdminPermission.notification_lab)) {
        //     isError = true;
        // }

        // if (isError) {
        //     throw new BadRequestError("You don't have permission to access this module.");
        // }
        return await this.notfySrv.getAdminPermissionList(query.limit, query.offset, query.search, query.sort, query.order, query.role_type);
    }

    /**
     * method: Get 
     * url: serverUrl:Port/admin/getNotificationsDetails
     * queryparam: @type{string} key 
     * description: to get detils of particular notification template.
     */
    @Get("/getNotificationDetails/:key")
    async getNotificationDetails(@Param("key") key: string, @CurrentUser() user: any) {
        // let permissions: any = await this.userSrv.getAdminRolePermissions(user.id);

        const result = this.notfySrv.getDetails(key);
        return result;
    }



    /**
     * method: Post
     * url: serverUrl:Port/admin/editNotificationDetails
     * body: @type{JSONObject} body
     * description: admin can edit the message and send notification by details
     */
    @Post('/editNotificationDetails')
    async editNotification(@Body({ validate: true }) body: notificationEdit, @CurrentUser() user: any) {
        let permissions: any = await this.userSrv.getAdminRolePermissions(user.id);
        return this.notfySrv.editNotification(body, user.id, permissions);
    }
}