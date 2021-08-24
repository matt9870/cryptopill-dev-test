import { BadRequestError, NotAcceptableError, NotFoundError } from "routing-controllers";
import AdminRolePermission from "../../../models/admin_role_permission.model";
import AdminRoles from "../../../models/admin_roles.model";
import sequelize from "../../../db/sequalise";
import AdminRoleAssigned from "../../../models/admin_role_assigned.model";
import { Utils } from "../../../helpers";
import Users from "../../../models/users.model";
const { QueryTypes, fn, col, Op } = require('sequelize');

export class AdminRolePermissionService {
    async roleList() {
        const roleList: any = await AdminRoles.findAll({
            attributes: ["id", "role_name"],
            order: [['role_name', 'desc']],
            raw: true,
        });
        return roleList;
    }


    async getAdminPermissionList(limit: number, offset: number, search: string, sort: string = "updatedAt", order: string = "desc", role_id?: number) {

        const initialSeacrhQuery = 'WHERE'
        let searchCase = search
            ? `${initialSeacrhQuery} role_name LIKE '%${search}%'`
            : '';
        const finalFilter = !!role_id ? searchCase ? `${searchCase} AND admin_roles.id = ${role_id}` : `${initialSeacrhQuery} admin_roles.id = ${role_id}` : searchCase;

        const limitcase = `LIMIT ${offset},${limit}`;
        const orderBy = sort == 'updatedAt' ? 'admin_roles.updatedAt' : sort;

        const query = `SELECT
        admin_roles.id,
        role_name,
        admin_roles.updatedAt,
        updated_by_user_id,
        concat(users.first_name, ' ', users.last_name) AS full_name,
        users.email,
        users.contact_number,
        COUNT(assigned_users.id) AS user_count
        FROM
        admin_roles
        LEFT JOIN admin_role_assigned ON admin_roles.id = admin_role_assigned.role_id
        LEFT JOIN users AS assigned_users ON admin_role_assigned.user_id = assigned_users.id and assigned_users.account_activation = 1
        LEFT JOIN users ON admin_roles.updated_by_user_id = users.id
        ${finalFilter}
        GROUP BY admin_roles.id
        ORDER BY ${orderBy} ${order}`

        const permissionList = await sequelize.query(`${query} ${limitcase};`,
            {
                type: QueryTypes.SELECT
            });

        const total_count: any = await sequelize.query(
            `select count(*) as count from (${query}) as tempAllies`,
            {
                type: QueryTypes.SELECT,
            }
        );

        return {
            permissionList: permissionList,
            limit: limit,
            offset: offset,
            total_count: total_count[0].count,
        };;
    }

    async getDetails(role_id: number) {
        if (!role_id) {
            throw new Error("Please select proper role");
        }

        const result: any = await AdminRolePermission.findAll({
            where: { role_id: role_id },
            attributes: [
                "permission_id",
                "permission_name",
            ],
        });

        if (!result) {
            throw new Error("Role not found");
        }
        return result;
    }

    async isRoleNameExists(role_name?: string, role_id: any = false) {
        let idCondition = role_id ? { id: { [sequelize.Op.not]: role_id } } : {}
        const role: any = await AdminRoles.findOne({
            where: {
                [Op.and]: [
                    { role_name: role_name },
                    idCondition
                ]
            },

            raw: true,
        });
        return role;
    }

    async saveAdminRolePermission(body: any, user_id: string) {
        try {
            let permissions: any[] = body.permissions;
            let usrPermissions: any[] = [];
            let adminRoleDetails: any = {
                id: null,
                updated_by_user_id: user_id,
                role_name: body.role_name,
            };
            const role: any = await AdminRoles.create(adminRoleDetails);
            if (role.id) {
                for (let permission of permissions) {
                    let { permission_name = '', permission_id } = permission;
                    let usrPermissionsObj: any = {
                        // updated_by_user_id: user_id,
                        // role_name: body.role_name,
                        role_id: role.id,
                        permission_id,
                        permission_name,
                    };
                    usrPermissions.push(usrPermissionsObj);
                }
                await AdminRolePermission.bulkCreate(usrPermissions, { returning: true });
            }

            return { message: "Permissions added Successfully" };

        } catch (error) {
            throw new BadRequestError("Issue while adding Permissions : " + error);
        }
    }

