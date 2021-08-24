import { BadRequestError } from "routing-controllers";
import { AnalyticsEvents } from "../../constants/analyticsEvents.enum";
import { Utils } from "../../helpers";

export class LaboratoryAnalyticsService {
    mapAndCallEventFunction(key: string) {
        let mappedEvents: any = {
            LABORATORY_ON_BOARD: this.laboratoryOnBoard, 
            LAB_ORDER_COUNT: this.countOfLaboratoryOrders,
            LAB_CANCELLED_ORDERS: this.cancelledLaboratoryOrders,
            SCANNED_VS_EPRESCRIPTION: this.scannedVsEprescriptionLab,
            REGISTERED_STAFF_USERS: this.registeredLabStaff,
            ACCEPTED_ORDER: this.AcceptedOrder,
            LAB_DELIVERY_COST_STATS: this.deliveryCostLaboratory,
            LABTEST_HOME_COLLECTION: this. homeCollectionProvided,
           // LABTEST_PRESCRIPTION_COST_STATS: 
        };

        if(key in mappedEvents) {
            console.log("Key Found ==>", key);
            return mappedEvents[key];
        }

        throw new BadRequestError("No Such Lab Analytics Key Event found"); 
    }

    async addLabAnalitycsEvent(key: string, data?: any) {
        let callbackEvent = await this.mapAndCallEventFunction(key)(data);
        return { message: 'Event Tracked successfully' };
    }

    /****
    * Track On Board
    * ***/
    async laboratoryOnBoard(data: any) {
        await Utils.trackEvent(AnalyticsEvents.LABORATORY_ONBOARDING, data)
    }

    /***
   * is chain pharmacy
   * ***/
    async isChainLaboratory(chained: any) {
        await Utils.trackEvent(AnalyticsEvents.LABORATORY_ONBOARDING, chained)
    }


    /***
    *  Registered staff users
    * ***/
    async registeredLabStaff(data: any) {
        await Utils.trackEvent(AnalyticsEvents.LABORATORY_ONBOARDING, data)
    }




    /***
   * count of pharmacy orders
   * ***/
    async countOfLaboratoryOrders(data: any) {
        await Utils.trackEvent(AnalyticsEvents.LABORATORY_EPRESCRIPTION, data)
    }

    /***
     * Count of scanned vs e-prescriptions
     * ****/
    async scannedVsEprescriptionLab(data: any) {
        await Utils.trackEvent(AnalyticsEvents.LABORATORY_EPRESCRIPTION, data)

    }


    async deliveryCostLaboratory(data: any) {
        await Utils.trackEvent(AnalyticsEvents.LABORATORY_ONBOARDING, data)

    }


    async homeCollectionProvided(data: any) {
        await Utils.trackEvent(AnalyticsEvents.LABORATORY_EPRESCRIPTION, data)

    }


    /***
   * cancelled pharmacy orders
   * ***/
    async cancelledLaboratoryOrders(data: any) {
        await Utils.trackEvent(AnalyticsEvents.LABORATORY_EPRESCRIPTION, { is_cancelled: data.is_cancelled })
    }

    async AcceptedOrder(data: any) {
        await Utils.trackEvent(AnalyticsEvents.LABORATORY_EPRESCRIPTION, {
            scanned_prescription: data.prescriptionData.scanned_prescription, 
            e_prescription: data.prescriptionData.e_prescription, 
            full_order: data.prescriptionData.full_order, 
            partial_order: data.prescriptionData.partial_order, 
            substituted: data.prescriptionData.substituted
        })
    }
}