import { get } from "config";
import { BadRequestError } from "routing-controllers";
import DrPatientAppoiment from "../models/dr_patient_appoiment.model";
import { UserService } from "../services/mobile/user/user.service";
import { Utils } from "./Utils";
const secrets: any = get("APP");

const AccessToken = require('twilio').jwt.AccessToken;


export class TwilioService {
	async generateVideoRoomAccessToken(user_id: number, user_name: string, booking_id: number) {
		//dummy credential for test account
		const DEMO_ACCOUNT_SID = "AC6a850c088b66eb704915c6fe10538bb6";
		const DEMO_AUTH_TOKEN = "SKa11b466ee73b772dff7268d900f0ab0e";
		const VideoGrant = AccessToken.VideoGrant;
		const { JWT_SECRET, TWILIO_API_SECRET }: any = secrets;

		// Used when generating any kind of Access Token
		const twilioAccountSid = DEMO_ACCOUNT_SID;
		const twilioApiKey = DEMO_AUTH_TOKEN;
		const twilioApiSecret = TWILIO_API_SECRET;

		// Create an access token which we will sign and return to the client,
		// containing the grant we just created
		const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret);
		token.identity = `${user_name}_${user_id}`;

		// Create a Video grant which enables a client to use Video 
		// and limits access to the specified Room (DailyStandup)
		const grant = new VideoGrant();
		grant.room = `booking_${booking_id}`;
		token.addGrant(grant);

		// Serialize the token to a JWT string
		let twillioToken = token.toJwt();
		//	return { twillioToken };

		//Authnetication Issue from twilio error code 20003
		//const client = require('twilio')(twilioAccountSid, twilioApiKey);
		//let roomObj = await client.video.rooms.create({uniqueName: `booking_${booking_id}`, recordParticipantsOnConnect: true});

