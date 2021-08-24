import { Op, fn, col } from "sequelize";
import sequelize = require("sequelize");
import NotificationsList from "../models/notifications_list.model";
import NotificationSetting from "../models/notification_setting.model";
import Users from "../models/users.model";
import { NotificationService } from "../services/shared/notification.service";
import { EmailServer } from "./EmailService";
import { PushNotifications } from "./PushNotifications";
import { Utils } from "./Utils";

export class Notifications {
    constructor() { }

    /**
     * description: 
     */
    async sendNotification(key: string, data: any, sendDetails: any, checkSettings: boolean = true) {

        //get notification template
        const template = await new NotificationService().getNotifications(key);

        //replace dynamic values
        let dynamic_values: [] = template.values.split(',');
        let message: string = template.message;
        let sendStatus: boolean = true;

        // Replace dynamic values in message body
        await dynamic_values.map((values) => {
            message = message.replace(`{{${values}}}`, data[values]);
        });

        let pushNotificationValues = data.pushNotificationValue ? data.pushNotificationValue : {};

        //set contact details
        let contactDetails: any = {
            emailList: sendDetails.email ? sendDetails.email : [],
            phoneNoList: sendDetails.contact_number ? sendDetails.contact_number : [],
            fcmTokenList: []
        }

        //get the contact details and whether to send or not details 
        Users.hasOne(NotificationSetting, {
            foreignKey: "user_id", scope: {
                [Op.and]: [
                    sequelize.where(
                        sequelize.fn("", sequelize.col("users.default_role")),
                        "=",
                        sequelize.fn("", sequelize.col("notification_setting.role_id")),
                    ),
                ],
            },
        });
        NotificationSetting.belongsTo(Users, { foreignKey: "user_id" });
        if (checkSettings) {
            let whereCondition = sendDetails.contact_number ? sendDetails.contact_number ? {
                contact_number: {
                    [Op.in]: sendDetails.contact_number,
                },
            } : {
                email: {
                    [Op.in]: sendDetails.email,
                },
            } : {}

            const userData: any = await Users.findAll({
                where: {
                    ...whereCondition
                },
                attributes: [
                    "id",
                    "email",
                    "contact_number",
                    "default_role",
                    "fcmToken",
                    "default_role",
                    [fn("", col("email_notification")), "email_notification"],
                    [fn("", col("sms_notification")), "sms_notification"],
                    [fn("", col("push_notification")), "push_notification"],
                ],
                include: [
                    {
                        model: NotificationSetting,
                        attributes: [],

                    },
                ],
                raw: true,
            });
            let emailsList: any = [];
            let contactList: any = [];
            let pushList: any = [];

            let userDataListPromise = await userData.map(async (singleData: any) => {
                if (template.email_notification == 1 && singleData.email && singleData.email_notification == 1)
                    emailsList.push(singleData.email);

                if (template.sms_notification == 1 && singleData.contact_number && singleData.sms_notification == 1)
                    contactList.push(singleData.contact_number);

                if (template.push_notification == 1 && singleData.fcmToken && singleData.push_notification == 1 && (template.role_id == singleData.default_role || (sendDetails.role_id && sendDetails.role_id == "none")))
                    pushList.push(singleData.fcmToken);

                if (template.push_notification == 1) {
                    //add notification to notification table
                    let saveNotification: any = {
                        key: key,
                        user_id: singleData.id,
                        role_id: (sendDetails.role_id && sendDetails.role_id == "none") ? null : template.role_id,
                        is_admin: template.is_admin,
                        subject: template.subject,
                        message: message,
                        values: { ...pushNotificationValues }
                    }
                    await NotificationsList.create(saveNotification)
                }
            });

            await Promise.all(userDataListPromise);
            contactDetails.emailList = emailsList;
            contactDetails.phoneNoList = contactList;
            contactDetails.fcmTokenList = pushList;
        }

        //send email if emails are available 
        if (contactDetails.emailList.length > 0) {

            let mailBody: any = {
                to: contactDetails.emailList,
                subject: template.subject,
                html: message,
            };
            let mailStatus = await new EmailServer().sendEmail(mailBody);
            if (!mailStatus) {
                sendStatus = false;
            }
        }

        //send sms if phone numbers are available 
        if (contactDetails.phoneNoList.length > 0) {
            let sendSmsPromise = await contactDetails.phoneNoList.map(async (singleData: any) => {
                const optSent = await Utils.sendMessage(
                    message,
                    singleData
                );
                if (!optSent || !optSent.sid) {
                    sendStatus = false;
                }
            })
            await Promise.all(sendSmsPromise);
        }

        //send push notifications if fcm tokens are available 
        if (contactDetails.fcmTokenList.length > 0) {
            let payload = {
                notification: {
                    title: template.subject,
                    body: message
                },
                data: {
                    key: key,
                    ...pushNotificationValues
                    // mainNav: 'doctor',
                }
            };


            await new PushNotifications().sendPushNotification(contactDetails.fcmTokenList, payload).then((response) => {
                sendStatus = true;
            }).catch(error => {
                sendStatus = false;

            });
        }


        return sendStatus;
    }
}


