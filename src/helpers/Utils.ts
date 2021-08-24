import * as crypto from "crypto";
import { get } from "config";
const secrets = get("APP");
const {
	TWILIO_CONFIG: { MOBILE_NUMBER, ACCOUNT_SID, AUTH_TOKEN },
	AWS_ACCESS_KEY,
	AWS_SECRETE_KEY,
	AWS_S3_BUCKET,
	JWT_SECRET,
	AES_SECRET,
	ACCOUNT_VERIFICATION_LINK,
	MIX_PANEL_TOKEN
}: any = secrets;
const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);
import { sign, verify } from "jsonwebtoken";
import { AES, enc } from "crypto-ts";
const otpGenerator = require("otp-generator");
import { S3 } from "aws-sdk";
import { BadRequestError, UnauthorizedError } from "routing-controllers";
import sequelize, { namepsace } from "../db/sequalise";
import { ResponseMessageEnum } from "../constants/constant.enum";
import { EmailServer } from "./EmailService";
import { adminRolesEnum, RolesEnum } from "../constants/roles.enum";
import * as fs from 'fs';
import { PDFMaster } from "./PDFMaster";
import * as path from "path";
import Timeouts from "../models/timeouts.model";
import moment = require("moment");
var qpdf = require('node-qpdf');
import sequelizeData = require("sequelize");
const Mixpanel = require('mixpanel');



/**
 * Utils
 */
export class Utils {
	// public getPaginateResponse<T>(response: PaginateResult<T>): IPagination {
	//   return {
	// total: response.total,
	// limit: response.limit,
	// page: response.page,
	// pages: response.pages,
	//   };
	// }

	static s3Instance: any = new S3({
		credentials: {
			accessKeyId: AWS_ACCESS_KEY,
			secretAccessKey: AWS_SECRETE_KEY,
		},
	});
	public async getToken(): Promise<number> {
		//const buffer: Buffer = await this.generateRandomBytes();

		return (
			Math.floor(
				(parseInt(crypto.randomBytes(1).toString("hex"), 16) / 1000) * 90000
			) + 10000
		);
	}

	public async generateRandomBytes(): Promise<any> {
		return crypto.randomBytes(16);
	}

	static async sendMessage(messageBody: string, mobileNumber: string) {
		try {
			const msgSent = await client.messages.create({
				from: MOBILE_NUMBER,
				to: mobileNumber,
				body: messageBody,
			});

			return msgSent;
		} catch (error) {
			throw new BadRequestError(error.message);
		}
	}

	static encrypt(data: string) {
		try {
			const ciphertext = AES.encrypt(data, AES_SECRET).toString();
			return ciphertext;
		} catch (error) {
			throw new BadRequestError(error.message);
		}
	}

	static decrypt(data: string) {
		try {
			const bytes = AES.decrypt(data, AES_SECRET);
			return bytes.toString(enc.Utf8);
		} catch (error) {
			throw new BadRequestError(error.message);
		}
	}

	static createJWTToken(payload: any, options?: any) {
		try {
			const token = sign(payload, JWT_SECRET, {
				expiresIn: options && options.expireIn ? options.expireIn : "24h",
			});

			return token;
		} catch (error) {
			throw new BadRequestError(error.message);
		}
	}

	static varifyToken(token: string) {
		try {
			const isVerified = verify(token, JWT_SECRET);
			return isVerified;
		} catch (error) {
			throw new UnauthorizedError(error.message);
		}
	}
	static generateOPT() {
		const otp = otpGenerator.generate(6, {
			digits: true,
			alphabets: false,
			upperCase: false,
			specialChars: false,
		});

		return otp;
	}

	static async uploadFile(file: any, key: string, isfileString: boolean = false) {
		// const s3Instance = new S3({
		// 	credentials: {
		// 		accessKeyId: AWS_ACCESS_KEY,
		// 		secretAccessKey: AWS_SECRETE_KEY,
		// 	},
		// });

		const upload = await this.s3Instance
			.upload({
				Bucket: AWS_S3_BUCKET,
				Key: key,
				Body: isfileString ? file : file.buffer,
				ACL: "public-read",
			})
			.promise();

		return upload;
	}

	static async deleteFile(fileName: string) {
		// const s3Instance = new S3({
		// 	credentials: {
		// 		accessKeyId: AWS_ACCESS_KEY,
		// 		secretAccessKey: AWS_SECRETE_KEY,
		// 	},
		// });
		var params = {
			Bucket: AWS_S3_BUCKET,
			Key: fileName,
		};

		const deleted = await this.s3Instance.deleteObject(params).promise();

		return deleted;
	}
	static async setTransaction(task: any) {
		return namepsace.get("transaction") ? task : sequelize.transaction(task);
	}

