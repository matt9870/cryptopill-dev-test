import { BadRequestError } from "routing-controllers";
import { AnalyticsEvents } from "../../constants/analyticsEvents.enum";
import { Utils } from "../../helpers";

export class PatientAnalyticsService {
     mapAndCallEventFunction(key: string) {
        let mappedEvents: any = {
            ON_BOARD: this.onBoard,
            SEARCH_SPECIALITY_AND_SYMPTOMS: this.searchAsPerSpecialityOrSymptom,
            GUEST_VS_REGIESTERED: this.guestVsRegisterd,
            LINKED_ACCOUNTSS: this.linkOrNot,
            SHARE_MEDICAL_HISTORY: this.shareMedicalHistory,
            DATE_AND_TIME_PREFRENCE: this.dateAndTimePreference,
            CONSULTATION_FEES_ANG_GENDER: this.consultationFeesAndGenderPreference,
            ON_BOARD_DURATION: this.onBoardingDuration,
            CANCEL_APPOINTMENT: this.trackCancelAppointment
        };

        if(key in mappedEvents) {
            console.log("Key Found ==>", key);
            return mappedEvents[key];
        }

        throw new BadRequestError("No Such Patient Analytics Key Event found"); 
    }
    
    async addPatientAnalitycsEvent(key: string, data?: any) {
        let callbackEvent = await this.mapAndCallEventFunction(key)(data);
        return { message: 'Event Tracked successfully'};
    }

     /****
     * Track On Board
     * ***/
    async onBoard(data: any) {
        const { age, gender, city, state } = data
        await Utils.trackEvent(AnalyticsEvents.PATIENT_ON_BOARD, data);
    }

    /***
     * Track Searching Doctor
     * ***/
    async searchAsPerSpecialityOrSymptom(data: any) {
        const { speciality, symptoms } = data
        await Utils.trackEvent(AnalyticsEvents.PATIENT_DOCTOR_SEARCH, data);
    }

    /***
    * Track Guest Vs Registered Patient
    * ***/
    async guestVsRegisterd(data: any) {
        await Utils.trackEvent(AnalyticsEvents.PATIENT_ON_BOARD, data);
    }

    /***
    * Link Account or Not
    * ***/
    async linkOrNot() {
        await Utils.trackEvent(AnalyticsEvents.PATIENT_ACITIVITY, { 'linked': true });
    }

    /***
    * Share Medical History Or Not
    * ***/
    async shareMedicalHistory() {
        await Utils.trackEvent(AnalyticsEvents.PATIENT_ACITIVITY, { 'medicalHistory': true });
    }

    /***
    * Date and Time Prefrence
    * ***/
    async dateAndTimePreference(dateAndTime: any) {
        await Utils.trackEvent(AnalyticsEvents.PATIENT_DOCTOR_SEARCH, dateAndTime);
    }

    /***
    * Consultation Fees Prefrence
    * ***/
    async consultationFeesAndGenderPreference(fees: any) {
        console.log(fees);
        await Utils.trackEvent(AnalyticsEvents.PATIENT_DOCTOR_SEARCH, fees);
    }


    /***
     * Patient On Boarding Duration
     * ****/
     async onBoardingDuration(timeSpent: any) {
        await Utils.trackEvent(AnalyticsEvents.PATIENT_ON_BOARD, timeSpent);
    }

    /***
     * Patient Cancel Appointment Tracking
     * ****/
     async trackCancelAppointment() {
        await Utils.trackEvent(AnalyticsEvents.PATIENT_ACITIVITY, { 'cancelAppointment': true });
    }
}