import { BadRequestError, NotFoundError } from "routing-controllers";
import Allergies from "../../../models/allergies.model";
import MedicalConventions from "../../../models/medical_conventions.model";
import Qualifications from "../../../models/qualifications.model";
import RegistrationCouncil from "../../../models/registration_council.model";
import Roles from "../../../models/roles.model";
import Speciality from "../../../models/specialities_speciality.model";
import Symptoms from "../../../models/symptoms.model";
import Universitys from "../../../models/universitys.model";
import tests from "../../../models/tests.model";
import HealthConcerns from "../../../models/health_concerns.model";
import SpecialitiesSymptoms from "../../../models/specialities_symptoms.model";
import SpecalitiesHealthConcerns from "../../../models/specialities_health_concerns.model";
import user_status_code from "../../../models/user_status_codes";
import Tests from "../../../models/tests.model";
import { Op, fn, col, QueryTypes } from "sequelize";
import Mainsequelize = require("sequelize");
import sequelize from '../../../db/sequalise'
import OrderStatusCode from "../../../models/order_status_code";
import Drug from "../../../models/drug.model";
import DrugHistory from "../../../models/drug_history.model";
import Users from "../../../models/users.model";

export class LibraryService {
    async getLibraryDetails(library_name: string, search?: string, filter?: any, sort: string = "id", order = "DESC", limit?: number, offset?: number, id?: number, is_admin: boolean = false, drug_manufacturer?: string, drug_unit?: string, drug_route?: string, drug_status?: number, is_parent?: number) {

        if (is_admin && library_name.toLowerCase() === "drugs") {
            return this.getDrugsLibrary(search, filter, sort, order, limit, offset, id, is_parent, drug_manufacturer, drug_unit, drug_route, drug_status)
        }

        const { model, searchCols } = this.getLibraryModel(library_name);

        let searchCase: any = search ? {
            [Op.or]: searchCols.map((el: any) => {
                return {
                    [el]: {
                        [Op.like]: `%${search}%`
                    }
                }
            })
        } : {};

        let status_case = {} as any;
        // let parentSarchCase: any = {};

        if (library_name.toLowerCase() === "allergies" || library_name.toLowerCase() === "speciality") {
            if (library_name.toLowerCase() === "allergies" && is_admin) {
                return this.getAllergiesLibrary(search, filter, sort, order, limit, offset, id, is_parent)
            }
            if (filter != undefined)
                status_case.status = filter;
            if (!is_admin) {
                status_case.status = 1;
                if (library_name.toLowerCase() === "allergies") {
                    status_case.merge_allergies_id = null;
                    // status_case.status = 1;
                }
            }
        }

        else if (library_name.toLowerCase() === "medical_convention" || library_name.toLowerCase() == "tests") {
            if (!is_admin)
                status_case.status = true;
        }
        else if (library_name.toLowerCase() == "health_concerns") {
            return this.getHealthConcerns(search, filter, sort, order, limit, offset, id, is_admin);
        }

        else if (library_name.toLowerCase() == "symptoms") {
            return this.getSymptoms(search, limit, offset, id, is_admin, sort, order);
        }


        if (is_admin && is_parent) {
            if (library_name.toLowerCase() === "allergies") {
                status_case.id = { [Op.ne]: id }
                status_case.merge_allergies_id = null
            }
            else if (library_name.toLowerCase() === "drugs") {
                status_case.id = { [Op.ne]: id }
                status_case.is_child = 0;
            }
        }

        let merged_condition = {} as any;
        let attributeData = {} as any;
        let drugSearchCase: any = {};
        if (library_name.toLowerCase() == "merged_drugs") {
            merged_condition.parent_id = id;
        }
        if (library_name.toLowerCase() == "merged_allergies") {
            merged_condition.merge_allergies_id = id;
        }
        else if (library_name.toLowerCase() == "drugs_history") {
            merged_condition.drug_id = id;
            Users.hasOne(DrugHistory, { foreignKey: "updated_by_user_id" });
            DrugHistory.belongsTo(Users, { foreignKey: "updated_by_user_id" });
            attributeData = {
                include: [
                    {
                        model: Users,
                        attributes: []
                    },

                ],
                attributes: [
                    "id",
                    "drug_id",
                    "column_name",
                    "old_value",
                    "new_value",
                    "createdAt",
                    "updated_by_user_id",
                    [fn("", col("email")), "email"],
                    [
                        fn("CONCAT", col("first_name"), " ", col("last_name")),
                        "full_name",
                    ],
                ],
                group: ["id"],

            }

        }
        else if (library_name.toLowerCase() == "speciality") {
            MedicalConventions.hasOne(Speciality, { foreignKey: "medical_conventions_id" });
            Speciality.belongsTo(MedicalConventions, { foreignKey: "medical_conventions_id" });
            attributeData = {
                include: [
                    {
                        model: MedicalConventions,
                        attributes: [],
                        // as: "medical"
                    },

                ],
                attributes: [
                    "id",
                    // "is_approv",
                    "name",
                    "user_id",
                    "medical_conventions_id",
                    "date_time",
                    "status",
                    // [sequelize.literal(`medical.name`), 'medical_convention_name'],
                    [fn("", col("medical_convention.name")), "medical_convention_name"],

                ],
                group: ["id"],

            }

        }
        else if (library_name.toLowerCase() == "drugs") {
            let hasCondition: boolean = false;
            let drugSearch: any = []
            if (drug_manufacturer) {
                hasCondition = true;
                drugSearch.push({
                    drug_manufacturer: drug_manufacturer
                })
            }
            if (drug_unit) {
                hasCondition = true;
                drugSearch.push({
                    drug_unit: drug_unit
                })
            }
            if (drug_route) {
                hasCondition = true;
                drugSearch.push({
                    drug_route: drug_route
                })
            }
            if (drug_status) {
                hasCondition = true;
                if (drug_status === 1) {
                    //1 is for active parent
                    drugSearch.push({
                        drug_status: 1
                    });
                    drugSearch.push({
                        is_child: 0
                    })
                }
                else if (drug_status === 2) {//2 is for inactive and child
                    drugSearch.push({
                        [Op.or]: [
                            { drug_status: 0 },
                            { is_child: 1 }
                        ]
                    });
                }
            }
            if (hasCondition) {
                drugSearchCase = {
                    [Op.and]: drugSearch
                }
            }

        }


        if (model) {
            let data = await model.findAll({
                where: {
                    ...searchCase,
                    ...status_case,
                    ...merged_condition,
                    ...drugSearchCase,
                },
                ...attributeData,
                order: sort ? [[sort, order]] : null,
                limit: limit != undefined ? limit : null,
                offset: offset != undefined ? offset : null,
                raw: true,
            });



            if (limit != undefined && offset != undefined) {
                let total_count = await model.count({
                    where: {
                        ...searchCase,
                        ...status_case,
                        ...merged_condition,
                        ...drugSearchCase,

                    },
                    // ...attributeData,
                    // raw: true,

                });

                return { data, limit, offset, total_count }
            }
            return data;
        }
        throw new NotFoundError("No library Found");
    }