		return { twillioToken };
	}

	async generateRoomWithVideoAccessToken(user: any, booking_id: number, record_session: boolean = false) {
		let user_id = user.id;
		let user_name = user.first_name;
		let role = user.role;
		//For enabling/disabling Call record use below code as reference
		const DEMO_ACCOUNT_SID = "AC6a850c088b66eb704915c6fe10538bb6";
		const DEMO_AUTH_TOKEN = "4ba4eab8c91d7c9524e178b781099416";
		const DEMO_AUTH_KEY = "SKa11b466ee73b772dff7268d900f0ab0e";
		const { JWT_SECRET, TWILIO_API_SECRET }: any = secrets;
		const client = require('twilio')(DEMO_ACCOUNT_SID, DEMO_AUTH_TOKEN);

		const roomName = `booking_${booking_id}`;
		
		if(role.toLowerCase() === "doctor") {
			let permissionBody = {
				booking_id: booking_id,
				is_doctor_recording: record_session
			}
			await new UserService().addRecordingPermission(permissionBody);
		} 

		if(role.toLowerCase() === "patient") {
			let permissionBody = {
				booking_id: booking_id,
				is_patient_recording: record_session
			}
			await new UserService().addRecordingPermission(permissionBody);
		} 

		
		//let { permissions } = await new UserService().getRecordingPermission(booking_id);
		//if (!permissions || !permissions.video_call) throw new BadRequestError("Video Call Related Permission Not Found");
		//if (permissions.is_patient_recording && permissions.is_doctor_recording) record_session = true;

		let room = await client.video.rooms.list({ uniqueName: roomName, limit: 20 });

		if (!room.length) { //Not Created then create one room with this name
			room = await client.video.rooms.create({ uniqueName: roomName });
		}

		if (!room) {
			throw new BadRequestError("Issue while creating Room");
		}

		let AccessToken = require('twilio').jwt.AccessToken;
		let VideoGrant = AccessToken.VideoGrant;

		// Create an Access Token
		let accessToken = new AccessToken(
			DEMO_ACCOUNT_SID,
			DEMO_AUTH_KEY,
			TWILIO_API_SECRET
		);

		// Set the Identity of this token
		accessToken.identity = `${user_name}_${user_id}`;

		// Grant access to Video
		let grant = new VideoGrant();
		grant.room = roomName;
		accessToken.addGrant(grant);

		// Serialize the token as a JWT
		let twillioToken = accessToken.toJwt();
		return { twillioToken };
	}

	async addRecordingRulesForRoom(room_id: string, booking_id : number) {
		const accountSid = "AC6a850c088b66eb704915c6fe10538bb6";
		const authToken = "4ba4eab8c91d7c9524e178b781099416";
		const client = require('twilio')(accountSid, authToken);

		let record_session = false;
		//Get recordingPermissions from booking ID 
	 	let { permissions } = await new UserService().getRecordingPermission(booking_id);
		
		 if (!permissions || !permissions.video_call) throw new BadRequestError("Video Call Related Permission Not Found");
		
		//If recording accepted by any side then allow to set below recording rule on the room
		if (permissions.is_patient_recording || permissions.is_doctor_recording) record_session = true;

		if(record_session) {
			let recordingRuleStatus: any = await client.video.rooms(room_id)
			.recordingRules
			.update({ rules: [{ "type": "include", "all": true }] });
		}
	}

	async getVideoCallRecordingUrl(roomID: string, booking_id: number) {
		//dummy credential for test account
		const DEMO_ACCOUNT_SID = "AC6a850c088b66eb704915c6fe10538bb6";
		const DEMO_AUTH_TOKEN = "4ba4eab8c91d7c9524e178b781099416";
		const demo_client = require("twilio")(DEMO_ACCOUNT_SID, DEMO_AUTH_TOKEN);

		let callBackURL = `${secrets.TWILIO_CONFIG.RECORD_CALLBACK_HOST}:${secrets.SERVER.PORT}/user/recordingStatus`;

		let videoRecordings: any[] = await demo_client.video.recordings.list({
			groupingSid: [roomID],
			limit: 20
		});

		if (!videoRecordings.length)
			throw new BadRequestError("No Such Video record refernece Found");

		let composedVideo = await demo_client.video.compositions.
			create({
				roomSid: roomID,
				audioSources: '*',
				videoLayout: {
					grid: {
						video_sources: ['*']
					}
				},
				statusCallback: callBackURL, //added to test call back via url
				statusCallbackMethod: "GET",
				format: 'mp4'
			});
		if (!composedVideo.sid) {
			throw new BadRequestError("Issue while composing recordings for this Room");
		}
		let addRecordingURL = await new UserService().updateRecordingURL(composedVideo.sid, booking_id);
		const uri = "https://video.twilio.com/v1/Compositions/" + composedVideo.sid + "/Media";

		return { recordingUrl: uri };
	}

	async createFriendlyChatService(topic_name: string) {
		//const accountSid = process.env.TWILIO_ACCOUNT_SID;
		//const authToken = process.env.TWILIO_AUTH_TOKEN;
		const DEMO_ACCOUNT_SID = "ACe9b39eb400c08fa8ff6738500ede100d";
		const DEMO_AUTH_TOKEN = "d8fc3ca430aad6cb053564521b4d87c3";
		const demo_client = require("twilio")(DEMO_ACCOUNT_SID, DEMO_AUTH_TOKEN);

		let generatedTopic = await demo_client.chat.services.create({ friendlyName: topic_name });

		if (!generatedTopic.sid) {
			throw new BadRequestError("Issue while generating Friendly Chat Service");
		}

		return { msg: "Friendly Chat Service Created Successfully", service_id: generatedTopic.sid }
	}

	async generateChatRoomAccessToken(contact_number: string, user_name: string, service_id: string = "") {
		//dummy credential for test account
		const DEMO_ACCOUNT_SID = "AC6a850c088b66eb704915c6fe10538bb6";
		const DEMO_AUTH_TOKEN = "SKa11b466ee73b772dff7268d900f0ab0e";
		const ChatGrant = AccessToken.ChatGrant;

		const { JWT_SECRET, TWILIO_CHAT_SERVICE_SID, TWILIO_API_SECRET }: any = secrets;
		//console.log(`${DEMO_ACCOUNT_SID}, ${DEMO_AUTH_TOKEN}`);
		// Used when generating any kind of Access Token
		const twilioAccountSid = DEMO_ACCOUNT_SID;
		const twilioApiKey = DEMO_AUTH_TOKEN;
		const twilioApiSecret = TWILIO_API_SECRET;

		// Create a "grant" which enables a client to use Chat as a given user,
		// on a given device
		const chatGrant = new ChatGrant({
			serviceSid: TWILIO_CHAT_SERVICE_SID,
		});

		// Create an access token which we will sign and return to the client,
		// containing the grant we just created
		const token = new AccessToken(
			twilioAccountSid,
			twilioApiKey,
			twilioApiSecret,
			{ identity: `${contact_number}_${user_name}` }
		);

		token.addGrant(chatGrant);

		// Serialize the token to a JWT string
		let twillioToken = token.toJwt();
		return { twillioToken };
	}


}