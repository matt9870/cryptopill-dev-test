import { BadRequestError } from "routing-controllers";
import { AnalyticsEvents } from "../../constants/analyticsEvents.enum";
import { Utils } from "../../helpers";

export class PharmacyAnalyticsService {
    mapAndCallEventFunction(key: string) {
        let mappedEvents: any = {
            PHARMACY_ON_BOARD: this.pharmacyOnBoard,
            ORDER_COUNT: this.countOfPharmacyOrders,
            CANCELLED_ORDERS: this.cancelledPharmacyOrders,
            SCANNED_VS_EPRESCRIPTION: this.scannedVsEprescription,
            SUBSTITUTED_DRUG_DETAILS: this.substitutedDrugDetails,
            DELIVERY_COST_STATS: this.deliveryCostPharmacy,
            FULLORDER_VS_PARTIALORDER: this.fullOrderVsPartial,
            REGISTERED_STAFF_USERS: this.registeredStaffUsers,
            UNFULFILLED_ORDER_COUNT: this.unfullfilledOrdersByPharmacy,
            ACCEPTED_ORDER: this.AcceptedOrder
        };

        if (key in mappedEvents) {
            console.log("Key Found ==>", key);
            return mappedEvents[key];
        }

        throw new BadRequestError("No Such Pharmacy Analytics Key Event found");
    }
    async addPharmAnalitycsEvent(key: string, data?: any) {
        let callbackEvent = await this.mapAndCallEventFunction(key)(data);
        return { message: 'Event Tracked successfully' };
    }

    /****
    * Track On Board
    * ***/
    async pharmacyOnBoard(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_ONBOARDING, data)
    }

    /***
    *  Registered staff users
    * ***/
    async registeredStaffUsers(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_ONBOARDING, data)
    }

    /***
    * count of pharmacy orders
    * ***/
    async countOfPharmacyOrders(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_EPRESCRIPTION, data)
    }

    /***
    * cancelled pharmacy orders
    * ***/
    async cancelledPharmacyOrders(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_EPRESCRIPTION, { is_cancelled: data.is_cancelled })
    }

    /***
    * unfullfilled orders by pharmacy
    * ***/
    async unfullfilledOrdersByPharmacy(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_EPRESCRIPTION, { 'unfullfilledCount': data })
    }

    /***
    * is chain pharmacy
    * ***/
    async isChainPharmacy(chained: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_ONBOARDING, { 'ischained': chained })
    }

    /***
     * Count of scanned vs e-prescriptions
     * ****/
    async scannedVsEprescription(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_EPRESCRIPTION, data)

    }

    /***
     * prescription drug cost 
     * ****/
    async prescriptionDrugCostAnalytics(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_EPRESCRIPTION, { 'drugCost': data.drugCost })

    }

    /***
     * Substituted dugs
     * ****/
    async substitutedDrugDetails(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_EPRESCRIPTION, data)
    }

    /***
     * Substituted dugs
     * ****/
    async isdrugSubstituted(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_EPRESCRIPTION, { 'isSubstituted': data })
    }

    /***
     * delivery Cost
     * ****/
    async deliveryCostPharmacy(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_ONBOARDING, { 'deliveryCost': data.deliveryCost, })

    }

    /***
    * Count of fullOrder vs partialOrder
    * ****/
    async fullOrderVsPartial(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_EPRESCRIPTION, data)
    }

    /***
     * Count of fullOrder vs partialOrder
     * ****/
    async AcceptedOrder(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PHARMACY_EPRESCRIPTION, {
                scanned_prescription: data.prescriptionData.scanned_prescription, 
                e_prescription: data.prescriptionData.e_prescription, 
                full_order: data.prescriptionData.full_order, 
                partial_order: data.prescriptionData.partial_order, 
                substituted: data.prescriptionData.substituted
        })
    }
}