    async getAllergiesLibrary(search?: string, filter?: any, sort: string = "id", order = "DESC", limit?: number, offset?: number, id?: number, is_parent?: number) {
        let parentcase = is_parent ? `allergies.id != ${id} AND allergies.merge_allergies_id IS NULL` : true;
        let statuscase = filter != undefined ? `allergies.status = ${filter}` : `allergies.status != -1`;
        let filtercase = `${parentcase} AND ${statuscase}`;

        let searchcase = search ? `(allergies.name like '%${search}%' OR parent.name like '%${search}%')` : true;
        let orderbycase = sort ? `order by allergies.${sort} ${order}` : ``;
        const limitcase = (offset > 0) ? `limit ${limit} offset ${offset}` : `limit ${limit}`;

        let whereclause = `where ${filtercase} AND ${searchcase} ${orderbycase}`;

        const query = `SELECT allergies.id, allergies.name , allergies.status, allergies.merge_allergies_id, allergies.user_id,allergies.date_time, parent.name AS parent_name FROM allergies AS allergies LEFT OUTER JOIN allergies AS parent ON allergies.merge_allergies_id = parent.id ${whereclause}`


        const data = await sequelize.query(
            `${query} ${limitcase};`,
            {
                replacements: { limitcase: limitcase },
                type: QueryTypes.SELECT
            }
        );

        const total_count: any = await sequelize.query(`select count(*) as count from (${query}) as tempAllies`, {
            type: QueryTypes.SELECT
        })



        if (limit != undefined && offset != undefined) {
            return { data, limit, offset, total_count: total_count[0].count }
        }
        return data;
    }

