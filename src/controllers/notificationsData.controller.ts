// import { NotificationService } from "../services/shared/notification.service";
// import {
// 	Post,
// 	Body,
// 	Get,
// 	JsonController,
// 	Param,
// 	Delete,
// 	UseBefore,
// 	BadRequestError,
// 	Res,
// 	CurrentUser,
// } from "routing-controllers";
// import { Notifications } from "../helpers";


// @JsonController("/notifications")
// export class NotificationController {
// 	constructor(private notfySrv: NotificationService) { }

// 	/**
// 	 * method: Post 
// 	 * url: serverUrl:Port/notifications
// 	 * description: To add the data to database for notification.
// 	 */
// 	@Post("/")
// 	async addNotificationData() {
// 		const response: boolean = await this.notfySrv.addData();
// 		if (!response) {
// 			throw new BadRequestError("Something went wrong.");
// 		}
// 		return response;
// 	}

// 	/**
// 	 * method: Post 
// 	 * url: serverUrl:Port/notifications/dummy
// 	 * description: To add the data to database for notification.
// 	 */
// 	@Get("/dummy")
// 	async dummySendNotrification() {
// 		let mailStatus = await new Notifications().sendNotification("PATIENT_NEW_APPOINTMENT_REQUEST", { patientName: "Khushboo Modi", doctorName: "testing Name" }, { email: "khushboo.modi@neosoftmail.com", subject: "patient new appointment request", contact_number: "+918114438874" });

// 		return mailStatus;
// 	}



// }