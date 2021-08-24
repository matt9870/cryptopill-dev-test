import { BadRequestError, Body, Get, JsonController, Post, QueryParam, QueryParams, Param, CurrentUser, Delete } from "routing-controllers";
import { AdminRolePermissionService } from "../../../services/admin/adminRolePermission/adminRolePermission.service";
import { adminRolePermissionSearch, adminRolePermissionAdd, adminRolePermissionEdit } from "../../../validations/admin/adminRolePermission.validations";


@JsonController('/admin')
export class AdminRolePermissionController {

    constructor(private permissionSrv: AdminRolePermissionService) { }

    /**
     * method: Get
     * url: serverUrl:Port/admin/getRoleList
     * description: Use in Admin panel to fetch all the admin role list to display in dropdown
     */
    @Get('/getRoleList')
    async roleList() {
        return await this.permissionSrv.roleList();
    }


    /**
     * method: Get
     * url: serverUrl:Port/admin/getPermissionList
     * queryparams: @type{number} limit, @type{number} offset, @type{string} search, @type{number} role_id
     * description: Use in Admin panel to fetch all the admin role and its permission list
     */
    @Get('/getPermissionList')
    async getList(@QueryParams({ validate: true }) query: adminRolePermissionSearch) {
        return await this.permissionSrv.getAdminPermissionList(query.limit, query.offset, query.search, query.sort, query.order, query.role_id);
    }

    /**
     * method: Get 
     * url: serverUrl:Port/admin/getPermissionDetails
     * queryparam: @type{number} role_id 
     * description: To get role permission details for current role.
     */
    @Get("/getPermissionDetails/:role_id")
    getAdminPermissionDetails(@Param("role_id") role_id: number) {
        const result = this.permissionSrv.getDetails(role_id);
        return result;
    }

    /**
     * method: Post
     * url: serverUrl:Port/admin/savePermission
     * body: @type{JSONObject} body
     * description: Admin use this to add admin role and its permission
     */
    @Post('/savePermission')
    async saveRolePermission(@Body({ validate: true }) body: adminRolePermissionAdd, @CurrentUser() user: any) {
        const isExists = await this.permissionSrv.isRoleNameExists(body.role_name);
        if (isExists) {
            throw new BadRequestError("Role name already exist")
        }
        return this.permissionSrv.saveAdminRolePermission(body, user.id);
    }

    /**
     * method: Post
     * url: serverUrl:Port/admin/editPermission
     * body: @type{JSONObject} body
     * description: Admin use this to edit admin role's permission
     */
    @Post('/editPermission')
    async editRolePermission(@Body({ validate: true }) body: adminRolePermissionEdit, @CurrentUser() user: any) {
        const isExists = await this.permissionSrv.isRoleNameExists(body.role_name, body.role_id);
        if (isExists) {
            throw new BadRequestError("Role name already exist")
        }
        return this.permissionSrv.editAdminRolePermission(body, user.id);
    }


    /**
     * @deprecated
     * method: Delete 
     * url: serverUrl:Port/admin/deleteRole/:role_id
     * body:@type{number} role_id
     * description: To remove role by role id
     */
    @Delete("/deleteRole/:role_id")
    async removeAdminRole(
        @Param("role_id") role_id: number,
        @CurrentUser() user: any
    ) {
        const result = this.permissionSrv.deleteRole(role_id);
        return result;
    }



}