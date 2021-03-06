import { IsIn, IsString } from "class-validator";

export class PatientAnalyticsActions {
    @IsIn(["ON_BOARD", "SEARCH_SPECIALITY_AND_SYMPTOMS", "GUEST_VS_REGIESTERED", "LINKED_ACCOUNTSS",
        "SHARE_MEDICAL_HISTORY", "DATE_AND_TIME_PREFRENCE", "CONSULTATION_FEES_ANG_GENDER", "ON_BOARD_DURATION",
        "CANCEL_APPOINTMENT"])
    @IsString()
    key: string;

    data: any;
}

export class PhamrmacyAnalyticsActions {
    @IsIn(["PHARMACY_ON_BOARD", "ORDER_COUNT", "CANCELLED_ORDERS", "SCANNED_VS_EPRESCRIPTION",
        "SUBSTITUTED_DRUG_DETAILS", "DELIVERY_COST_STATS", "FULLORDER_VS_PARTIALORDER", "REGISTERED_STAFF_USERS",
        "UNFULFILLED_ORDER_COUNT", "ACCEPTED_ORDER"])
    @IsString()
    key: string;

    data: any;
}

export class LabAnalyticsActions {
    @IsIn(["LABORATORY_ON_BOARD", "LAB_ORDER_COUNT", "LAB_CANCELLED_ORDERS", "SCANNED_VS_EPRESCRIPTION",
        "REGISTERED_STAFF_USERS", "ACCEPTED_ORDER", "LAB_DELIVERY_COST_STATS", "LABTEST_HOME_COLLECTION",
        "LABTEST_PRESCRIPTION_COST_STATS"])
    @IsString()
    key: string;

    data: any;
}

export class DoctorAnalyticsActions {
    @IsIn(["DOCTOR_ON_BOARD", "NOT_PUBLISH_PRESCRIPTION_COUNT", "E-PRESCRIPTION_DETAILS", "PATIENT_FOLLOW_UP",
        "PATIENT_REFERRED_LAB_TESTS", "E-PRESCRIPTION_STATISTICS", "APPOINTMENT_STATISTICS", "PATIENT_STATISTICS",
        "CANCEL_APPOINMENT", "NLP_DIAGNOSIS", "PRESCRIPTION_DRUG_DETAILS", "DIAGNOSIS_VS_DRUG", "DIAGNOSIS_VS_APPOINTMENT_DURATION",
        "DIAGNOSIS_VS_REFERRED", "DIAGNOSIS_VS_LAB_TESTS"])
    @IsString()
    key: string;

    data: any;
}