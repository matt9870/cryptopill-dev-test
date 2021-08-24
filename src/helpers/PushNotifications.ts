import * as fcm from "firebase-admin";
import * as path from "path";

const SERVICE_CERT: string = "../../config/FCM_ADMIN_CERT.json";
export class PushNotifications {
	constructor() {
		if (fcm.apps.length === 0) {
			// tslint:disable-next-line

			fcm.initializeApp({
				credential: fcm.credential.cert(path.resolve(__dirname, SERVICE_CERT)),
			});
		}
	}

	/**
	 * @param message
	 */
	public async sendPushNotification(
		tokens: string | string[],
		payload: fcm.messaging.MessagingPayload
	): Promise<fcm.messaging.MessagingDevicesResponse> {
		if (!payload) throw new Error("You must provide a payload object");
		if (tokens && tokens instanceof Array && typeof tokens[0] === "string")
			return fcm.messaging().sendToDevice(tokens, payload);
		else
			throw new Error("Invalid device token, tokens must be array of string!");
	}
}