    async editAdminRolePermission(body: any, user_id: string) {
        try {
            const adminRole: any = await AdminRoles.findOne({
                where: { id: body.role_id },
                raw: true,
            });
            if (adminRole) {
                let role_id = body.role_id;
                let permissions: any[] = body.permissions;
                let usrPermissions: any[] = [];
                let destroyIds = [];
                const roles: any[] = await AdminRolePermission.findAll({
                    where: { role_id: body.role_id },
                    raw: true,
                });
                for (let role of roles) {
                    let { permission_id } = role;
                    let found = permissions.some(permission => permission.permission_id == permission_id)
                    if (!found) {
                        destroyIds.push(permission_id)
                    }
                }
                await AdminRolePermission.destroy({ where: { role_id: role_id, permission_id: destroyIds } })
                for (let permission of permissions) {
                    let { permission_name = '', permission_id } = permission;
                    let found = roles.length > 0 ? roles.some(role => role.permission_id == permission_id) : false;
                    if (!found) {
                        let usrPermissionsObj: any = {
                            // updated_by_user_id: user_id,
                            // role_name: body.role_name,
                            role_id: role_id,
                            permission_id,
                            permission_name,
                        };
                        usrPermissions.push(usrPermissionsObj);
                    }
                }
                await AdminRolePermission.bulkCreate(usrPermissions, { returning: true });
                await AdminRoles.update({
                    updated_by_user_id: user_id,
                    role_name: body.role_name
                }, {
                    where: {
                        id: role_id,
                    },
                });
                AdminRoles.hasOne(AdminRoleAssigned, { foreignKey: "role_id" });
                AdminRoleAssigned.belongsTo(AdminRoles, { foreignKey: "role_id" });

                AdminRoles.hasOne(AdminRolePermission, { foreignKey: "role_id" });
                AdminRolePermission.belongsTo(AdminRoles, { foreignKey: "role_id" });

                const adminAssignedRoles: any = await AdminRoleAssigned.findAll({
                    attributes: [
                        [fn("", col("permission_id")), "permission_id"],
                        [fn("", col("permission_name")), "permission_name"],
                    ],
                    where: {
                        user_id: user_id,
                    },
                    include: [
                        {
                            model: AdminRoles,
                            attributes: [],
                            include: [
                                {
                                    model: AdminRolePermission,
                                    attributes: [],

                                },
                            ],
                        },
                    ],
                    raw: true,
                });
                return { message: "Permissions edited Successfully", permissions: adminAssignedRoles };
            }
            else {
                throw new NotFoundError("Admin role not found");
            }

        } catch (error) {
            throw new BadRequestError("Issue while adding Permissions : " + error);
        }
    }



    async deleteRole(role_id: number) {
        const updateResult: any = await Utils.setTransaction(async () => {
            try {
                Users.hasOne(AdminRoleAssigned, { foreignKey: "user_id" });
                AdminRoleAssigned.belongsTo(Users, { foreignKey: "user_id" });
                const isExist = await AdminRoleAssigned.findOne({
                    where: {
                        role_id: role_id,
                    },
                    include: [
                        {
                            model: Users,
                            attributes: [],
                            where: {
                                account_activation: 1
                            },
                        }
                    ],
                    raw: true,
                });

                if (isExist) throw new NotAcceptableError(`Role has users, so it can't be deleted.`);
                await AdminRolePermission.destroy({ where: { role_id: role_id } })
                await AdminRoleAssigned.destroy({ where: { role_id: role_id } })

                await AdminRoles.destroy({
                    where: {
                        id: role_id,
                    }
                });

                return { message: "Role deleted Successfully" };
            } catch (error) {
                // console.error(`Error in deleting role ==> ${error}`);
                throw new Error(error);
            }
        });

        return updateResult;

    }







}