    async getDrugsLibrary(search?: string, filter?: any, sort: string = "id", order = "DESC", limit?: number, offset?: number, id?: number, is_parent?: number, drug_manufacturer?: string, drug_unit?: string, drug_route?: string, drug_status?: number) {
        let parentcase = is_parent ? `drug.id != ${id} AND drug.is_child = 0` : true;
        let manufacturercase = drug_manufacturer ? `drug.drug_manufacturer = ${drug_manufacturer} ` : true;
        let unitcase = drug_unit ? `drug.drug_unit = ${drug_unit} ` : true;
        let routecase = drug_route ? `drug.drug_route = ${drug_route} ` : true;
        let statuscase = drug_status ? (drug_status === 1 ? `drug.drug_status = 1 AND drug.is_child = 0` : (drug_status === 2 ? `(drug.drug_status = 0 OR drug.is_child = 1)` : true)) : true;
        // let statuscase = filter != undefined ? `allergies.status = ${filter}` : `allergies.status != -1`;
        let filtercase = `${parentcase} AND ${manufacturercase} AND ${unitcase} AND ${routecase} AND ${statuscase}`;

        let searchcase = search ? `(drug.drug_name like '%${search}%' OR parent.drug_name like '%${search}%')` : true;
        let orderbycase = sort ? `order by drug.${sort} ${order}` : ``;
        const limitcase = (offset > 0) ? `limit ${limit} offset ${offset}` : `limit ${limit}`;

        let whereclause = `where ${filtercase} AND ${searchcase} ${orderbycase}`;

        const query = `SELECT drug.id, drug.drug_name , drug.also_known_as, drug.drug_manufacturer, drug.drug_unit, drug.packaging, drug.drug_salt, drug.recommended_dose, drug.strength, drug.drug_route, drug.habit_forming, drug.narcotics, drug.schedule_h, drug.administration_rules, drug.drug_status,drug.immunisation, drug.is_child, drug.parent_id, parent.drug_name AS parent_name FROM drug AS drug LEFT OUTER JOIN drug AS parent ON drug.parent_id = parent.id ${whereclause}`


        const data = await sequelize.query(
            `${query} ${limitcase};`,
            {
                replacements: { limitcase: limitcase },
                type: QueryTypes.SELECT
            }
        );

        const total_count: any = await sequelize.query(`select count(*) as count from (${query}) as tempAllies`, {
            type: QueryTypes.SELECT
        })



        if (limit != undefined && offset != undefined) {
            return { data, limit, offset, total_count: total_count[0].count }
        }
        return data;
    }

    async saveupdateLibraryDetails(body: any) {
        const { model } = this.getLibraryModel(body.library_name);

        if (body.library_name.toLowerCase() == "health_concerns") {
            return this.saveUpdateHealthConcern(body.health_concerns)
        }
        if (body.library_name.toLowerCase() == "symptoms") {
            // this.saveUpdateHealthConcern(body.health_concerns)

            return this.saveUpdateSymptoms(body.symptoms)
        }

        if (model) {
            if ((body.library_name.toLowerCase() === "speciality" || body.library_name.toLowerCase() === "medical_convention" || body.library_name.toLowerCase() === "allergies") && !body.id) {
                await model.bulkCreate(body.data);
                return true;
            }
            else {

                let newId = {} as any;
                if (!body.id) {
                    const max = await model.max("id");
                    const id = isNaN(max) ? 1 : max + 1;
                    newId.id = id;
                }

                const result = await model.upsert({ ...body, ...newId });
                return await model.findOne({
                    where: {
                        id: body.id ? body.id : newId.id,
                    },
                });
            }
        }

        throw new NotFoundError("No libray found");
    }

