import { get } from "config";
import { BadRequestError } from "routing-controllers";
import { RolesEnum } from "../../../constants/roles.enum";
import { StatusCode } from "../../../constants/status_code.enum";
import sequelize from "../../../db/sequalise";
import { Utils } from "../../../helpers";
import Identity from "../../../models/identity.model";
import LabWorkplaceUsers from "../../../models/lab_workplace_users.model";
import PharmacyWorkplaceUsers from "../../../models/pharmacy_workplace_users.model";
import Users from "../../../models/users.model";
import UserRole from "../../../models/user_role.model";
import { UserService } from "../../mobile/user/user.service";
import { FileService } from "../../shared/file.service";
const { QueryTypes } = require("sequelize");
import { fn, Op, col } from 'sequelize'
import PharmacyWorkplaces from "../../../models/pharmacy_workplaces.model";
import TemporaryRequestPharmacy from "../../../models/temporary_request_pharmacy.model";
import { PharmacyService } from "../../mobile/pharmacy/pharmacy.service";
const { AWS_FILE_UPLOAD_LINK } = get("APP");

export class PharmacyUserManageServices {
    async getPharmacistProfiles(limit: number, offset: number, type: string, search: string, sort: string, order: string = "asc", user_id?: number, workplace_id?: number) {
        let subqueryalias = "pharmacists";
        const condition = user_id ? "and user.id = :user_id" : "";
        const limitcase = (offset > 0) ? `limit ${limit}, ${offset}` : `limit ${limit}`;
        let accounttype: any = {
            all: "",
            admin: "admin",
            employee: "employee"
        };
        let typecase =
            type && accounttype[type.toLowerCase()]
                ? `${subqueryalias}.account_type = "${accounttype[type.toLowerCase()]}"`
                : true;
        let filtercase = `${typecase}`;

        let whereclause = "";
        let searchcase = `${subqueryalias}.first_name like '%${search}%' OR ${subqueryalias}.last_name like '%${search}%' OR ${subqueryalias}.full_name like '%${search}%' OR ${subqueryalias}.user_id like '%${search}%' OR ${subqueryalias}.contact_number like '%${search}%' OR ${subqueryalias}.email like '%${search}%' OR ${subqueryalias}.workplace_name like '%${search}%'`;
        let orderbycase = sort
            ? `order by ${subqueryalias}.${sort} ${order}`
            : `order by ${subqueryalias}.user_id asc`;
        if (!user_id && !workplace_id) {
            whereclause = search
                ? `where (${searchcase}) AND (${filtercase}) ${orderbycase}`
                : `where (${filtercase}) ${orderbycase}`;
        }
        if (workplace_id) {
            whereclause = `where workplace_id = ${workplace_id}`;
        } else if (user_id) {
            whereclause = `where user_id = ${user_id}`;
        }


        const query = `select * from (select user.id as user_id , user.first_name ,user.middle_name , user.last_name , CONCAT(user.first_name ,' ' , user.last_name ) as full_name, user.contact_number , user.email,
            user.gender, user.birth_date  , user.lab_or_pharma_employement_number,
            Concat('${AWS_FILE_UPLOAD_LINK}/user_documents', '/' ,'user_', user.id ,'/profile_picture' , '/' , user.profile_image) as profile_image,
            user.profile_image_verify,
            if(new_profile_image IS NOT NULL , Concat('${AWS_FILE_UPLOAD_LINK}/user_documents', '/' ,'user_', user.id ,'/profile_picture' , '/' , user.new_profile_image) , null ) as new_profile_image,
            document.id as document_id,
            document.type as document_type , document.number as document_number,
            pw.id as workplace_id,
            pw.workplace_name,
            pw.franchise_name as franchise , pw.phone_number as workplace_contact,
            pw.delivery_distance as delivery_range , pw.minimum_order_amount as min_order_amount,
            pw.minimum_delivery_charges as delivery_charges, pw.minimum_additional_charges as additional_charges,
            addr.id as address_id, addr.city , addr.address, addr.pincode ,
            ST_X(location) as latitude , ST_Y(location) as longitude,
            a.id as user_role_id , a.role_id as role_id,
            a.active_status,
            if(a.isWorkplaceAdmin = 1, "admin", "employee") as account_type,
            if(a.verify_account = 0 , 0 ,1 ) as isVerified,
            if((select user_id from user_role where role_id  = (select id from roles where role = "Doctor") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isDoctor,
            if((select user_id from user_role where role_id  = (select id from roles where role = "Laboratory") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isLab,
            if((select user_id from user_role where role_id  = (select id from roles where role = "Pharmacy") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isPharma,
            if((select user_id from user_role where role_id  = (select id from roles where role = "Patient") and user_id = user.id LIMIT 1) IS NULL , 0,1 ) as isPatient
            from user_role a join roles b on a.role_id = b.id and b.role = "Pharmacy"
            join users user on a.user_id = user.id  ${condition}
            join pharamcy_workplace_users w on w.user_id = user.id
            left join pharmacy_workplaces pw on pw.id = w.workplace_id
            left join address addr on addr.id = pw.address_id
            left join identity document on document.user_id = user.id) as ${subqueryalias} ${whereclause}`;

        const details: any[] = await sequelize.query(
            `${query} ${limitcase}`,
            {
                replacements: { user_id: user_id, limitcase: limitcase },
                type: QueryTypes.SELECT,
            }
        );

        const total_count: any = user_id ? 0 : await sequelize.query(`select count(*) as count from (${query}) as tempAllies`, {
            type: QueryTypes.SELECT
        })

        return user_id ? details[0] : { details, limit: limit, offset: offset, total_count: total_count[0].count };
    }
    async getAllPharmacyUsers(
        limit: number,
        offset: number,
        search: string,
        type: string,
        sort: string,
        order: string = "asc",
        workplace_id?: number,
        user_id?: number
    ) {
        let accountType: any = {
            All: [0, 1],
            LabAdmin: 1,
            Employee: 0,
        };

        const orderByCase = sort ? [sort, order] : ["id", "asc"];
        const filterCase = type ? accountType[type] : [0, 1];
        const workplaceFilter = !!workplace_id ? { workplace_id } : {};
        const userFilter = !!user_id ? { id: user_id } : {};
        const searchCase = search
            ? {
                [Op.or]: [
                    {
                        first_name: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        last_name: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        id: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        contact_number: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        email: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        '$workplace_name$': {
                            [Op.like]: `%${search}%`,
                        }
                    }
                ],
            }
            : {};

        UserRole.hasOne(Users, { foreignKey: "id" });
        Users.belongsTo(UserRole, { foreignKey: "id", targetKey: "user_id" });

        Identity.hasOne(Users, { foreignKey: "id" });
        Users.belongsTo(Identity, { foreignKey: "id", targetKey: "user_id" });

        PharmacyWorkplaceUsers.hasOne(Users, { foreignKey: "id" });
        Users.belongsTo(PharmacyWorkplaceUsers, {
            foreignKey: "id",
            targetKey: "user_id",
        });

        PharmacyWorkplaces.hasOne(PharmacyWorkplaceUsers, { foreignKey: "workplace_id" });
        PharmacyWorkplaceUsers.belongsTo(PharmacyWorkplaces, { foreignKey: "workplace_id" });

        const { count, rows }: any = await Users.findAndCountAll({
            offset,
            limit,
            order: [orderByCase],
            where: {
                ...searchCase,
                ...userFilter
            },
            attributes: [
                "id",
                "first_name",
                "middle_name",
                "last_name",
                "email",
                "contact_number",
                "birth_date",
                "lab_or_pharma_employement_number",
                "profile_image",
                "new_profile_image",
                [fn("", col("type")), "document_type"],
                [fn("", col("number")), "document_number"],
                [fn("", col("isWorkplaceAdmin")), "isWorkplaceAdmin"],
                [fn("", col("workplace_id")), "workplace_id"],
                [fn("", col("workplace_name")), "workplace_name"],
                [fn("", col("role_id")), "role_id"],

            ],
            include: [
                {
                    model: UserRole,
                    attributes: [],
                    required: true,
                    where: {
                        isWorkplaceAdmin: filterCase,
                        role_id: RolesEnum.Pharmacy,
                    },
                },
                {
                    model: Identity,
                    attributes: [],
                    required: true,
                },
                {
                    model: PharmacyWorkplaceUsers,
                    attributes: [],
                    required: true,
                    where: {
                        ...workplaceFilter
                    },
                    include: [
                        {
                            model: PharmacyWorkplaces,
                            attributes: [],
                            required: true,
                        }
                    ]
                },
            ],
            raw: true,
        });

        let prmoiseArray = [];

        if (!!user_id) {
            const data: any = rows[0];
            data.profile_image = !!data.profile_image ? await new FileService().getProfileImageLink(data.id, data.role_id, data.profile_image) : data.profile_image;
            data.new_profile_image = !!data.new_profile_image ? await new FileService().getProfileImageLink(data.id, data.role_id, data.new_profile_image) : data.new_profile_image
        } else {
            for (let user of rows) {

                prmoiseArray.push(UserRole.findAll({
                    where: {
                        user_id: user.id,
                    },
                }));
            }
            const resolvedVal = await Promise.all(prmoiseArray);

            for (let user of rows) {
                resolvedVal.forEach(userRoles => {
                    userRoles.forEach((role: any) => {
                        role.role_id == RolesEnum.Doctor
                            ? (user.isDoctor = 1)
                            : (user.isDoctor = 0);

                        role.role_id == RolesEnum.Pharmacy
                            ? (user.isPharma = 1)
                            : (user.isPharma = 0);

                        role.role_id == RolesEnum.Patient
                            ? (user.isPatient = 1)
                            : (user.isPatient = 0);

                        user.isPharma = 1;
                    });
                })
            }


        }



        return {
            users: rows,
            limit: limit,
            offset: offset,
            count,
        };
    }

