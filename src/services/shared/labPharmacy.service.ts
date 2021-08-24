import { BadRequestError } from "routing-controllers";
import { col, fn } from "sequelize";
import { RolesEnum } from "../../constants/roles.enum";
import { StatusCode } from "../../constants/status_code.enum";
import { Utils } from "../../helpers";
import Identity from "../../models/identity.model";
import LabWorkplaceUsers from "../../models/lab_workplace_users.model";
import PharmacyWorkplaceUsers from "../../models/pharmacy_workplace_users.model";
import Users from "../../models/users.model";
import UserRole from "../../models/user_role.model";

export class LabPharmacyService {

    async addEmployee(emp: any, workplace_id: number) {

        const isAdminExists = emp.role_id == RolesEnum.Pharmacy ?
            await this.isPharmaAdminExists(workplace_id)
            : await this.isLabAdminExists(workplace_id);

        if (emp.edit_profile == 1 && !!isAdminExists) {
            throw new BadRequestError("Admin already exists for this workplace");
        }

        if (emp.edit_profile == 0 && !isAdminExists) {
            throw new BadRequestError("Admin does not exists for this workplace.")
        }

        let isEmployeeExist: any = await Users.findOne({
            where: { contact_number: emp.contact_number },
            raw: true,
        });

        if (!!isEmployeeExist) {
            throw new BadRequestError("User Already Exists");
        }

        let promiseArray = [];
        const usersBody: any = {
            first_name: emp.first_name,
            middle_name: emp.middle_name,
            last_name: emp.last_name,
            email: emp.email,
            gender: emp.gender,
            birth_date: emp.birth_date,
            contact_number: emp.contact_number,
            lab_or_pharma_employement_number: emp.lab_or_pharma_employement_number,
            default_role: emp.user_role,
            password: Utils.encrypt(emp.password),
            phone_verify: 1,
            email_verify: 1
        };

        const user: any = await Users.create(usersBody, { raw: true });

        if (emp.role_id === RolesEnum.Pharmacy) {
            promiseArray.push(PharmacyWorkplaceUsers.upsert({
                user_id: user.id,
                workplace_id: workplace_id
            }));
        } else if (emp.role_id === RolesEnum.Laboratory) {
            promiseArray.push(LabWorkplaceUsers.upsert({
                user_id: user.id,
                workplace_id: workplace_id
            }));
        }

        let userIdentity: any = await Identity.findOne({
			where: { user_id: user.id },
			raw: true,
		});
		// add identiy entry
		let docDetails: any = {type: emp.document_type, number: emp.document_number};
		if (userIdentity) {
			promiseArray.push(Identity.update(docDetails, { where: { user_id: user.id } }))
		} else {
			docDetails.user_id = user.id;
            promiseArray.push(Identity.create(docDetails));
		}
       
        

        const userRoleBody: any = {
            role_id: emp.role_id,
            user_id: user.id,
            isWorkplaceAdmin: emp.edit_profile,
            active_status: 1,
            verify_account: 1,
            status_code: StatusCode.Verified
        };

        promiseArray.push(UserRole.create(userRoleBody));

        await Promise.all(promiseArray);
        return { user_id: user.id };
    }

    async isPharmaAdminExists(workplace_id: number) {
        Users.hasOne(PharmacyWorkplaceUsers, { foreignKey: "user_id" });
        PharmacyWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });


        Users.hasOne(UserRole, { foreignKey: "user_id" });
        UserRole.belongsTo(Users, { foreignKey: "user_id" });



        return PharmacyWorkplaceUsers.findOne({
            include: [{
                model: Users,
                attributes: [],
                include: [{
                    model: UserRole,
                    attributes: [],
                    required: true,
                    where: {
                        isWorkplaceAdmin: 1
                    }
                }],
                required: true
            }],
            where: {
                workplace_id: workplace_id
            },
            attributes: [
                [fn("", col("isWorkplaceAdmin")), "isWorkplaceAdmin"],
                [fn("", col("workplace_id")), "workplace_id"]
            ],
            raw: true
        });
    }

    async isLabAdminExists(workplace_id: number) {
        Users.hasOne(LabWorkplaceUsers, { foreignKey: "user_id" });
        LabWorkplaceUsers.belongsTo(Users, { foreignKey: "user_id" });


        Users.hasOne(UserRole, { foreignKey: "user_id" });
        UserRole.belongsTo(Users, { foreignKey: "user_id" });



        return LabWorkplaceUsers.findOne({
            include: [{
                model: Users,
                attributes: [],
                include: [{
                    model: UserRole,
                    attributes: [],
                    required: true,
                    where: {
                        isWorkplaceAdmin: 1
                    }
                }],
                required: true
            }],
            where: {
                workplace_id: workplace_id
            },
            attributes: [
                [fn("", col("isWorkplaceAdmin")), "isWorkplaceAdmin"],
                [fn("", col("workplace_id")), "workplace_id"]
            ],
            raw: true
        });
    }

}