    async getHealthConcerns(searchText: any, filter?: any, sort?: string, order = "DESC", limit?: number, offset?: number, id?: number, is_admin: boolean = false) {

        let where = !is_admin ? id != undefined ? { id, status: true } : { status: true } : {}
        Speciality.hasOne(SpecalitiesHealthConcerns, { foreignKey: "speciality_id" });
        HealthConcerns.hasOne(SpecalitiesHealthConcerns, { foreignKey: "health_concerns_id" });

        SpecalitiesHealthConcerns.belongsTo(Speciality, { foreignKey: "speciality_id" });
        SpecalitiesHealthConcerns.belongsTo(HealthConcerns, { foreignKey: "health_concerns_id" })

        // let statusClaus = !is_admin ? { where: { status: true } } : {}

        let data = await SpecalitiesHealthConcerns.findAll({
            include: [{
                model: Speciality,
                required: true,
                attributes: []
            },
            {
                model: HealthConcerns,
                attributes: [],
                required: true,
                where: { ...where },
            }],
            attributes: [
                "id",
                [fn("", col("health_concern.id")), "health_concern_id"],
                [fn("", col("health_concern.name")), "health_concern_name"],
                [fn("", col("health_concern.status")), "health_concern_status"],
                [fn("GROUP_CONCAT", col("specialities_speciality.name")), "specialities_name"],
                [fn("GROUP_CONCAT", col("specialities_speciality.id")), "specialities_id"],
            ],

            // ...statusClas,
            group: ["health_concern.id"],
            order: sort ? [[sort, order]] : [["id", "DESC"]],
            raw: true
        }) as [];

        let result = data.map((current: any) => {
            current.specialities_name = [...new Set(current.specialities_name.split(","))];
            current.specialities_id = [...new Set(current.specialities_id.split(","))];
            return current;
        });

        if (searchText) {
            let pattern = new RegExp(searchText, "gi");

            let searchResult = result.filter((el: any) => {
                let isName = el.health_concern_name.match(pattern);
                let isSpecilityExists = el.specialities_name.join("").match(pattern);
                return !!isName || !!isSpecilityExists
            });
            if (limit != undefined && offset != undefined) {
                let data = searchResult.slice(offset, (limit + offset));
                let total_count = searchResult.length;
                return { data, limit, offset, total_count }
            }
            return searchResult;
            // if (limit != undefined && offset != undefined)
            //     return searchResult.slice(offset, limit)
            // return searchResult;
        }
        return limit != undefined && offset != undefined ?
            { data: result.slice(offset, (limit + offset)), limit, offset, total_count: result.length }
            : result;
        // if (limit && offset)
        //     return result.slice(offset, limit);
        // return data;
    }

    async saveUpdateHealthConcern(body: any) {

        for (let i = 0; i < body.length; i++) {
            let obj = body[i];
            if (obj.health_concern_id) {
                await SpecalitiesHealthConcerns.destroy({
                    where: {
                        health_concerns_id: obj.health_concern_id
                    }
                });

                await HealthConcerns.update({
                    name: obj.health_concern_name
                }, {
                    where: {
                        id: obj.health_concern_id
                    }
                })
            } else {
                // let { id } = await HealthConcerns.findOne({
                //     order: [["id", "DESC"]],
                //     limit: 1
                // }) as any;
                const max = await HealthConcerns.max("id");
                const id = isNaN(max) ? 1 : max + 1;
                obj.health_concern_id = id;
                let objToSave = {
                    id: obj.health_concern_id,
                    name: obj.health_concern_name
                } as any;
                await HealthConcerns.create(objToSave)
            }

            let objestToSave = obj.specialities_id.map((el: any) => {
                return {
                    speciality_id: el,
                    health_concerns_id: obj.health_concern_id
                }
            });

            await SpecalitiesHealthConcerns.bulkCreate(objestToSave, { returning: true });
        }
        return "Updated Successfully";
    };

