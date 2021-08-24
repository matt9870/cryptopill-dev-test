import { BadRequestError } from "routing-controllers";
import { AnalyticsEvents } from "../../constants/analyticsEvents.enum";
import { Utils } from "../../helpers";

export class DoctorAnalyticsService {
    mapAndCallEventFunction(key: string) {
        let mappedEvents: any = {
            DOCTOR_ON_BOARD: this.onBoardDoctor, 
            NOT_PUBLISH_PRESCRIPTION_COUNT: this.notPublishPrescriptionCount,
            "E-PRESCRIPTION_DETAILS": this.ePrescriptionDetails, 
            PATIENT_FOLLOW_UP: this.patientFollowUP,
            PATIENT_REFERRED_LAB_TESTS: this.patientsReferredLabTest,
            "E-PRESCRIPTION_STATISTICS": this.ePrescriptionStatestics,
            APPOINTMENT_STATISTICS: this.appintmentStatestics,
            PATIENT_STATISTICS: this.patientStatestics,
            CANCEL_APPOINMENT: this.trackCancelAppointment, 
            NLP_DIAGNOSIS: this.nplDiagnosis, 
            PRESCRIPTION_DRUG_DETAILS: this.prescriptionDrugDetail,
            DIAGNOSIS_VS_DRUG: this.diagnosisVsDrug,
            DIAGNOSIS_VS_APPOINTMENT_DURATION: this.diagnosisVsAppointmentDuration,
            DIAGNOSIS_VS_REFERRED: this.diagnosisVsReferred,
            DIAGNOSIS_VS_LAB_TESTS: this.diagnosisVsLabTest
        };

        if(key in mappedEvents) {
            console.log("Key Found ==>", key);
            return mappedEvents[key];
        }

        throw new BadRequestError("No Such Doctor Analytics Key Event found"); 
    }

    async addDoctorAnalitycsEvent(key: string, data?: any) {
        let callbackEvent = await this.mapAndCallEventFunction(key)(data);
        return { message: 'Event Tracked successfully' };
    }

    /****
     * Track On Board
     * ***/
    async onBoardDoctor(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_ON_BOARD, data);
    }

    /***
     * Doctor E-Prescription Details
     * ****/
    async ePrescriptionDetails(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_EPRESCRIPTION, data);
    }

    /***
     * Not Publish Prescription count
     * ****/
    async notPublishPrescriptionCount(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_EPRESCRIPTION, data);
    }

    /***
     *patient FolllowUP
     * ****/
    async patientFollowUP(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_EPRESCRIPTION, data);
    }

    /***
     *Patients referred for lab tests
     * ****/
    async patientsReferredLabTest(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_EPRESCRIPTION, data);
    }

    /***
     *E-Prescription statistics
     * ****/
    async ePrescriptionStatestics(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_EPRESCRIPTION, data);
    }

    /***
     *Appointment Statastics
     * ****/
    async appintmentStatestics(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_APPOINTMENTS, data);
    }

    /***
     *Patient Statastics
     * ****/
    async patientStatestics(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_APPOINTMENTS, data);
    }

    /***
     * Doctor NPL of diagnosis
     * ****/
    async nplDiagnosis(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_ON_BOARD, data);
    }

    /***
     * count of Prescription Drug
     * ****/
    async prescriptionDrugDetail(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_EPRESCRIPTION, data);
    }

    /***
     * Doctor diagnosis v/s Appointment durayion
     * ****/
    async diagnosisVsAppointmentDuration(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_EPRESCRIPTION, data);
    }

    /***
     * Doctor diagnosis v/s Drugs
     * ****/
    async diagnosisVsDrug(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_EPRESCRIPTION, data);
    }

    /***
     *Diagnosis v/s Referrals
     * ****/
    async diagnosisVsReferred(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_EPRESCRIPTION, data);
    }

    /***
     *Diagnosis v/s Lab Test
     * ****/
    async diagnosisVsLabTest(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_EPRESCRIPTION, data);
    }

    /***
     * Doctor Cancel Appointment Tracking
     * ****/
    async trackCancelAppointment(data: any) {
        await Utils.trackEvent(AnalyticsEvents.DOCTOR_APPOINTMENTS, data);
    }
}