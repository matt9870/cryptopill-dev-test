import { BadRequestError } from "routing-controllers";
import Drug from "../../../models/drug.model";
import { Op } from "sequelize";
import sequelize from "../../../db/sequalise";

export class DrugService {
	getAllDrugs() {
		let drugs = Drug.findAll();
		return drugs;
	}

	async getDrugByID(drugId: number) {
		let drug = Drug.findAll({
			where: {
				id: drugId,
			},
		});

		return drug;
	}

	async isDrugNameExist(durgData: any) {
		let drugName = durgData.drug_name.toLowerCase();
		let drugIdcondition = {};
		if (durgData.id) {
			drugIdcondition = { id: { [Op.ne]: durgData.id } }
		}
		let drug: any = await Drug.findOne({
			where: {
				...drugIdcondition,
				"drug_name": sequelize.where(sequelize.fn('LOWER', sequelize.col('drug_name')), 'LIKE', drugName.trim())
			}
		});
		if (drug != null) {
			return true;
		}
		else
			return false;
	}

	async addNewDrugs(durgData: any, user_id: number) {
		if (!Array.isArray(durgData)) {
			durgData.user_id = user_id;
			durgData.drug_name = durgData.drug_name.trim()
			if (durgData.id) {
				let drug: any = await Drug.findOne({
					where: {
						id: durgData.id
					}
				});
				await Drug.upsert({ ...drug, ...durgData });
				return { msg: "Drug updated" };
			}
			else {

				let drug = await Drug.upsert(durgData);
				return { msg: "Drug added sucessfully" };
			}
		}
		else {
			let drugDataPromise = await durgData.map(async (singleDrug: any) => {
				singleDrug.user_id = user_id;
				let drug: any = await Drug.findOne({
					where: {
						id: singleDrug.id
					}
				});
				await Drug.upsert({ ...drug, ...singleDrug });
			});
			await Promise.all(drugDataPromise)
			return { msg: "Drugs updated" };
		}
	}

	async addAllDrugs(drugs: any[]) {
		let response = await Drug.bulkCreate(drugs, { returning: true });
		if (!response) throw new BadRequestError("Issue while adding all medicines");

		return { msg: "Added all Medicines Succesfully" }
	}
}
