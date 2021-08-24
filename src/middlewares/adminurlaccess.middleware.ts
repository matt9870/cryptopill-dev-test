import { Middleware, ExpressMiddlewareInterface } from "routing-controllers";
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "routing-controllers";
import { Utils } from "../helpers/Utils";
import { UserService } from "../services/mobile/user/user.service";
import { AdminPermission } from "../constants/adminPermission.enum";

@Middleware({ type: "before" })
export class AdminUrlPreRequestMiddleware implements ExpressMiddlewareInterface {
    constructor(private userSrv: UserService) { }
    async use(
        request: any,
        response: Response,
        next: NextFunction
    ): Promise<void> {


        let addRoleUrl: any = [
            "/admin/savePermission",
        ];
        let editRoleUrl: any = [
            "/admin/editPermission",
        ];
        let deleteRoleUrl: any = [
            "/admin/deleteRole",
        ]
        let adminRoleManagementUrl: any = [
            "/admin/addAdmin",
            "/admin/updateAdminDetail",
            "/admin/verifyEmail",
            "/admin/deleteAdminUser"
        ]
        let userDoctorUrl: any = [
            "/admin/addDoctor",
            "/admin/addStaff",
            "/admin/verifyProffession",
        ]
        let userPharmacistUrl: any = [
            "/admin/verifyPharmacy",
            "/admin/addPharmacyEmployee",
            "/admin/addPharmacy",
            'admin/pharmacy/updateDeliveryInfo',
        ]
        let userLabUrl: any = [
            "/admin/addLaboratory",
            "/admin/addLabEmployee",
            'admin/lab/updateLabTest',
            'admin/verifylab',
            'admin/lab/updateDeliveryAndDiscount',
            'library/tests/save',
            "/admin/verifyLab",

        ]

        let userPatientUrl: any = [
            'patient/addPatient',
        ]


        let allAdminUrls: any = [
            // 'admin/login', 
            // 'admin/forgotPassword', 
            // 'user/resendOTP',
            // 'admin/changePassword',
            // '/user/verifyOTP',
            '/user/updatePassword',
            '/admin/verifyEmail',
            'admin/getdashboard',


            ...userPatientUrl,
            'patient/getPatient',
            'patient/getAllPatients',

            ...userDoctorUrl,
            'doctor/workplaces',
            'doctorStaff/mydoctors',
            'admin/getAllPatientAppointments',
            "/admin/getAllDoctorAndStaff",

            'doctor/workplace/staffList',
            `doctor/getAllDelegates`,

            ...userPharmacistUrl,
            'admin/getPharmacyOrders',
            'admin/pharmacy/viewOrder',
            "/admin/getPharmacists",
            'admin/pharmacyUsers',
            "/admin/allPharmacies",

            ...userLabUrl,
            "/admin/getAllLabs",
            'admin/getLabOrders',
            'admin/lab/viewOrder',
            'admin/labTests',
            "/admin/laboratory/users",
            "/admin/labUsers",


            ...addRoleUrl,
            ...editRoleUrl,
            ...deleteRoleUrl,
            '/admin/getPermissionList',
            '/admin/getRoleList',
            '/admin/getPermissionDetails/',
            "/admin/getRoleUsers",
            ...adminRoleManagementUrl,

            'admin/getNotificationTemplateList',
            'admin/getNotificationDetails/',
            'admin/editNotificationDetails',

            'admin/address/role_id',
            'admin/changeAccountStatus',
            'doctor/workplaces',
            'admin/verifyProfileImage',
            'library/getLibrary',
            'file/uploadWorkplaceDocument',
            'file/getWorkplaceDocument'
        ]



        const token = request.headers.authorization;
        if (token) {
            const user: any = Utils.varifyToken(token);
            if (user.isAdmin && allAdminUrls.includes(request.url.toLowerCase())) {
                let permissions: any = await this.userSrv.getAdminRolePermissions(user.id);

                let isPermissionError = false;
                if (addRoleUrl.includes(request.url) && !permissions.includes(AdminPermission.role_add)) {
                    isPermissionError = true
                }
                if (editRoleUrl.includes(request.url) && !permissions.includes(AdminPermission.role_edit)) {
                    isPermissionError = true
                }
                if (deleteRoleUrl.includes(request.url) && !permissions.includes(AdminPermission.role_delete)) {
                    isPermissionError = true
                }
                if (userPatientUrl.includes(request.url) && !permissions.includes(AdminPermission.user_patient)) {
                    isPermissionError = true
                }

                if (adminRoleManagementUrl.includes(request.url) && !permissions.includes(AdminPermission.role_manage_admin)) {
                    isPermissionError = true
                }
                if (userDoctorUrl.includes(request.url) && !permissions.includes(AdminPermission.user_doctor)) {
                    isPermissionError = true
                }
                if (userPharmacistUrl.includes(request.url) && !permissions.includes(AdminPermission.user_pharmacist)) {
                    isPermissionError = true
                }
                if (userLabUrl.includes(request.url) && !permissions.includes(AdminPermission.user_lab)) {
                    isPermissionError = true
                }

                if (isPermissionError) {
                    throw new BadRequestError("You don't have permission to access this module.");
                }
            }

        }
        return next();

    }
}

@Middleware({ type: "after" })
export class PostRequestMiddleware implements ExpressMiddlewareInterface {
    use(request: Request, response: any, next: any): void {
        console.log("do something after...");
        next();
    }
}