    async saveUpdateSymptoms(body: any) {
        for (let i = 0; i < body.length; i++) {
            let obj = body[i];
            if (obj.symptoms_id) {
                await SpecialitiesSymptoms.destroy({
                    where: {
                        symptoms_id: obj.symptoms_id
                    }
                });

                await Symptoms.update({
                    name: obj.symptoms_name
                }, {
                    where: {
                        id: obj.symptoms_id
                    }
                })
            } else {
                // let { id } = await Symptoms.findOne({
                //     order: [["id", "DESC"]],
                //     limit: 1
                // }) as any;
                const max = await Symptoms.max("id");
                const id = isNaN(max) ? 1 : max + 1;

                obj.symptoms_id = id;

                let objToSave = {
                    id: obj.symptoms_id,
                    name: obj.symptoms_name
                } as any;
                await Symptoms.create(objToSave)
            }

            let objestToSave = obj.health_concern_id.map((el: any) => {
                return {
                    health_concerns_id: el,
                    symptoms_id: obj.symptoms_id
                }
            });
            await SpecialitiesSymptoms.bulkCreate(objestToSave, { returning: true });
        }
        return "Updated Successfully";

    }

    async getSymptomsById(id: number) {

        HealthConcerns.hasOne(SpecialitiesSymptoms, { foreignKey: "health_concerns_id" });
        SpecialitiesSymptoms.belongsTo(HealthConcerns, { foreignKey: "health_concerns_id" });
        Speciality.hasOne(SpecalitiesHealthConcerns, { foreignKey: "speciality_id" });
        SpecalitiesHealthConcerns.belongsTo(Speciality, { foreignKey: "speciality_id" });
        let data: any = await Symptoms.findOne({
            where: {
                id: id,
            },
            raw: true,
        });
        let healthConcernData: any = await SpecialitiesSymptoms.findAll({
            attributes: [
                "health_concerns_id",
                [fn("", col("name")), "name"],
            ],

            where: {
                symptoms_id: id,
            },
            include: [
                {
                    model: HealthConcerns,
                    attributes: [],
                },
            ],
            raw: true,
        });

        let finalData: any = []
        let dataPromise: any = await healthConcernData.map(async (singleData: any, idx: number) => {
            let specialityData = await SpecalitiesHealthConcerns.findAll({
                attributes: [
                    [fn("", col("speciality_id")), "id"],
                    [fn("", col("name")), "name"],
                ],
                where: {
                    health_concerns_id: singleData.health_concerns_id,
                },
                include: [
                    {
                        model: Speciality,
                        attributes: [],
                    },
                ],
                raw: true,
            });
            finalData.push({
                id: singleData.health_concerns_id,
                name: singleData.name,
                specility: specialityData
            })
        });
        await Promise.all(dataPromise);

        return { id: data.id, name: data.name, healthConcerns: finalData }
    }
    async getSymptoms(searchText?: string, limit?: number, offset?: number, id?: number, is_admin?: boolean, sort: string = 'symptoms_id', order = "DESC") {

        let whereCondition = !is_admin ? (`where symptoms_status = 1 ${id != undefined ? `AND symptoms_id = :id` : ''}`) : (id != undefined ? `where symptoms_id = :id` : '')

        let sortCondition = `order by ${sort === 'id' ? "symptoms_id" : sort} ${order}`;

        let data = await sequelize.query(`
        select * from (
            select a.name as symptoms_name , a.id as symptoms_id ,a.status as symptoms_status, c.name as health_concern_name , c.id as health_concern_id , e.id as speciality_id ,e.name as speciaility_name 
        from symptoms a join specialities_symptoms b on a.id = b.symptoms_id
        join health_concerns c on c.id = b.health_concerns_id
        join specialities_health_concerns d on d.health_concerns_id = c.id
        join specialities_speciality e on d.speciality_id = e.id
        ) as temp ${whereCondition} ${sortCondition}`, {
            type: QueryTypes.SELECT,
            replacements: { id: id }
        });

        let result = data.reduce((acc: any[], current: any) => {

            let isSymptomExists = acc.find(el => el.symptoms_id == current.symptoms_id);

            if (!!isSymptomExists) {
                let isHealthConcenrExist = isSymptomExists.health_concern_id.find((el: any) => el == current.health_concern_id);
                let isSpecilityExists = isSymptomExists.speciality_id.find((el: any) => el == current.speciality_id);
                if (!isSpecilityExists) {
                    isSymptomExists.speciality_id.push(current.speciality_id);
                    isSymptomExists.speciality_name.push(current.speciaility_name);
                }
                if (!isHealthConcenrExist) {
                    isSymptomExists.health_concern_id.push(current.health_concern_id);
                    isSymptomExists.health_concern_name.push(current.health_concern_name);
                }
                return acc;
            }

            let obj = {
                symptoms_id: current.symptoms_id,
                symptoms_name: current.symptoms_name,
                symptoms_status: current.symptoms_status,
                health_concern_id: [current.health_concern_id],
                health_concern_name: [current.health_concern_name],
                speciality_id: [current.speciality_id],
                speciality_name: [current.speciaility_name]
            }
            acc.push(obj);

            return acc;
        }, []);

        if (searchText) {
            let regEx = new RegExp(searchText, "gi");

            let searchResult = result.filter((el: any) => {
                let isSpecity = el.speciality_name.join("").match(regEx);
                let isSymptom = el.symptoms_name.match(regEx);
                let isHealthConcern = el.health_concern_name.join("").match(regEx);

                return !!isSpecity || !!isSymptom || isHealthConcern;
            });

            if (limit != undefined && offset != undefined) {
                let data = searchResult.slice(offset, (limit + offset));
                let total_count = searchResult.length;
                return { data, limit, offset, total_count }
            }
            return searchResult;
        }
        return limit != undefined && offset != undefined ?
            { data: result.slice(offset, (limit + offset)), limit, offset, total_count: result.length }
            : result;
    }
    private getLibraryModel(library_name: string) {
        const mapping: { [name: string]: { model: Mainsequelize.Model<any, any>, searchCols?: Array<string>, orderByCols?: Array<any> } } = {
            qualification: { model: Qualifications },
            speciality: {
                model: Speciality,
                searchCols: ["name"]
            },
            universities: { model: Universitys },
            medical_convention: {
                model: MedicalConventions,
                searchCols: ["name"]
            },
            roles: {
                model: Roles,
                searchCols: ["role"]
            },
            symptoms: {
                model: Symptoms,
                searchCols: ["symptoms_name", "health_concern_name", "speciaility_name"]
            },
            allergies: {
                model: Allergies,
                searchCols: ["name"]
            },
            registration_council: { model: RegistrationCouncil },
            tests: {
                model: tests,
                searchCols: ["name"],
                orderByCols: ["name", "home_collection"]
            },
            drugs: {
                model: Drug,
                searchCols: ["drug_name"],
                orderByCols: ["drug_name"]
            },
            merged_drugs: {
                model: Drug,
                searchCols: ["drug_name"],
                orderByCols: ["drug_name"]
            },
            merged_allergies: {
                model: Allergies,
                searchCols: ["name"]
            },
            drugs_history: {
                model: DrugHistory,
                searchCols: ["createdAt"],
                orderByCols: ["createdAt"]
            },
            health_concerns: {
                model: HealthConcerns,
                searchCols: ["name"]
            },
            specialities_symptoms: { model: SpecialitiesSymptoms },
            specialities_health_concerns: { model: SpecalitiesHealthConcerns },
            user_status_code: { model: user_status_code },
            order_status_code: { model: OrderStatusCode }
        };

        return mapping[library_name.toLowerCase()];
    }