    async getAllPharmacies(limit: number, offset: number, status: string, search: string, sort: string, order: string = "asc", workplace_id?: number) {
        let subqueryalias = "pharmacists";
        const limitcase = (offset > 0) ? `limit ${limit}, ${offset}` : `limit ${limit}`;

        let accoutnStatus: any = {
            all: "",
            unverified_new: `${subqueryalias}.status_code = 2 OR ${subqueryalias}.status_code is null `,
            unverified_edit: `${subqueryalias}.status_code = 3 `,
            verified: `${subqueryalias}.status_code = 1 `,
        };

        let statuscase =
            status && accoutnStatus[status.toLowerCase()]
                ? `${accoutnStatus[status.toLowerCase()]}`
                : true;
        let filtercase = `${statuscase}`;

        let whereclause = "";
        let searchcase = `${subqueryalias}.workplace_id like '%${search}%' OR ${subqueryalias}.workplace_name like '%${search}%'`;
        let orderbycase = sort && sort != "total_users"
            ? `order by ${subqueryalias}.${sort} ${order}`
            : `order by ${subqueryalias}.workplace_id desc`;
        if (!workplace_id) {
            whereclause = search
                ? `where (${searchcase}) AND (${filtercase}) ${orderbycase}`
                : `where (${filtercase}) ${orderbycase}`;
        } else {
            whereclause = `where ${subqueryalias}.workplace_id = ${workplace_id}`;
        }

        const query = `select * from (
        select 
        lw.id as workplace_id,
        lw.is_franchise,
        lw.workplace_name,
        lw.franchise_name as franchise_name ,
        lw.new_franchise_name,
        lw.delivery_distance as delivery_range , 
        lw.gst_number , 
        lw.new_gst_number,
        lw.license_number as license_number,
        lw.new_license_number,
        lw.phone_number,
        lw.delivery_distance,
        lw.delivery_customer,
        lw.discount,
        lw.minimum_order_amount,
        lw.minimum_delivery_charges,
        lw.additional_charges,
        lw.minimum_additional_charges,
        stat.id as status_code,
        stat.status_name,
        addr.id as address_id, addr.city , addr.address, addr.pincode ,
        ST_X(location) as latitude , ST_Y(location) as longitude
        from pharmacy_workplaces lw
        left join address addr on lw.address_id = addr.id
        left join user_status_code stat on stat.id = lw.status_code
        group by workplace_id) as ${subqueryalias} ${whereclause}`;

        let details: any[] = await sequelize.query(
            `${query} ${limitcase}`,
            {
                replacements: { workplace_id: workplace_id, limitcase: limitcase },
                type: QueryTypes.SELECT,
            }
        );

        const queryForAllPharmasist = `select * from (select user.id as user_id , user.first_name ,user.middle_name , user.last_name , user.contact_number , user.email,
            user.gender, user.birth_date  , user.lab_or_pharma_employement_number,
            pw.id as workplace_id,
            pw.workplace_name,
            pw.franchise_name as franchise , pw.phone_number as workplace_contact,
            pw.delivery_distance as delivery_range , pw.minimum_order_amount as min_order_amount,
            pw.minimum_delivery_charges as delivery_charges, pw.minimum_additional_charges as additional_charges,
            addr.id as address_id, addr.city , addr.address, addr.pincode ,
            ST_X(location) as latitude , ST_Y(location) as longitude,
            a.id as user_role_id , a.role_id as role_id,
            a.active_status
            from user_role a join roles b on a.role_id = b.id and b.role = "Pharmacy"
            join users user on a.user_id = user.id  
            join pharamcy_workplace_users w on w.user_id = user.id
            left join pharmacy_workplaces pw on pw.id = w.workplace_id
            left join address addr on addr.id = pw.address_id
            left join identity document on document.user_id = user.id) as temp`;

        const allPhamaUsers: any[] = await sequelize.query(
            `${queryForAllPharmasist}`,
            {
                type: QueryTypes.SELECT,
            }
        );


        details = details.map(current => {
            current.total_users = allPhamaUsers.filter(el => el.workplace_id == current.workplace_id).length;
            return current;
        });


        if (sort) {
            if (sort.toLowerCase() == "total_users" && order.toLowerCase() == "asc") {
                details.sort((a: any, b: any) => a.total_users - b.total_users)
            } else if (sort.toLowerCase() == "total_users" && order.toLowerCase() == "desc") {
                details.sort((a: any, b: any) => b.total_users - a.total_users)
            }
        }

        const total_count: any = workplace_id ? 0 : await sequelize.query(`select count(*) as count from (${query}) as tempAllies`, {
            type: QueryTypes.SELECT
        })

        return workplace_id ? details[0] : { details, limit: limit, offset: offset, total_count: total_count[0].count };
    }

