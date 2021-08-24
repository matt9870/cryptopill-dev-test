import { Utils } from "../helpers";
import TemporaryRequestPharmacy from "../models/temporary_request_pharmacy.model";
import { PharmacyService } from "../services/mobile/pharmacy/pharmacy.service";
import sequelize from "../db/sequalise";
import { OrderStatusEnum } from "../constants/order_status.enum";
import PharmacyCancelOrder from "../models/pharmacy_cancel_order.model";
import TemporaryRequestLab from "../models/temporary_request_lab.model";
import { LaboratoryService } from "../services/mobile/laboratory/laboratory.service";
import LabCancelOrder from "../models/lab_cancel_order.model";
import { PatientService } from "../services/mobile/patient/patient.service";
const { QueryTypes } = require("sequelize");

export class TimedOut {
    constructor(
    ) { }
    public async orderTimedOut() {
        const query = `select order_id from  temporaryrequest_pharmacy group by order_id`
        let allOrders = await sequelize.query(`${query}`, {
            type: QueryTypes.SELECT,
        });

        allOrders.map(async (singleOrder: any) => {
            let currentOrders: any = await TemporaryRequestPharmacy.findAll(
                {
                    where: { order_id: singleOrder.order_id }
                }
            );
            let timed_out_count = 0;
            let is_accepted_or_completed = false;
            let currentOrderPromise = await currentOrders.map(async (currentSingleOrder: any) => {
                if (currentSingleOrder.order_status_code == OrderStatusEnum['Accepted'] || currentSingleOrder.order_status_code == OrderStatusEnum['Completed']) {
                    is_accepted_or_completed = true;
                }
                else if (currentSingleOrder.order_status_code == OrderStatusEnum['Sent to Patient for Confirmation'] || currentSingleOrder.order_status_code == OrderStatusEnum['No Response from Pharmacy yet']) {
                    let isActive: boolean = await Utils.compareTime(currentSingleOrder.updatedAt, currentSingleOrder.accept_order_pharmacy == 1 ? true : false);
                    console.log(currentSingleOrder.accept_order_pharmacy == 1);
                    console.log(currentSingleOrder.updatedAt);
                    if (!isActive) {
                        timed_out_count += 1;
                        let result: any = await TemporaryRequestPharmacy.update(
                            { order_status_code: currentSingleOrder.accept_order_pharmacy == 1 ? 7 : 6 },
                            { where: { id: currentSingleOrder.id } },
                        );

                    }
                } else {
                    timed_out_count += 1;

                }
            })

            await Promise.all(currentOrderPromise);

            if (!is_accepted_or_completed && timed_out_count === currentOrders.length) {
                await new PatientService().cancelPharmacyOrder(currentOrders[0].id, currentOrders[0].order_id)
                // await Utils.setTransaction(async () => {
                //     let requestedOrder = await new PharmacyService().generateOriginalPharmacyOrder(
                //         currentOrders[0].id,
                //         true,
                //         true
                //     );
                //     let createCancleOrder: any = { order_id: currentOrders[0].order_id, order_request_pharmacy_id: requestedOrder.id, pharmacy_id: null, cancel_reason: "Request timed out." }
                //     await PharmacyCancelOrder.create(
                //         { ...createCancleOrder },
                //         { raw: true }
                //     );
                // });

                // await Promise.all(transactionPromise);
            }
        })


    }


    public async labOrderTimedOut() {
        const query = `select order_id from  temporaryrequest_lab group by order_id`
        let allOrders = await sequelize.query(`${query}`, {
            type: QueryTypes.SELECT,
        });

        allOrders.map(async (singleOrder: any) => {
            let currentOrders: any = await TemporaryRequestLab.findAll(
                {
                    where: { order_id: singleOrder.order_id }
                }
            );
            let timed_out_count = 0;
            let is_accepted_or_completed = false;
            let currentOrderPromise = await currentOrders.map(async (currentSingleOrder: any) => {
                if (currentSingleOrder.order_status_code == OrderStatusEnum['Accepted'] || currentSingleOrder.order_status_code == OrderStatusEnum['Completed']) {
                    is_accepted_or_completed = true;
                }
                else if (currentSingleOrder.order_status_code == OrderStatusEnum['Sent to Patient for Confirmation'] || currentSingleOrder.order_status_code == OrderStatusEnum['No Response from Laboratory yet']) {
                    let isActive: boolean = await Utils.compareTime(currentSingleOrder.updatedAt, currentSingleOrder.accept_order_lab == 1 ? true : false);
                    if (!isActive) {
                        timed_out_count += 1;
                        let result: any = await TemporaryRequestLab.update(
                            { order_status_code: currentSingleOrder.accept_order_lab == 1 ? 7 : 6 },
                            { where: { id: currentSingleOrder.id } },
                        );

                    }
                } else {
                    timed_out_count += 1;

                }
            })

            await Promise.all(currentOrderPromise);

            if (!is_accepted_or_completed && timed_out_count === currentOrders.length) {
                await new PatientService().cancelLabOrder(currentOrders[0].id, currentOrders[0].order_id)

                // await Utils.setTransaction(async () => {
                //     let requestedOrder = await new LaboratoryService().generateOriginalLabOrder(
                //         currentOrders[0].id,
                //         true,
                //         true
                //     );
                //     let createCancleOrder: any = { order_id: currentOrders[0].order_id, order_request_lab_id: requestedOrder.id, lab_id: null, cancel_reason: "Request timed out." }
                //     await LabCancelOrder.create(
                //         { ...createCancleOrder },
                //         { raw: true }
                //     );
                // });

                // await Promise.all(transactionPromise);
            }
        })


    }
}