    async createOrUpdate(testArray: any[]) {
        // testArray = testArray.map(el => {
        //     let isExists = el.also_known_as.split(",").some((e: any) => e.toLowerCase() == el.name.toLowerCase());
        //     if (!isExists) {
        //         let names = el.also_known_as.split(",");
        //         names.push(el.name);
        //         el.also_known_as = names.join(",")
        //     }
        //     return el;
        // })
        let result = await Tests.bulkCreate(testArray, { updateOnDuplicate: ["name", "also_known_as", "date", "home_collection"] });

        return "successfull"

    }

    async isTestNameExist(testData: any) {
        let hasError: boolean = false;
        let errorName: string = '';
        let testErrorPromise = await testData.map(async (el: any) => {
            let testName = el.name.toLowerCase();
            let testIdcondition = {};
            if (el.id) {
                testIdcondition = { id: { [Op.ne]: el.id } }
            }
            let test: any = await Tests.findOne({
                where: {
                    ...testIdcondition,
                    "name": sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', testName.trim())
                }
            });
            if (test != null) {
                if (!hasError) {
                    errorName = testName;
                }
                hasError = true;
            }

        })
        await Promise.all(testErrorPromise);
        return { hasError, msg: `${errorName} name already exist` };
    }

    async isNameExist(body: any) {
        const { model } = this.getLibraryModel(body.library_name);

        let hasError: boolean = false;
        let errorName: string = '';
        if (body.library_name.toLowerCase() == "health_concerns" || body.library_name.toLowerCase() == "symptoms" || ((body.library_name.toLowerCase() === "speciality" || body.library_name.toLowerCase() === "medical_convention" || body.library_name.toLowerCase() === "allergies") && !body.id)) {
            let data: any = [];
            data = body.library_name.toLowerCase() == "health_concerns" ? body.health_concerns : (body.library_name.toLowerCase() == "symptoms" ? body.symptoms : body.data)
            let errorPromise = await data.map(async (el: any) => {
                let name = body.library_name.toLowerCase() == "health_concerns" ? el.health_concern_name.toLowerCase() : (body.library_name.toLowerCase() == "symptoms" ? el.symptoms_name.toLowerCase() : el.name.toLowerCase());
                let id = body.library_name.toLowerCase() == "health_concerns" ? el.health_concern_id : (body.library_name.toLowerCase() == "symptoms" ? el.symptoms_id : el.id ? el.id : false);
                let idcondition = {};
                if (id) {
                    idcondition = { id: { [Op.ne]: id } }
                }
                let modalData: any = await model.findOne({
                    where: {
                        ...idcondition,
                        "name": sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', name.trim())
                    }
                });
                if (modalData != null) {
                    if (!hasError) {
                        errorName = name;
                    }
                    hasError = true;
                }

            })
            await Promise.all(errorPromise);

        }
        else {
            let idcondition = {};
            if (body.id) {
                idcondition = { id: { [Op.ne]: body.id } }
            }
            let modalData: any = await model.findOne({
                where: {
                    ...idcondition,
                    "name": sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', body.name.trim())
                }
            });
            if (modalData != null) {
                errorName = modalData.name;
                hasError = true;
            }

        }
        return { hasError, msg: `${errorName} name already exist` };
    }

