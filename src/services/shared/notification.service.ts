import NotificationTemplates from "../../models/notificationTemplate.model";
import { BadRequestError } from "routing-controllers";
import Users from "../../models/users.model";
import { Op, fn, col } from "sequelize";
import sequelize from "../../db/sequalise";
import NotificationSetting from "../../models/notification_setting.model";
import { RolesEnum } from "../../constants/roles.enum";
import { AdminPermission } from "../../constants/adminPermission.enum";
import NotificationsList from "../../models/notifications_list.model";
// const { QueryTypes } = require('sequelize');

export class NotificationService {

    async addData() {
        try {



            let patientNotificationData: any[] = [
                {
                    key: "PATIENT_MOBILE_OTP_VERIFICATION",
                    subject: "Mobile Verification OTP",
                    role_id: RolesEnum.Patient,
                    // role_type:"",
                    message: "Your OTP for Mobile Verification on Cryptopill is {{OTP}}.",
                    values: "OTP",
                    email_notification: 0,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "OTP Verification for Mobile Number"
                },
                {
                    key: "PATIENT_ADD_EDIT_EMAIL_VERIFICATION",
                    subject: "Email verification",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Please follow the <a href=”{{link}}” >link </a> for verifying your Email ID",
                    values: "link",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 0,
                    trigger_event_detail: "Email Verification for Email ID added/edited"
                },
                {
                    key: "PATIENT_IMAGE_ADMIN_VERIFIED",
                    subject: "Profile image verified",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your Profile Image has been verified by our Admins!",
                    values: "",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Profile Image verified by Admin"
                },
                {
                    key: "PATIENT_IMAGE_ADD_EDIT_ADMIN_DECLINED",
                    subject: "Profile image delcined",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your Profile Image Addition/Edit has been declined by our Admins.",
                    values: "",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Profile Image addition/edit declined by Admin"
                },
                {
                    key: "PATIENT_APPOINTMENT_CANCELLATION",
                    subject: "Booking cancelled",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your appointment with {{doctorName}} at {{workplace}} on {{date}} at {{time}} has been cancelled. Booking ID {{bookingId}}",
                    values: "doctorName,workplace,date,time,bookingId",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Cancellation of appointment by Patient"
                },
                {
                    key: "PATIENT_NEW_APPOINTMENT_REQUEST",
                    subject: "New appointment request sent",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "New appointment request for {{patientName}} has been sent to {{doctorName}}. ",
                    values: "patientName,doctorName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "New Appointment Request"
                },
                {
                    key: "PATIENT_APPOINTMENT_DOCTOR_ACCEPTED",
                    subject: "Appointment accepted",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your appointment with {{doctorName}} at {{workplace}} on {{date}} at {{time}} has been Accepted. Booking ID {{bookingId}}",
                    values: "doctorName,workplace,date,time,bookingId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Acceptance of Appointment Request by Doctor"
                },
                {
                    key: "PATIENT_APPOINTMENT_DOCTOR_DECLINED",
                    subject: "Appointment declined",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your appointment with {{doctorName}} at {{workplace}} on {{date}} at {{time}} has been Declined. Booking ID {{bookingId}",
                    values: "doctorName,workplace,date,time,bookingId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Declining of Appointment Request"
                },
                {
                    key: "PATIENT_DOCTOR_APPOINTMENT_COMPLETED",
                    subject: "Appointment completed",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your appointment with {{doctorName}} has been marked completed. Booking ID {{bookingId}}",
                    values: "doctorName,bookingId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Appointment Completed"
                },
                {
                    key: "PATIENT_APPOINTMENT_DOCTOR_CANCELLATION",
                    subject: "Appointment cancelled by doctor",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your appointment with {{doctorName}} at {{workplace}} on {{date}} at {{time}} has been cancelled. Reason - {{reason}}. Booking ID {{bookingId}}",
                    values: "doctorName,workplace,date,time,reason,bookingId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Cancellation of appointment by Doctor"
                },
                {
                    key: "PATIENT_APPOINTMENT_RESCHEDULE_REQUEST",
                    subject: "Appointment reschedule request sent",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Appointment Reschedule request for {{date}} on {{time}} with {{doctorName}} at {{workplace}} has been sent. Booking ID {{bookingId}}",
                    values: "date,time,doctorName,workplace,bookingId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Appointment Reschedule request sent"
                },
                {
                    key: "PATIENT_APPOINTMENT_RESCHEDULE_REQUEST_ACCEPTED",
                    subject: "Appointment reschedule request accepted",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Appointment Reschedule request for {{date}} on {{time}} with {{doctorName}} at {{workplace}} has been Accepted. Booking ID {{bookingId}}",
                    values: "date,time,doctorName,workplace,bookingId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Appointment Reschedule request Accepted"
                },
                {
                    key: "PATIENT_APPOINTMENT_RESCHEDULE_REQUEST_DECLINED",
                    subject: "Appointment reschedule request declined",
                    role_id: RolesEnum.Patient,
                    // role_type:"",
                    message: "Appointment Reschedule request for {{date}} on {{time}} with {{doctorName}} at {{workplace}} has been Declined. Your current appointment with Booking ID {{bookingId}} does not exists.",
                    values: "date,time,doctorName,workplace,bookingId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Appointment Reschedule request Declined"
                },
                {
                    key: "PATIENT_REVIEW_DOCTOR",
                    subject: "Review a doctor",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Click here to share your experience with {{doctorName}} to help us improve our services",
                    values: "doctorName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Rate and Review Doctor"
                },
                {
                    key: "PATIENT_DOCTOR_SHARE_PRESCRIPTION",
                    subject: "Doctor shared prescription",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{doctorName}} has shared a prescription with you. </br>Please use YourDateOfBirth to download the prescription from {{link}}.",
                    values: "doctorName,link",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Sharing of Presciption by Doctor"
                },
                {
                    key: "PATIENT_PRESCRIPTION_EDIT_BY_DOCTOR",
                    subject: "Doctor edited prescription",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{doctorName}} has edited one of your prescriptions. Click here to view it",
                    values: "doctorName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Editing of Prescription by Doctor"
                },
                {
                    key: "PATIENT_PHARMACY_MEDICINE_ORDER_RESPONSE",
                    subject: "Pharmacy response on your order",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{pharmacy}} has sent a response to your order request. Click here  to view the response and confirm order",
                    values: "pharmacy",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Pharmacy Response to Medicine Order"
                },
                {
                    key: "PATIENT_PHARMACY_MEDICINE_ORDER_CANCELLED",
                    subject: "Pharmacy cancelled your order",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{pharmacy}} has cancelled your order {{orderId}}. Reason – {{reason}}. Please contact our support in case of any issues",
                    values: "pharmacy,orderId,reason",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Cancelled Order from Pharmacy"
                },
                {
                    key: "PATIENT_PHARMACY_DELIVERY_COMPLETED",
                    subject: "Order completed",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{pharmacy}} has marked your order {{orderId}} as completed. Please contact our support in case of any issues",
                    values: "pharmacy,orderId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Pharmacy Delivery Completed"
                },
                {
                    key: "PATIENT_ORDER_HOME_DELIVER_CONFIRMATION",
                    subject: "Order confirmed",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your order {{orderId}} has been confirmed. {{pharmacy}} will deliver the order to you soon",
                    values: "orderId,pharmacy",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Confirmation of Pharmacy Order by Patient. Shown in case of Home Delivery"
                },
                {
                    key: "PATIENT_ORDER_PICKUP_CONFIRMATION",
                    subject: "Order confirmed",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your order {{orderId}} has been confirmed. Please collect your order from {{pharmacy}}",
                    values: "orderId,pharmacy",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Confirmation of Pharmacy Order by Patient.Shown in case of Order Pickup from Pharmacy "
                },
                {
                    key: "PATIENT_LAB_ORDER_ACCEPTED",
                    subject: "Lab test request accepted",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{labName}} has accepted your Lab Test order request. Order ID {{orderId}}. They will contact you soon in case of Home Collection of Samples",
                    values: "labName,orderId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Response to Lab Test Order"
                },
                {
                    key: "PATIENT_LAB_ORDER_CANCELLED",
                    subject: "Lab test request cancelled",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{labName}} has cancelled your order {{orderId}}. Reason - {{reason}}. Please contact our support in case of any issues",
                    values: "labName,orderId,reason",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Cancelled Order from Lab"
                },
                {
                    key: "PATIENT_LAB_ORDER_COMPLETED",
                    subject: "Order completed",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{labName}} has marked your order {{orderId}} as completed. Please contact our support in case of any issues",
                    values: "labName,orderId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Lab Order Completed"
                },
                {
                    key: "PATIENT_ALLERGY_APPROVED_BY_ADMIN",
                    subject: "Allergy approved",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "An allergy manually entered by you has been approved by our Admins",
                    values: "",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Allergy added by Patient verified"
                },
                {
                    key: "PATIENT_ALLERGY_DECLINED_BY_ADMIN",
                    subject: "Allergy delined",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "An allergy manually entered by you has been declined by our Admins",
                    values: "",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Allergy added by Patient declined"
                },
                {
                    key: "PATIENT_ACCOUNT_LINK_REQUEST_RECEIVED",
                    subject: "Account link request",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{patientName}} has requested to link their account with yours. Click here to view the request",
                    values: "patientName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Account Link Request Received"
                },
                {
                    key: "PATIENT_ACCOUNT_LINK_REQUEST_ACCEPTED",
                    subject: "Account link request accepted",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{patientName}} has accepted your request for account linking",
                    values: "patientName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Account Link Request Accepted"
                },
                {
                    key: "PATIENT_ACCOUNT_LINK_REQUEST_DECLINED",
                    subject: "Account link request declined",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{patientName}} has declined your request for account linking",
                    values: "patientName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Account Link Request Declined"
                },
                {
                    key: "PATIENT_ACCOUNT_UNLINKED",
                    subject: "Account unlinked",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "{{patientName}} has unlinked their account with you",
                    values: "patientName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Account Unlinked"
                },
                {
                    key: "PATIENT_MINOR_IMAGE_ADMIN_VERIFIED",
                    subject: "Minor profile image verified",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your Minor Account {{minorName}}'s Profile Image has been verified by our Admins!",
                    values: "minorName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Minor Account Profile Image verified by Admin"
                },
                {
                    key: "PATIENT_MINOR_IMAGE_ADMIN_DECLINED",
                    subject: "Minor profile image declined",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Your Minor Account {{minorName}}'s Profile Image Addition/Edit has been declined by our Admins.",
                    values: "minorName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Minor Account Profile Image addition/edit declined by Admin"
                },
                {
                    key: "PATIENT_ACCOUNT_CREATED_BY_ADMIN",
                    subject: "Account created",
                    role_id: RolesEnum.Patient,
                    // role_type: "",
                    message: "Patient account has been created by our Admin for Mobile Number {{mobileNo}} and Password {{password}}. Please change the password once logged in to keep your account secure. {{appLink}}",
                    values: "mobileNo,password,appLink",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "Account Created by Admin"
                },
            ];
            let doctorNotificationData: any[] = [
                {
                    key: "DOCTOR_MOBILE_OTP_VERIFICATION",
                    subject: "Mobile Verification OTP",
                    role_id: RolesEnum.Doctor,
                    // role_type:"",
                    message: "Your OTP for Mobile Verification on Cryptopill is {{OTP}}.",
                    values: "OTP",
                    email_notification: 0,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "OTP Verification for Mobile Number"
                },
                {
                    key: "DOCTOR_ADD_EDIT_EMAIL_VERIFICATION",
                    subject: "Email verification",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "Please follow the <a href=”{{link}}” >link </a> for verifying your Email ID",
                    values: "link",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 0,
                    trigger_event_detail: "Email Verification for Email ID added/edited"
                },
                {
                    key: "DOCTOR_ACCOUNT_VERIFIED_BY_ADMIN",
                    subject: "Account verified",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "Your account has been verified by our Admins! You can now start using the App and consult Patients!",
                    values: "",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Account Verified by Admin"
                },
                {
                    key: "DOCTOR_IMAGE_ADMIN_VERIFIED",
                    subject: "Profile image verified",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "Your Profile Image has been verified by our Admins!",
                    values: "",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Profile Image verified by Admin"
                },
                {
                    key: "DOCTOR_IMAGE_ADD_EDIT_ADMIN_DECLINED",
                    subject: "Profile image delcined",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "Your Profile Image Addition/Edit has been declined by our Admins.",
                    values: "doctorName,workplace,date,time,bookingId",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Profile Image addition/edit declined by Admin"
                },
                {
                    key: "DOCTOR_APPOINTMENT_CANCELLED_BY_PATIENT",
                    subject: "Appointment cancelled by patient",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "Your appointment with {{patientName}} at {{workplace}} on {{date}} at {{time}} has been cancelled. Booking ID {{bookingId}}",
                    values: "patientName,workplace,date,time,bookingId",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Cancellation of appointment by Patient"
                },
                {
                    key: "DOCTOR_NEW_APPOINTMENT_REQUEST",
                    subject: "New appointment request",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "{{patientName}} has requested an appointment with you at {{workplace}} on {{date}}{{time}}. ",
                    values: "patientName,workplace,date,time",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "New Appointment Request"
                },
                {
                    key: "DOCTOR_APPOINTMENT_RESCHEDULE_REQUEST",
                    subject: "Reschedule request",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "{{patient}} has requested rescheduling appointment at {{workplace}} on {{date}}{{time}}. Booking ID {{bookingId}}",
                    values: "patientName,workplace,date,time,bookingId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Appointment Reschedule Request"
                },
                {
                    key: "DOCTOR_DELEGATE_ADDED",
                    subject: "Delegate added",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "{{staffName}} has been added as your Delegate",
                    values: "staffName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Delegate added for Doctor"
                },
                {
                    key: "DOCTOR_DELEGATE_REMOVED",
                    subject: "Delegate removed",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "{{staffName}} is no longer your Delegate",
                    values: "staffName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Delegate removed for Doctor"
                },
                {
                    key: "DOCTOR_DELEGATE_BOCKED_SCHEDULE",
                    subject: "Delegate blocked schedule",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "{{staffName}} has blocked part(s) of your schedule. Click here to view it",
                    values: "staffName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Schedule Blocked by Delegate"
                },
                {
                    key: "DOCTOR_DELEGATE_UNBLOCKED_SCHEDULE",
                    subject: "Delegate unblocked schedule",
                    role_id: RolesEnum.Doctor,
                    // role_type: "",
                    message: "{{staffName}} has unblocked part(s) of your schedule. Click here to view it",
                    values: "staffName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Schedule Unblocked by Delegate"
                },
                {
                    key: "DOCTOR_DELEGATE_SCHEDULE_CHANGED",
                    subject: "Workplace timing changed",
                    role_id: RolesEnum.Doctor,
                    // role_type:"",
                    message: "Your workplace timings have been changed by {{staffName}}. Click here to view it",
                    values: "staffName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Schedule changed by Delegate"
                },
                {
                    key: "DOCTOR_ACCOUNT_CREATED_BY_ADMIN",
                    subject: "Account created",
                    role_id: RolesEnum.Doctor,
                    // role_type:"",
                    message: "Doctor account has been created by our Admin for Mobile Number {{mobileNo}} and Password {{password}}. Please change the password once logged in to keep your account secure",
                    values: "mobileNo,password",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "Account Created by Admin"
                },

            ];
            let supportStaffNotificationData: any[] = [
                {
                    key: "DELEGATE_MOBILE_OTP_VERIFICATION",
                    subject: "Mobile Verification OTP",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "Your OTP for Mobile Verification on Cryptopill is {{OTP}}.",
                    values: "OTP",
                    email_notification: 0,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "OTP Verification for Mobile Number"
                },
                {
                    key: "DELEGATE_ADD_EDIT_EMAIL_VERIFICATION",
                    subject: "Email verification",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "Please follow the <a href=”{{link}}” >link </a> for verifying your Email ID",
                    values: "link",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 0,
                    trigger_event_detail: "Email Verification for Email ID added/edited"
                },
                {
                    key: "DELEGATE_IMAGE_ADMIN_VERIFIED",
                    subject: "Profile image verified",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "Your Profile Image has been verified by our Admins!",
                    values: "",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Profile Image verified by Admin"
                },
                {
                    key: "DELEGATE_IMAGE_ADD_EDIT_ADMIN_DECLINED",
                    subject: "Profile image delcined",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "Your Profile Image Addition/Edit has been declined by our Admins.",
                    values: "",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Profile Image addition/edit declined by Admin"
                },
                {
                    key: "DELEGATE_APPOINTMENT_CANCELLED_BY_PATIENT",
                    subject: "Appointment cancelled by patient",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "Appointment with {{patientName}} with {{doctorName}} at {{workplace}} on {{date}} at {{time}} has been cancelled. Booking ID {{bookingId}}",
                    values: "patientName,doctorName,workplace,date,time,bookingId",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Cancellation of appointment by Patient"
                },
                {
                    key: "DELEGATE_NEW_APPOINTMENT_REQUEST",
                    subject: "New appointment request",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "{{patientName}} has requested an appointment with {{doctorName}} at {{workplace}} on {{date}}{{time}}. Booking ID {{bookingId}}",
                    values: "patientName,doctorName,workplace,date,time,bookingId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "New Appointment Request"
                },
                {
                    key: "DELEGATE_APPOINTMENT_RESCHEDULE",
                    subject: "Reschedule request",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "{{patientName}} has requested rescheduling appointment with {{doctorName}} at {{workplace}} on {{date}}{{time}}. Booking ID {{bookingId}}",
                    values: "patientName,doctorName,workplace,date,time,bookingId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Appointment Reschedule Request"
                },
                {
                    key: "DELEGATE_DOCTOR_ADDED_DELEGATE",
                    subject: "Added as support staff",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "{{doctorName}} has added you as their Support Staff. Click here to view their schedule",
                    values: "doctorName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Delegate added by Doctorr"
                },
                {
                    key: "DELEGATE_DOCTOR_REMOVED",
                    subject: "Removed from support staff",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "{{doctorName}} has removed you from their Support Staff.",
                    values: "doctorName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Delegate removed by Doctor"
                },
                {
                    key: "DELEGATE_DOCTOR_SCHEDULE_BLOCKED",
                    subject: "Doctor blocked schedule",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "{{doctorName}} has blocked part(s) of their schedule. Click here to view it",
                    values: "doctorName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Schedule Blocked by Doctor"
                },
                {
                    key: "DELEGATE_DOCTOR_SCHEDULE_UNBLOCKED",
                    subject: "Doctor unblocked schedule",
                    role_id: RolesEnum.Staff,
                    // role_type: "",
                    message: "{{doctorName}} has unblocked part(s) of their schedule. Click here to view it",
                    values: "doctorName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Schedule Unblocked by Doctor"
                },
                {
                    key: "DELEGATE_DOCTOR_SCHEDULE_CHANGED",
                    subject: "Doctor changed workplace timing",
                    role_id: RolesEnum.Staff,
                    // role_type:"",
                    message: "{{doctorName}} has changed their workplace timings. Click here to view it",
                    values: "doctorName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Schedule changed by Doctor"
                },
                {
                    key: "DELEGATE_ACCOUNT_CREATED_BY_ADMIN",
                    subject: "Account created",
                    role_id: RolesEnum.Staff,
                    // role_type:"",
                    message: "Doctor's Support Staff account has been created by our Admin for Mobile Number {{mobileNo}} and Password {{password}}. Please change the password once logged in to keep your account secure",
                    values: "mobileNo,password",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "Account Created by Admin"
                },

            ];
            let pharmacyAdminNotificationData: any[] = [
                {
                    key: "PHARM_ADMIN_MOBILE_OTP_VERIFICATION",
                    subject: "Mobile Verification OTP",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type: "",
                    message: "Your OTP for Mobile Verification on Cryptopill is {{OTP}}.",
                    values: "OTP",
                    email_notification: 0,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "OTP Verification for Mobile Number"
                },
                {
                    key: "PHARM_ADMIN_ADD_EDIT_EMAIL_VERIFICATION",
                    subject: "Email verification",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type: "",
                    message: "Please follow the <a href=”{{link}}” >link </a> for verifying your Email ID",
                    values: "link",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 0,
                    trigger_event_detail: "Email Verification for Email ID added/edited"
                },
                {
                    key: "PHARM_ADMIN_ACCOUNT_VERIFIED_BY_ADMIN",
                    subject: "Account verified",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type: "",
                    message: "Your account has been verified by our Admins! You can now start using the App and fullfill orders!",
                    values: "",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Account Verified by Admin"
                },
                {
                    key: "PHARM_ADMIN_NEW_ORDER_REQUEST",
                    subject: "New order received",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type: "",
                    message: "You have received a new order request form {{patientName}}. Click to view the order",
                    values: "patientName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Medicine Order Request from Patient"
                },
                {
                    key: "PHARM_ADMIN_ORDER_CONFIRMED_BY_PATIENT",
                    subject: "Order confirmed",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type: "",
                    message: "{{patientName}} has confirmed their order. Order ID {{orderId}}. Click to view the order",
                    values: "patientName,orderId",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Order Confirmed from Patient"
                },
                {
                    key: "PHARM_ADMIN_DELIVERY_COMPLETED",
                    subject: "Order completed",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type: "",
                    message: "You have marked the order from {{patientName}} as completed. Order ID {{orderId}}",
                    values: "patientName,orderId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Pharmacy Delivery Completed"
                },
                {
                    key: "PHARM_ADMIN_PHARMACY_DETAILS_EDITED",
                    subject: "Pharmacy details edited",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type: "",
                    message: "Your Pharmacy Details have been edited by {{pharmacyAdminName}}. The changes will get reflected once our Admins verify them.",
                    values: "pharmacyAdminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Editing of Pharmacy Details by another Admin"
                },
                {
                    key: "PHARM_ADMIN_DELIVERY_INFO_EDITED",
                    subject: "Delivery information edited",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type: "",
                    message: "Your Delivery Information has been edited by {{pharmacyAdminName}}. The changes will get reflected once our Admins verify them.",
                    values: "pharmacyAdminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Editing of Delivery Information by another Admin"
                },
                {
                    key: "PHARM_ADMIN_EMPLOYEE_ADDED",
                    subject: "New employee added",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type: "",
                    message: "{{employeeName}} has been added to your Pharmacy by {{adminName}}",
                    values: "employeeName,adminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Employee Added"
                },
                {
                    key: "PHARM_ADMIN_EMPLOYEE_REMOVED",
                    subject: "Employee removed",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type: "",
                    message: "{{employeeName}} has been removed from your Pharmacy by {{adminName}}",
                    values: "employeeName,adminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Employee Removed"
                },
                {
                    key: "PHARM_ADMIN_ACCOUNT_CREATED_BY_ADMIN",
                    subject: "Account created",
                    role_id: RolesEnum.Pharmacy,
                    is_admin: 1,
                    // role_type:"",
                    message: "Pharmacy Admin Support Staff account has been created by our Admin for Mobile Number {{mobileNo}} and Password {{password}}. Please change the password once logged in to keep your account secure",
                    values: "mobileNo,password",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "Account Created by Admin"
                },

            ];

            let pharmacyEmpNotificationData: any[] = [
                {
                    key: "PHARM_EMPLOYEE_MOBILE_OTP_VERIFICATION",
                    subject: "Mobile Verification OTP",
                    role_id: RolesEnum.Pharmacy,
                    // role_type: "",
                    message: "Your OTP for Mobile Verification on Cryptopill is {{OTP}}.",
                    values: "OTP",
                    email_notification: 0,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "OTP Verification for Mobile Number"
                },
                {
                    key: "PHARM_EMPLOYEE_ADD_EDIT_EMAIL_VERIFICATION",
                    subject: "Email verification",
                    role_id: RolesEnum.Pharmacy,
                    // role_type: "",
                    message: "Please follow the <a href=”{{link}}” >link </a> for verifying your Email ID",
                    values: "link",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 0,
                    trigger_event_detail: "Email Verification for Email ID added/edited"
                },
                {
                    key: "PHARM_EMPLOYEE_NEW_ORDER_REQUEST",
                    subject: "New order",
                    role_id: RolesEnum.Pharmacy,
                    // role_type: "",
                    message: "You have received a new order request form {{patientName}}. Click to view the order",
                    values: "patientName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Medicine Order Request from Patient"
                },
                {
                    key: "PHARM_EMPLOYEE_ORDER_CONFIRMED_BY_PATIENT",
                    subject: "Order confirmed by patient",
                    role_id: RolesEnum.Pharmacy,
                    // role_type: "",
                    message: "{{patientName}} has confirmed their order. Order ID {{orderId}}. Click to view the order",
                    values: "patientName,orderId",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Order Confirmed from Patient"
                },
                {
                    key: "PHARM_EMPLOYEE_DELIVERY_COMPLETED",
                    subject: "Delivery completed",
                    role_id: RolesEnum.Pharmacy,
                    // role_type: "",
                    message: "You have marked the order from {{patientName}} as completed. Order ID {{orderId}}",
                    values: "patientName,orderId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Pharmacy Delivery Completed"
                },
                {
                    key: "PHARM_EMPLOYEE_EMP_ADDED",
                    subject: "Employee added",
                    role_id: RolesEnum.Pharmacy,
                    // role_type: "",
                    message: "{{employeeName}} has been added to your Pharmacy by {{adminName}}",
                    values: "employeeName,adminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Employee Added"
                },
                {
                    key: "PHARM_EMPLOYEE_EMP_REMOVED",
                    subject: "Employee removed",
                    role_id: RolesEnum.Pharmacy,
                    // role_type: "",
                    message: "{{employeeName}} has been removed from your Pharmacy by {{adminName}}",
                    values: "employeeName,adminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Employee Removed"
                },
                {
                    key: "PHARM_EMPLOYEE_ACCOUNT_CREATED_BY_ADMIN",
                    subject: "Account created",
                    role_id: RolesEnum.Pharmacy,
                    // role_type:"",
                    message: "Pharmacy Employee account has been created by our Admin for Mobile Number {{mobileNo}} and Password {{password}}. Please change the password once logged in to keep your account secure",
                    values: "mobileNo,password",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "Account Created by Admin"
                },

            ];

            let labAdminNotificationData: any[] = [
                {
                    key: "LAB_ADMIN_MOBILE_OTP_VERIFICATION",
                    subject: "Mobile Verification OTP",
                    role_id: RolesEnum.Laboratory,
                    is_admin: 1,
                    // role_type: "",
                    message: "Your OTP for Mobile Verification on Cryptopill is {{OTP}}.",
                    values: "OTP",
                    email_notification: 0,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "OTP Verification for Mobile Number"
                },
                {
                    key: "LAB_ADMIN_ADD_EDIT_EMAIL_VERIFICATION",
                    subject: "Email verification",
                    role_id: RolesEnum.Laboratory,
                    is_admin: 1,
                    // role_type: "",
                    message: "Please follow the <a href=”{{link}}” >link </a> for verifying your Email ID",
                    values: "link",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 0,
                    trigger_event_detail: "Email Verification for Email ID added/edited"
                },
                {
                    key: "LAB_ADMIN_ACCOUNT_VERIFIED_BY_ADMIN",
                    subject: "Account verified",
                    role_id: RolesEnum.Laboratory,
                    is_admin: 1,
                    // role_type: "",
                    message: "Your account has been verified by our Admins! You can now start using the App and fulfill orders!",
                    values: "",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Account Verified by Admin"
                },
                {
                    key: "LAB_ADMIN_TEST_ADDED_BY_ADMIN",
                    subject: "Test added",
                    role_id: RolesEnum.Laboratory,
                    is_admin: 1,
                    // role_type: "",
                    message: "Our Admins have added the list of tests offered by your Lab. Click here to view them",
                    values: "",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Lab test added by admin"
                },
                {
                    key: "LAB_ADMIN_TEST_ORDER_RECEIVED",
                    subject: "Order received",
                    role_id: RolesEnum.Laboratory,
                    is_admin: 1,
                    // role_type: "",
                    message: "You have received a new order request form {{patientName}}. Click to view the order",
                    values: "patientName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Test Order Request from Patient"
                },
                {
                    key: "LAB_ADMIN_ORDER_COMPLETED",
                    subject: "Order mareked as completed",
                    role_id: RolesEnum.Laboratory,
                    is_admin: 1,
                    // role_type:"",
                    message: "You have marked the order from {{patientName}} as completed. Order ID {{orderId}}",
                    values: "patientName,orderId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Test Results Delivery Completed"
                },
                {
                    key: "LAB_ADMIN_LAB_DETAILS_EDITED",
                    subject: "Lab details edited",
                    role_id: RolesEnum.Laboratory,
                    is_admin: 1,
                    // role_type:"",
                    message: "Your Lab Details have been edited by {{pharmacyAdminName}}. The changes will get reflected once our Admins verify them.",
                    values: "pharmacyAdminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Editing of Lab Details by another Admin"
                },
                {
                    key: "LAB_ADMIN_EMPLOYEE_ADDED",
                    subject: "Employee added",
                    role_id: RolesEnum.Laboratory,
                    is_admin: 1,
                    // role_type: "",
                    message: "{{employeeName}} has been added to your Pharmacy by {{adminName}}",
                    values: "employeeName,adminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Employee Added"
                },
                {
                    key: "LAB_ADMIN_EMPLOYEE_REMOVED",
                    subject: "Employee removed",
                    role_id: RolesEnum.Laboratory,
                    is_admin: 1,
                    // role_type: "",
                    message: "{{employeeName}} has been removed from your Pharmacy by {{adminName}}",
                    values: "employeeName,adminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Employee Removed"
                },
                {
                    key: "LAB_ADMIN_ACCOUNT_CREATED_BY_ADMIN",
                    subject: "Account created",
                    role_id: RolesEnum.Laboratory,
                    is_admin: 1,
                    // role_type:"",
                    message: "Lab Admin account has been created by our Admin for Mobile Number {{mobileNo}} and Password {{password}}. Please change the password once logged in to keep your account secure",
                    values: "mobileNo,password",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "Account Created by Admin"
                },

            ];

            let labEmpNotificationData: any[] = [
                {
                    key: "LAB_EMPLOYEE_MOBILE_OTP_VERIFICATION",
                    subject: "Mobile Verification OTP",
                    role_id: RolesEnum.Laboratory,
                    // role_type: "",
                    message: "Your OTP for Mobile Verification on Cryptopill is {{OTP}}.",
                    values: "OTP",
                    email_notification: 0,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "OTP Verification for Mobile Number"
                },
                {
                    key: "LAB_EMPLOYEE_ADD_EDIT_EMAIL_VERIFICATION",
                    subject: "Email verification",
                    role_id: RolesEnum.Laboratory,
                    // role_type: "",
                    message: "Please follow the <a href=”{{link}}” >link </a> for verifying your Email ID",
                    values: "link",
                    email_notification: 1,
                    sms_notification: 0,
                    push_notification: 0,
                    trigger_event_detail: "Email Verification for Email ID added/edited"
                },
                {
                    key: "LAB_EMPLOYEE_TEST_ORDER_RECEIVED",
                    subject: "New order request",
                    role_id: RolesEnum.Laboratory,
                    // role_type: "",
                    message: "You have received a new order request form {{patientName}}. Click to view the order",
                    values: "patientName",
                    email_notification: 0,
                    sms_notification: 0,
                    push_notification: 1,
                    trigger_event_detail: "Test Order Request from Patient"
                },
                {
                    key: "LAB_EMPLOYEE_ORDER_COMPLETED",
                    subject: "Order marked as completed by patient",
                    role_id: RolesEnum.Laboratory,
                    // role_type:"",
                    message: "You have marked the order from {{patientName}} as completed. Order ID {{orderId}}",
                    values: "patientName,orderId",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Test Results Delivery Completed"
                },
                {
                    key: "LAB_EMPLOYEE_EMP_ADDED",
                    subject: "Employee added",
                    role_id: RolesEnum.Laboratory,
                    // role_type: "",
                    message: "{{employeeName}} has been added to your Pharmacy by {{adminName}}",
                    values: "employeeName,adminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Employee Added"
                },
                {
                    key: "LAB_EMPLOYEE_EMP_REMOVED",
                    subject: "Employee removed",
                    role_id: RolesEnum.Laboratory,
                    // role_type: "",
                    message: "{{employeeName}} has been removed from your Pharmacy by {{adminName}}",
                    values: "employeeName,adminName",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 1,
                    trigger_event_detail: "Employee Removed"
                },
                {
                    key: "LAB_EMPLOYEE_ACCOUNT_CREATED_BY_ADMIN",
                    subject: "Account created",
                    role_id: RolesEnum.Laboratory,
                    // role_type:"",
                    message: "Lab Employee account has been created by our Admin for Mobile Number {{mobileno}} and Password {{password}}. Please change the password once logged in to keep your account securepassword once logged in to keep your account secure",
                    values: "mobileNo,password",
                    email_notification: 1,
                    sms_notification: 1,
                    push_notification: 0,
                    trigger_event_detail: "Account Created by Admin"
                },

            ];


            await NotificationTemplates.bulkCreate(patientNotificationData, { returning: true });
            await NotificationTemplates.bulkCreate(doctorNotificationData, { returning: true });
            await NotificationTemplates.bulkCreate(supportStaffNotificationData, { returning: true });
            await NotificationTemplates.bulkCreate(pharmacyAdminNotificationData, { returning: true });
            await NotificationTemplates.bulkCreate(pharmacyEmpNotificationData, { returning: true });
            await NotificationTemplates.bulkCreate(labAdminNotificationData, { returning: true });
            await NotificationTemplates.bulkCreate(labEmpNotificationData, { returning: true });

            return true;

        } catch (error) {
            throw new BadRequestError("Issue while adding data : " + error);
        }
    }

    async getNotifications(key: string) {
        const template: any = await NotificationTemplates.findOne({
            where: { key: key },
            raw: true,
        });
        return template;
    }

    async getAdminPermissionList(limit: number, offset: number, search: string, sort: string = "updatedAt", order: string = "desc", role_type: string = "Patient") {

        Users.hasOne(NotificationTemplates, { foreignKey: "modified_by" });
        NotificationTemplates.belongsTo(Users, { foreignKey: "modified_by" });

        const orderByCase = sort ? sequelize.literal(`${sort} ${order}`) : sequelize.literal('full_name ASC');

        const searchCase = role_type == "Patient" ? { role_id: RolesEnum.Patient } : role_type == "Doctor" ? { role_id: RolesEnum.Doctor } : role_type == "Staff" ? { role_id: RolesEnum.Staff } : role_type == "PharmacyAdmin" ? { role_id: RolesEnum.Pharmacy, is_admin: 1 } : role_type == "PharmacyEmployee" ? { role_id: RolesEnum.Pharmacy, is_admin: 0 } : role_type == "LabAdmin" ? { role_id: RolesEnum.Laboratory, is_admin: 1 } : role_type == "LabEmployee" ? { role_id: RolesEnum.Laboratory, is_admin: 0 } : {}

        const { count, rows }: any = await NotificationTemplates.findAndCountAll({

            attributes: [
                "modified_by",
                "updatedAt",
                [fn("", col("email")), "email"],
                [
                    fn("CONCAT", col("first_name"), " ", col("last_name")),
                    "full_name",
                ],
                "trigger_event_detail",
                "key",
                "message",
                // "values",
                "role_id",
                "is_admin",
                "email_notification",
                "sms_notification",
                "push_notification"
            ],
            include: [
                {
                    model: Users,
                    attributes: [],
                }
            ],
            where: {
                ...searchCase,
                // ...roleFilter
            },
            limit: limit,
            offset: offset,
            order: orderByCase,
            raw: true,
        });
        return {
            notificationList: rows,
            limit: limit,
            offset: offset,
            count,
        };
    }

    async getDetails(key: string) {
        if (!key) {
            throw new Error("Please select proper template");
        }

        const result: any = await NotificationTemplates.findOne({
            where: { key: key },
            attributes: [
                "message",
                "values",
                "email_notification",
                "sms_notification",
                "push_notification",
                "role_id"
            ],
        });

        // if (!result) {
        //     throw new Error("Notification template not found");
        // }
        // let isError = false;
        // if (result.role_id == RolesEnum.Patient && !permissions.includes(AdminPermission.notification_patient)) {
        //     isError = true;
        // }
        // if ((result.role_id == RolesEnum.Doctor || result.role_id == RolesEnum.Staff) && !permissions.includes(AdminPermission.notification_doctor)) {
        //     isError = true;
        // }
        // if (result.role_id == RolesEnum.Pharmacy && !permissions.includes(AdminPermission.notification_pharmacist)) {
        //     isError = true;
        // }
        // if (result.role_id == RolesEnum.Laboratory && !permissions.includes(AdminPermission.notification_lab)) {
        //     isError = true;
        // }

        // if (isError) {
        //     throw new BadRequestError("You don't have permission to access this module.");
        // }
        return result;
    }


    async editNotification(body: any, user_id: string, permissions: any = []) {
        try {
            const result: any = await NotificationTemplates.findOne({
                where: { key: body.key },
                attributes: [
                    "role_id"
                ],
            });
            let isError = false;
            if (result.role_id == RolesEnum.Patient && !permissions.includes(AdminPermission.notification_patient)) {
                isError = true;
            }
            if ((result.role_id == RolesEnum.Doctor || result.role_id == RolesEnum.Staff) && !permissions.includes(AdminPermission.notification_doctor)) {
                isError = true;
            }
            if (result.role_id == RolesEnum.Pharmacy && !permissions.includes(AdminPermission.notification_pharmacist)) {
                isError = true;
            }
            if (result.role_id == RolesEnum.Laboratory && !permissions.includes(AdminPermission.notification_lab)) {
                isError = true;
            }

            if (isError) {
                throw new BadRequestError("You don't have permission to access this module.");
            }
            await NotificationTemplates.update(
                {
                    message: body.message,
                    email_notification: body.email_notification,
                    sms_notification: body.sms_notification,
                    push_notification: body.push_notification,
                    modified_by: user_id
                },
                {
                    where: {
                        key: body.key,
                    },
                }
            );

            return { msg: "Template updated." }
        } catch (error) {
            // console.error(`Error in updateDoctorStaffDetails ==> ${error}`);
            throw new Error("Issue while updating notifiction template => " + error);
        }

    }

    async getSettings(user: any) {
        return await NotificationSetting.findOrCreate({
            where: {
                user_id: user.id,
                role_id: user.default_role,
                is_admin: user.isAdmin
            }
        }).spread((setting: any, created) => {
            // console.log(setting.get({
            //     plain: true
            // }))
            // console.log(created)
            if (created) {
                let data = setting.get({
                    plain: true
                });
                return { email_notification: data.email_notification, sms_notification: data.sms_notification, push_notification: data.push_notification };
            }
            else {
                return { email_notification: setting.email_notification, sms_notification: setting.sms_notification, push_notification: setting.push_notification };
            }
        });

    }

    async settingsEdit(body: any, user: any) {
        try {
            let whereCondition: any = body.is_for_all ? {
                user_id: user.id,
            } : {
                user_id: user.id,
                role_id: user.default_role,
            }

            const settings = await NotificationSetting.update({
                ...body
            }, {
                where: {
                    ...whereCondition
                }
            });

            return { message: "Settings updated" };

        } catch (error) {
            throw new BadRequestError("Issue while updating settings : " + error);
        }

    }

    async getList(user: any, limit: number = 10, offset: number = 0) {
        const { count, rows }: any = await NotificationsList.findAndCountAll({
            attributes: [
                "key",
                "message",
                "values",
                "createdAt"
            ],
            where: {
                user_id: user.id,
                role_id: user.default_role,
                is_admin: user.isAdmin
            },
            limit: limit,
            offset: offset,
            order: [["createdAt", "DESC"]],
            raw: true,
        });
        return {
            notificationList: rows,
            limit: limit,
            offset: offset,
            count,
        };;
    }

    async removeAllNotifications(user: any) {

        await NotificationsList.destroy({
            where: {
                user_id: user.id,
                role_id: user.default_role,
                is_admin: user.isAdmin
            },
        });

        return { msg: "Notifications cleared" };
    }
}