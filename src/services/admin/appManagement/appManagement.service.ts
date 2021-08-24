import Address from "../../../models/address.model";
import dr_Workplaces from "../../../models/dr_workplaces.model";
import { Op, fn, col } from "sequelize";
import LabWorkplaces from "../../../models/lab_workplaces.model";
import PharmacyWorkplaces from "../../../models/pharmacy_workplaces.model";
import { BadRequestError } from "routing-controllers";
import { RolesEnum } from '../../../constants/roles.enum'
import PharmacyDrug from "../../../models/pharmacy_drug.model";
import Drug from "../../../models/drug.model";
import sequelize from "../../../db/sequalise";
import DrugHistory from "../../../models/drug_history.model";
import { Utils } from "../../../helpers";
import Timeouts from "../../../models/timeouts.model";
import Allergies from "../../../models/allergies.model";
const { QueryTypes } = require("sequelize");


export class AppManagementService {
    async getWorkplaceAddress(role_id: any, search?: string, limit?: number, offset?: number) {

        let { model, table_name } = this.getModelByName(role_id);

        const searchCase = search
            ? {
                [Op.or]: [
                    {
                        [`\$${table_name}.workplace_name\$`]: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        pincode: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        address: {
                            [Op.like]: `%${search}%`,
                        },
                    },
                    {
                        city: {
                            [Op.like]: `%${search}%`,
                        },
                    }
                ],
            }
            : {};

        if (!!model) {
            Address.hasOne(model, { foreignKey: "address_id" });
            model.belongsTo(Address, { foreignKey: "address_id" });

            let data = await Address.findAll({
                include: [{
                    model: model,
                    attributes: [],
                    required: true
                }],
                attributes: [
                    "id",
                    [fn("ST_X", col("location")), "latitude"],
                    [fn("ST_Y", col("location")), "longitude"],
                    "locality",
                    "address",
                    "city",
                    "pincode",
                    [fn("", col(`${table_name}.workplace_name`)), "workplace_name"],
                    [fn("", col(`${table_name}.id`)), "workplace_id"]

                ],
                where: {
                    ...searchCase
                },
                order: [["id", "DESC"]],
                limit: limit != undefined ? limit : null,
                offset: offset != undefined ? offset : null,
                raw: true
            });

            if (limit != undefined && offset != undefined) {
                let total_count = await Address.count({
                    include: [{
                        model: model,
                        attributes: [],
                        required: true
                    }],

                    where: {
                        ...searchCase
                    }
                });
                return { data, limit, offset, total_count }
            }
            return data;
        }
        throw new BadRequestError("Please provide valid Role ID")

    }

    private getModelByName(role_id: number) {
        let mapping = {
            [RolesEnum.Doctor]: { model: dr_Workplaces, table_name: "dr_workplace" },
            [RolesEnum.Staff]: { model: dr_Workplaces, table_name: "dr_workplace" },
            [RolesEnum.Laboratory]: { model: LabWorkplaces, table_name: "lab_workplace" },
            [RolesEnum.Pharmacy]: { model: PharmacyWorkplaces, table_name: "pharmacy_workplace" },
        } as any;

        return !!mapping[role_id] ? mapping[role_id] : null;
    }

    async updateAddress(body: any, role_id: number) {
        let { workplace_id, workplace_name, latitude, longitude } = body;

        const coordinates: number[] = [latitude, longitude];
        const point = { type: "Point", coordinates: coordinates };
        body.location = point;

        let addressupdate = Address.upsert(body);
        let { model } = this.getModelByName(role_id);

        let workplaceUpdate = model.update({
            workplace_name
        }, {
            where: {
                id: workplace_id
            }
        });

        return Promise.all([addressupdate, workplaceUpdate]);
    }
    async saveUpdatePharmacyDrug(drugsArray: Array<any>, pharmacy_id: number) {

        drugsArray = drugsArray.map((el: any) => {
            el.pharmacy_id = pharmacy_id;
            return el;
        });
        await PharmacyDrug.bulkCreate(drugsArray, { updateOnDuplicate: ["cost", "pharmacy_id", "drug_id"] });
        return "success";
    }