    async updateDeliveryAndDiscountInfo(Obj: any) {
        return PharmacyWorkplaces.update({
            dilivery_distance: Obj.dilivery_distance,
            discount: Obj.discount,
            minimum_order_amount: Obj.minimum_order_amount,
            minimum_delivery_charges: Obj.minimum_delivery_charges,
            additional_charges: Obj.additional_charges,
            minimum_additional_charges: Obj.minimum_additional_charges,
            delivery_customer: Obj.delivery_customer,
            delivery_distance: Obj.delivery_distance

        }, {
            where: {
                id: Obj.workplace_id
            }
        })
    }

    async verifyPharmacy(workplace_id: number, isVerified: boolean) {
        let updateObj;
        if (isVerified) {
            const existingData = await PharmacyWorkplaces.findOne({
                where: {
                    id: workplace_id
                }
            }) as any;

            updateObj = {
                gst_number: existingData.new_gst_number ? existingData.new_gst_number : existingData.gst_number,
                franchise_name: existingData.new_franchise_name ? existingData.new_franchise_name : existingData.franchise_name,
                license_number: existingData.new_license_number ? existingData.new_license_number : existingData.license_number,
                new_gst_number: null,
                new_franchise_name: null,
                new_license_number: null,
                status_code: StatusCode.Verified
            };

        } else {
            updateObj = {
                new_gst_number: null,
                new_franchise_name: null,
                new_license_number: null,
                status_code: StatusCode.Declined
            };


        }
        return PharmacyWorkplaces.update(updateObj, {
            where: {
                id: workplace_id
            }
        })
    }