	static async creatVerficationLink(user: any) {
		// send email verification link to all added employess
		let mailBody: any = {
			to: user.email,
			subject: ResponseMessageEnum.EMAIL_VERIFICATION_SUBJECT,
			message: ResponseMessageEnum.EMAIL_VERIFICATION_MESSAGE,
			html: `<a href=${ACCOUNT_VERIFICATION_LINK}>Link to Portal for Verfication</a>`,
		};

		let mailStatus = await new EmailServer().sendEmail(mailBody);
		return mailStatus;
	}

	static getRoleById(role_id: number) {
		const mapping = {
			[RolesEnum.Admin]: "Admin",
			[RolesEnum.Doctor]: "Doctor",
			[RolesEnum.Staff]: "Staff",
			[RolesEnum.Patient]: "Patient",
			[RolesEnum.Pharmacy]: "Pharmacy",
			[RolesEnum.Laboratory]: "Laboratory"
		} as any;

		return !!mapping[role_id] ? mapping[role_id] : null;

	}

	static async generateSecretToken() {
		const DEMO_ACCOUNT_SID = "ACe9b39eb400c08fa8ff6738500ede100d";
		const DEMO_AUTH_TOKEN = "d8fc3ca430aad6cb053564521b4d87c3";
		const demo_client = require("twilio")(DEMO_ACCOUNT_SID, DEMO_AUTH_TOKEN);
		const key: any = await demo_client.newKeys.create();
		if (!key || !key.sid) throw new BadRequestError("Invalid Twillio Credentials");
		return key.sid
	}

	static async verifyRoomToken(token: string) {
		try {
			const isVerified = verify(token, "secretForJwtToken");
			return isVerified;
		} catch (error) {
			throw new UnauthorizedError(error.message);
		}
	}

	static getRolesByPermissionId(permissionArray: number[]) {
		let map = new Map();
		map.set(adminRolesEnum.User_Patient, RolesEnum.Patient)
		map.set(adminRolesEnum.User_DoctorAndStaff, `${RolesEnum.Staff},${RolesEnum.Doctor}`)
		map.set(adminRolesEnum.User_Pharmacy, RolesEnum.Pharmacy)
		map.set(adminRolesEnum.User_Laboratory, RolesEnum.Laboratory)

		return permissionArray.map(el => map.get(el)).filter(e => !!e).join(",");
	}

	static async genrateEncryptedPdf(localFilePath: string, fileName: string, password: string): Promise<any> {
		var outputFilePath = path.join(__dirname, `../../src/assets/pdf/encrypt_${fileName}`);

		var options: any = {
			keyLength: 128,
			password: password,
			outputFile: outputFilePath,
			restrictions: {
				modify: 'none',
				extract: 'n'
			}
		}

		return qpdf.encrypt(localFilePath, options);
	}

	//generate pdf from html and bind dynamic data
	static async pdfGeneration(pdfData: any, patientData: any, generateEncrypted: boolean) {
		var html = fs.readFileSync(path.join(__dirname, "../../src/assets/template/pdf_template.html"), "utf8");

		let options = {
			format: "A4",
			orientation: "portrait",
			border: "5mm",
		};

		let milis = new Date();
		let milisTime = milis.getTime();
		let fileName = `${patientData.patientName}-${milisTime}.pdf`;

		var pdfPath = path.join(__dirname, `../../src/assets/pdf/${fileName}`);

		var document = {
			html: html,
			data: {
				pdfData
			},
			path: pdfPath,
			type: "", // "stream" || "buffer" || "" ("" defaults to pdf)
		};
		let fileDetail = await PDFMaster.create(document, options);
		let encryptedDetail: any = null;
		if (generateEncrypted)
			encryptedDetail = await this.genrateEncryptedPdf(pdfPath, fileName, patientData.DOB)

		return { pdf: fileDetail.filename, encrypted_pdf: encryptedDetail };


	}

	static async getAge(dateString: string) {
		var today = new Date();
		var birthDate = new Date(dateString);
		var age = today.getFullYear() - birthDate.getFullYear();
		var m = today.getMonth() - birthDate.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	}

	static async compareTime(dateTimeString: string, isForPatient: boolean = false) {
		let timeoutValues: any = await Timeouts.findOne({ where: { timeout_for: isForPatient ? "patient" : "doctor_pharmacy_laboratories" } });

		if (timeoutValues) {
			let startdate = moment(dateTimeString);
			let expected_enddate = moment();
			let returned_endate = moment(startdate).add(timeoutValues.time_minutes, 'minutes');


			if (expected_enddate.isSame(returned_endate) || expected_enddate.isBefore(returned_endate))
				return true
			return false;
		}
		else
			return true;
	}

	static mixpanelInstance: any = Mixpanel.init(MIX_PANEL_TOKEN);

	static async trackEvent(event: any, data: any) {
		//console.log("TrackedEvent ==>", event);
		//console.log("TrackedData ==>", data);
		return this.mixpanelInstance.track(event, data);
	}
}