    async deleteLibraryDetails(body: any) {
        if (body.library_name.toLowerCase() == "medical_convention") {
            let specilities_count: any = await Speciality.count({
                where: {
                    medical_conventions_id: body.id
                }
            });
            if (specilities_count > 0) {
                throw new BadRequestError("Can't be inactivated, as it is in use");
            }
        }
        else if (body.library_name.toLowerCase() == "speciality") {
            let health_concerns_count: any = await SpecalitiesHealthConcerns.count({
                where: {
                    speciality_id: body.id
                }
            });
            if (health_concerns_count > 0) {
                throw new BadRequestError("Can't be inactivated, as it is in use");
            }
        }
        else if (body.library_name.toLowerCase() == "health_concerns") {
            let symptoms_count: any = await SpecialitiesSymptoms.count({
                where: {
                    health_concerns_id: body.id
                }
            });
            if (symptoms_count > 0) {
                throw new BadRequestError("Can't be inactivated, as it is in use");
            }
        }
        const { model } = this.getLibraryModel(body.library_name);


        if (model) {
            const result = await model.update({ status: body.status }, {
                where: {
                    id: body.id
                }
            });
            return { "msg": "Data deleted" }

        }

        throw new NotFoundError("No libray found");
    }


    async getManufacturer() {
        const manufacturerList = await sequelize.query(
            `SELECT DISTINCT drug_manufacturer FROM drug;`,
            {
                type: QueryTypes.SELECT
            }
        );

        return manufacturerList;
    }

}