    async getPhramacyOrder(limit: number, offset: number, search: string, status: number, sort: string, order: string = 'desc', user_id: number, pharmacy_id: number) {


        let subqueryalias = "pharmacists";

        const limitcase = (offset > 0) ? `limit ${limit}, ${offset}` : `limit ${limit}`;

        let whereclause = "";
        let searchcase = `${subqueryalias}.patient_name like '%${search}%' OR ${subqueryalias}.order_id like '%${search}%' OR ${subqueryalias}.cryptopill_id like '%${search}%' OR ${subqueryalias}.order_by like '%${search}%'`;
        let orderbycase = sort
            ? `order by ${subqueryalias}.${sort} ${order}`
            : `order by ${subqueryalias}.order_id asc`;

        let condition = '';

        if (user_id)
            condition = `and a.patient_id = ${user_id}`
        if (pharmacy_id)
            condition = `and a.pharmacy_id = ${pharmacy_id}`

        let statuscase = status ? `${subqueryalias}.status_code = ${status}` : true;

        whereclause = search
            ? `where (${searchcase}) AND ${statuscase} ${orderbycase}`
            : `where ${statuscase} ${orderbycase}`;


        let query = `select * from (select a.pharmacy_id as pharmacy_user_id , a.patient_id as order_by , c.id as cryptopill_id, a.order_status , b.prescription_type , b.order_id ,
            CONCAT(c.first_name , ' ' , c.last_name) as patient_name , c.birth_date as birth_date ,
            c.contact_number as contact_number , c.gender as gender ,
            addr.id as address_id, addr.city , addr.address, addr.pincode ,
            ST_X(location) as latitude , ST_Y(location) as longitude,
            a.full_order , a.partial_order , a.substituted_medicines , a.accept_order_patient , a.createdAt ,
            a.accept_order_pharmacy ,
            null as is_cancelled,
            null as cancel_reason,
            null as summery_id,
            a.order_type,
            f.status_name,
            f.id as status_code,
            1 as inprocess 
            from temporaryrequest_pharmacy a 
            join temporarypatient_order_pharmacy b on a.id = b.temporary_request_pharmacy_id
            join users c on c.id = a.patient_id ${condition}
            left join patient_user pu on pu.user_id = c.id
            left join address addr on addr.id = pu.address_id
            left join order_status_code f on f.id = a.order_status_code
            group by order_id
            
            union all
            
            select a.pharmacy_id as pharmacy_user_id, a.patient_id as order_by , c.id as cryptopill_id , a.order_status , b.prescription_type , b.order_id ,c.first_name ,
            c.birth_date as birth_date ,
            c.contact_number as contact_number , c.gender as gender ,
            addr.id as address_id, addr.city , addr.address, addr.pincode ,
            ST_X(location) as latitude , ST_Y(location) as longitude,
            a.full_order , a.partial_order , a.substituted_medicines , a.accept_order_patient , a.createdAt ,
            a.accept_order_pharmacy ,
            a.is_cancelled ,
            d.cancel_reason ,
            e.id as summery_id,
            a.order_type,
            f.status_name,
            f.id as status_code,
            0 as inprocess
            from request_pharmacy a join patient_order_pharmacy b on a.id = b.request_pharmacy_id
            join users c on c.id = a.patient_id  ${condition}
            left join pharmacy_cancel_order d on a.id = d.order_request_pharmacy_id
            left join order_summary e on e.request_pharmacy_id = a.id
            left join order_status_code f on f.id = a.order_status_code
            left join patient_user pu on pu.user_id = c.id
            left join address addr on addr.id = pu.address_id
            group by order_id ) as ${subqueryalias} ${whereclause}`


        let data = await sequelize.query(`${query} ${limitcase}`, {
            type: QueryTypes.SELECT,
        });
        const total_count: any = await sequelize.query(`select count(*) as count from (${query}) as tempAllies`, {
            type: QueryTypes.SELECT
        })

        return { data, limit: limit, offset: offset, total_count: total_count[0].count }
    }

    async viewOrder(order_id: string, pharma_id: number, user_id: number, pType: string, isInProcess: boolean) {
        if (isInProcess) {
            let tempRequestOrder = await TemporaryRequestPharmacy.findOne({
                where: {
                    order_id: order_id,
                    pharmacy_id: pharma_id,
                    patient_id: user_id
                },
                attributes: ["id"]
            }) as any;
            if (!tempRequestOrder) {
                throw new BadRequestError("Pharmacy Order Request not Found");
            }

            let { id: request_id } = tempRequestOrder;
            if (pType.toLowerCase() == 'electronic')
                return new PharmacyService().getElectronicPrescriptions(request_id);
            if (pType.toLowerCase() == 'scanned')
                return new PharmacyService().getScannedPrescription(request_id);
        } else {
            if (pType.toLowerCase() == 'electronic')
                return new PharmacyService().viewPastOrderDetails(order_id);
            if (pType.toLowerCase() == 'scanned')
                return new PharmacyService().getPastScannedOrders(order_id);
        }
    }
}