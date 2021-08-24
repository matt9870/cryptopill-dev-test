import { RolesEnum } from "../../constants/roles.enum";
import UserRole from "../../models/user_role.model";
import NotificationSetting from "../../models/notification_setting.model";

export class UserRoleService {
    async upsertUserRole(userRoleObj: any) {

        const { user_id, role_id } = userRoleObj;

        const isUserRoleExists = userRoleObj.hasOwnProperty("id") ? await this.isUserRoleExists(null, null, userRoleObj.id) : await this.isUserRoleExists(user_id, role_id);

        if (!!isUserRoleExists) {
            isUserRoleExists.active_status = userRoleObj.hasOwnProperty("active_status") ? userRoleObj.active_status : isUserRoleExists.active_status;
            isUserRoleExists.verify_account = userRoleObj.hasOwnProperty("verify_account") ? userRoleObj.verify_account : isUserRoleExists.verify_account;
            isUserRoleExists.isWorkplaceAdmin = userRoleObj.hasOwnProperty("isWorkplaceAdmin") ? userRoleObj.isWorkplaceAdmin : isUserRoleExists.isWorkplaceAdmin;
            isUserRoleExists.status_code = userRoleObj.hasOwnProperty("status_code") ? userRoleObj.status_code : isUserRoleExists.status_code;
            isUserRoleExists.verified_on = userRoleObj.hasOwnProperty("verified_on") ? userRoleObj.verified_on : null;
            return await UserRole.upsert(isUserRoleExists);

        } else {
            const verify_account = userRoleObj.hasOwnProperty("verify_account") ? userRoleObj.verify_account : role_id == RolesEnum.Doctor ? 0 : 1;
            const obj = {
                // id: null,
                user_id: user_id,
                role_id: role_id,
                active_status: userRoleObj.hasOwnProperty('active_status') ? userRoleObj.active_status : 1,
                isWorkplaceAdmin: userRoleObj.hasOwnProperty("isWorkplaceAdmin") ? userRoleObj.isWorkplaceAdmin : 0,
                verify_account: verify_account,
                status_code: userRoleObj.hasOwnProperty("status_code") ? userRoleObj.status_code : 1
            };
            const notificationObj = {
                // id: null,
                user_id: user_id,
                role_id: role_id,
            };
            await NotificationSetting.upsert(notificationObj)
            return await UserRole.upsert(obj);

        }

    }

    async isUserRoleExists(user_id?: number, role_id?: number, id?: number) {


        let whereCondition = {} as any

        if (id) {
            whereCondition.id = id
        } else {
            whereCondition.user_id = user_id;
            whereCondition.role_id = role_id;
        }

        const isUserRoleExists: any = await UserRole.findOne({
            where: whereCondition
        });

        return isUserRoleExists;
    }
}