    async getPharmacyDrugsData(
        pharmacy_id: number,
        limit?: number,
        offset?: number,
        search?: string,
        addedByAdmin?: boolean
    ) {

        const limitcase = !addedByAdmin ? (offset > 0 ? `limit ${limit} offset ${offset}` : `limit ${limit}`) : '';
        const searchcase = search ? `&& name like '%${search}%'` : '';

        const query = `SELECT pharmacy_drug.id, pharmacy_drug.cost, pharmacy_drug.drug_id, pharmacy_drug.pharmacy_id, (SELECT IF (drug.is_child = 1 , parent_drug.drug_name, drug.drug_name ))  AS name, 
            (SELECT IF (drug.is_child = 1 , parent_drug.drug_manufacturer, drug.drug_manufacturer ) ) AS manufacturer,
            (SELECT IF (drug.is_child = 1 , parent_drug.drug_unit, drug.drug_unit ) ) AS unit,
            (SELECT IF (drug.is_child = 1 , parent_drug.packaging, drug.packaging ))  AS drug_packaging ,
            (SELECT IF (drug.is_child = 1 , parent_drug.drug_salt, drug.drug_salt ))  AS salt, 
            (SELECT IF (drug.is_child = 1 , parent_drug.strength, drug.strength ))  AS drug_strength, 
            (SELECT IF (drug.is_child = 1 , parent_drug.drug_route, drug.drug_route  )) AS route,
            (SELECT IF (drug.is_child = 1 , parent_drug.habit_forming, drug.habit_forming  )) AS drug_habit_forming,
            (SELECT IF (drug.is_child = 1 , parent_drug.schedule_h, drug.schedule_h ))  AS drug_schedule_h, 
            (SELECT IF (drug.is_child = 1 , parent_drug.administration_rules, drug.administration_rules ) ) AS drug_administration_rules,
            (SELECT IF (drug.is_child = 1 , parent_drug.immunisation, drug.immunisation ))  AS drug_immunisation, 
            (SELECT IF (drug.is_child = 1 , parent_drug.also_known_as, drug.also_known_as)  ) AS drug_also_known_as            
            FROM pharmacy_drug AS pharmacy_drug LEFT OUTER JOIN drug AS drug ON pharmacy_drug.drug_id = drug.id LEFT OUTER JOIN drug AS parent_drug ON drug.parent_id = parent_drug.id WHERE pharmacy_drug.pharmacy_id = ${pharmacy_id} ${searchcase}`;

        const drugs = await sequelize.query(`${query} ${limitcase};`, {
            replacements: { limitcase: limitcase },
            type: QueryTypes.SELECT,
        });

        const total_count: any = await sequelize.query(
            `select count(*) as count from (${query}) as tempAllies`,
            {
                type: QueryTypes.SELECT,
            }
        );

        if (addedByAdmin)
            return { total_drug: drugs };

        const count = await PharmacyDrug.count({ where: { pharmacy_id } });
        return { total_count: total_count, total_drug: drugs, limit, offset };

    }

    async mergeDrugsData(body: any, user_id: number) {
        const updateResult: any = await Utils.setTransaction(async () => {
            try {
                let { parent_id, children_ids } = body;


                let alreadyData = await Drug.findAll({
                    where: { parent_id: parent_id }
                });

                let createData: any = [];
                let allIds: any = []

                let unmergeDataPrmise = await alreadyData.map(async (singleData: any) => {
                    if (!children_ids.includes(singleData.id)) {
                        createData.push({
                            drug_id: singleData.id,
                            new_value: `Unmerged from ${parent_id}`,
                            updated_by_user_id: user_id
                        })
                    }

                    allIds.push(singleData.id);
                });
                await Promise.all(unmergeDataPrmise);

                let mergeDataPromise = await Object.keys(children_ids).filter(el => {
                    if (allIds.includes(children_ids[el])) {
                        createData.push({
                            drug_id: children_ids[el],
                            new_value: `Merge to ${parent_id}`,
                            updated_by_user_id: user_id
                        })
                    }
                });
                await Promise.all(mergeDataPromise);

                await DrugHistory.bulkCreate(createData);
                await Drug.update({
                    parent_id: null,
                    is_child: 0
                }, {
                    where: {
                        parent_id: parent_id

                    },
                });

                let drugMergeUpdate = await Drug.update({
                    parent_id: parent_id,
                    is_child: 1
                }, {
                    where: {
                        [Op.or]: {
                            id: { [Op.in]: children_ids },
                            parent_id: { [Op.in]: children_ids }

                        }
                    },
                });

                return { msg: 'Drug merged successfully.' };
            } catch (error) {
                // console.error(`Error in deleting role ==> ${error}`);
                throw new Error(error);
            }
        });

        return updateResult;

    }

    async activeDiactiveDrugData(body: any, user_id: number) {
        const updateResult: any = await Utils.setTransaction(async () => {
            try {
                let { drug_id, activeInactive } = body
                let alreadyData: any = await Drug.findOne({
                    where: { id: drug_id }
                });
                await DrugHistory.upsert({
                    drug_id: drug_id,
                    new_value: activeInactive ? (alreadyData.is_child ? `Unmerged from ${alreadyData.parent_id}` : "Drug activated") : "Drug diactivated",
                    updated_by_user_id: user_id
                });
                let drugUpdate = await Drug.update({
                    parent_id: null,
                    is_child: 0,
                    drug_status: activeInactive
                }, {
                    where: {
                        id: drug_id,
                    }
                });

                return { msg: 'Drug status changed successfully.' };
            } catch (error) {
                throw new Error(error);
            }
        });

        return updateResult;
    }

    async activeDiactiveAllergiesData(body: any, user_id: number) {
        const updateResult: any = await Utils.setTransaction(async () => {
            try {
                let { allergy_id, activeInactive } = body


                let drugUpdate = await Allergies.update({
                    merge_allergies_id: null,
                    status: activeInactive
                }, {
                    where: {
                        id: allergy_id,
                    }
                });

                return { msg: 'Allergy status changed successfully.' };
            } catch (error) {
                throw new Error(error);
            }
        });

        return updateResult;
    }

    async timeoutAddEdit(body: any) {
        try {
            // let { timeout_for } = body;
            body.timeout_for = body.timeout_for.toLowerCase();
            let alreadyExist: any = await Timeouts.findOne({ where: { timeout_for: body.timeout_for.toLowerCase() } });
            if (alreadyExist) {
                body.id = alreadyExist.id
            }
            await Timeouts.upsert(body);

            return { msg: 'Timeout updated.' };
        } catch (error) {
            // console.error(`Error in deleting role ==> ${error}`);
            throw new Error(error);
        }
    }

    async getTimeout(timeout_for: string) {
        let isExist: any = await Timeouts.findOne({ where: { timeout_for: timeout_for.toLowerCase() } });
        return { time_minutes: isExist ? isExist.time_minutes : 0 };

    }

    async mergeAllergiesData(body: any) {
        const updateResult: any = await Utils.setTransaction(async () => {
            try {
                let { parent_id, children_ids } = body;

                await Allergies.update({
                    merge_allergies_id: null,
                    // is_child: 0
                }, {
                    where: {
                        merge_allergies_id: parent_id

                    },
                });

                await Allergies.update({
                    merge_allergies_id: parent_id,
                    // is_child: 1
                }, {
                    where: {
                        [Op.or]: {
                            id: { [Op.in]: children_ids },
                            merge_allergies_id: { [Op.in]: children_ids }

                        }
                    },
                });

                return { msg: 'Allergies merged successfully.' };
            } catch (error) {
                // console.error(`Error in deleting role ==> ${error}`);
                throw new Error(error);
            }
        });

        return updateResult;

    }
}