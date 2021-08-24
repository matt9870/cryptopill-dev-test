import { Utils } from "../../helpers";
import Roles from "../../models/roles.model";
import Users from "../../models/users.model";
import { get } from "config";
import { BadRequestError, NotFoundError } from "routing-controllers";
import { UserRoleService } from "./user-role.service";
import UserUploads from "../../models/user_uploads.model";
const secretes: any = get("APP");
const { AWS_FILE_UPLOAD_LINK } = get("APP");
import { fn, col, Sequelize, Op } from "sequelize";
import UserRole from "../../models/user_role.model";
import { StatusCode } from "../../constants/status_code.enum";
import WorkplaceUploads from "../../models/workplace_uploads";
import PharmacyWorkplaces from "../../models/pharmacy_workplaces.model";
import { RolesEnum } from "../../constants/roles.enum";
import LabWorkplaces from "../../models/lab_workplaces.model";
import UserScannedDocument from "../../models/user_scanned_prescriptions";
const { v4 } = require('uuid');
import * as moment from 'moment';
import TemporaryLabTests from "../../models/temporary_lab_tests.model";
import * as fs from 'fs';
import path = require("path");

export class FileService {
	async uploadFile(files: any[], user_id: number, role_id: number, uploadType: "document" | "profileImage", isImageUpdated?: boolean, documentType?: string, body?: any) {
		const roleName = await this.getRoleDetails(role_id);
		let promiseArray = [];
		for (let i = 0; i < files.length; i++) {
			promiseArray.push(this.processFileUpload(files[i], user_id, role_id, roleName, uploadType, isImageUpdated, documentType, body))
		};
		return Promise.all(promiseArray);
	}

	private async processFileUpload(file: any, user_id: number, role_id: number, roleName: string, uploadType: "document" | "profileImage", isImageUpdated?: boolean, documentType?: string, body?: any) {

		const modifiedFileName = this.getModifiedFileName(file.originalname);
		// const key = `${roleName}/user_${user_id}/${modifiedFileName}`;
		const key = `user_documents/user_${user_id}/${uploadType === 'profileImage' ? 'profile_picture' : roleName}/${modifiedFileName}`
		const uploadResponse = await Utils.uploadFile(file, key);

		if (uploadResponse) {

			if (uploadType === "profileImage") {

				const updateUser = await this.updateUserProfilePhoto(
					user_id,
					modifiedFileName,
					isImageUpdated
				);

				if (updateUser.length > 0) {
					return `${AWS_FILE_UPLOAD_LINK}/${uploadResponse.key}`
				} else {
					throw new Error("Fail to upload file");
				}
			}

			if (uploadType === "document") {

				const isUserRoleExists = await new UserRoleService().isUserRoleExists(user_id, role_id);

				const obj = {
					user_role_id: isUserRoleExists.id,
					file_name: file.originalname,
					modified_name: modifiedFileName,
					document_type: documentType,
					key: uploadResponse.key,
					entered_date: body[file.originalname]
				}

				await UserUploads.upsert(obj);

				return `${AWS_FILE_UPLOAD_LINK}/${uploadResponse.key}`;
			}
		}
	}

	async getProfileImageLink(
		user_id: number,
		role_id: number,
		fileName: string
	) {
		// const roleName = await this.getRoleDetails(role_id);
		const key = `${secretes["AWS_FILE_UPLOAD_LINK"]}/user_documents/user_${user_id}/profile_picture/${fileName}`
		return key;
	}
	private async updateUserProfilePhoto(user_id: number, filepath: string, isUpdated: boolean) {

		const updateUser = Users.update(
			{
				new_profile_image: filepath,
				profile_image_verify: 0,
				image_status_code: isUpdated ? StatusCode.Unverified_edit : StatusCode.Unverified_new
			},
			{
				where: {
					id: user_id,
				},
			}
		);

		return updateUser;
	}
	private async getRoleDetails(role_id: number) {
		const roleDetails: any = await Roles.findOne({
			where: {
				id: role_id,
			},
		});

		if (!roleDetails) {
			throw new NotFoundError("Could not get role details");
		}
		return roleDetails.role;
	}

	async deleteFile(user_id: number, role_id: number, fileName: string) {
		const isUserRoleExists = await new UserRoleService().isUserRoleExists(user_id, role_id);
		if (isUserRoleExists) {

			const fileEntry: any = await UserUploads.findOne({
				where: {
					user_role_id: isUserRoleExists.id,
					modified_name: fileName
				}
			});

			if (fileEntry) {
				const roleName = await this.getRoleDetails(role_id);
				const key = `${roleName}/${user_id}/${fileEntry.modified_name}`

				const deletedFile = await Utils.deleteFile(key);

				if (deletedFile) {
					UserUploads.destroy({
						where: {
							user_role_id: isUserRoleExists.id,
							modified_name: fileEntry.modified_name
						}
					})
				}

				return deletedFile;
			} else {
				throw new BadRequestError("No file found");
			}
		}
	}

	async getDocuments(user_id: number, role_id: number, document_type?: string, upload_date?: string) {
		const dateFilter = upload_date ? {
			[Op.and]: [Sequelize.where(
				Sequelize.fn("date", Sequelize.col("createdAt")),
				"=",
				upload_date
			)]
		} : {};

		Roles.hasOne(UserRole, { foreignKey: 'role_id' });
		UserRole.belongsTo(Roles, { foreignKey: 'role_id' })

		UserRole.hasOne(UserUploads, { foreignKey: "user_role_id" })
		UserUploads.belongsTo(UserRole, { foreignKey: "user_role_id" })

		const docFilter = document_type ? { document_type: document_type } : {}
		const data = await Roles.findAll({
			include: [{
				model: UserRole,
				required: true,
				include: [{
					model: UserUploads,
					attributes: [],
					required: true,
					where: { ...docFilter, ...dateFilter }
				}],
				where: {
					user_id: user_id,
					role_id: role_id,
				},
				attributes: []
			}],
			attributes: [
				[fn("CONCAT", `${AWS_FILE_UPLOAD_LINK}/user_documents`, `/user_${user_id}/`, col("role"), "/", col("modified_name")), "file_link"],
				[fn("", col("file_name")), "original_name"],
				[fn("", col("modified_name")), "modified_name"],
				[fn("", col("createdAt")), "createdAt"],
				[fn("", col("updatedAt")), "updatedAt"],
				[fn("", col("document_type")), "document_type"],
				[fn("", col("entered_date")), "entered_date"]
			],
			raw: true
		});

		return data;
	}

	async uploadContractDocument(files: any[], workplace_id: number, role_id: number, document_type: string, body: any) {
		let arr = [];
		let promiseArray = [];
		let workplace_type = Utils.getRoleById(role_id);
		for (let i = 0; i < files.length; i++) {
			promiseArray.push(this.processContractDocument(files[i], workplace_id, role_id, document_type, workplace_type, body));
		}

		return Promise.all(promiseArray);

	}

	private async processContractDocument(file: any, workplace_id: number, role_id: number, document_type: string, workplace_type: string, body: any) {
		const modifiedFileName = this.getModifiedFileName(file.originalname);
		const key = `workplace_documents/${workplace_type}/workplace_${workplace_id}/${modifiedFileName}`
		const uploadResponse = await Utils.uploadFile(file, key);

		if (uploadResponse) {
			await WorkplaceUploads.upsert({
				workplace_id: workplace_id,
				role_id: role_id,
				file_name: file.originalname,
				modified_name: modifiedFileName,
				key: uploadResponse.key,
				document_type: document_type,
				entered_date: body[file.originalname]
			});
			return { file_name: file.originalname, url: `${AWS_FILE_UPLOAD_LINK}/${key}` }

		}
	}

	private getModifiedFileName(files: string) {
		const splitArr = files.split(".");
		const file = splitArr[0].split(" ").join("_"); // replace all blank spaces with "_"
		const extention = splitArr[splitArr.length - 1];
		return `${file}${new Date().getTime()}.${extention}`;
	}

	async getDoc(workplace_id: number, role_id: number, document_type: string) {

		if (role_id === RolesEnum.Pharmacy) {
			PharmacyWorkplaces.hasOne(WorkplaceUploads, { foreignKey: 'workplace_id' });
			WorkplaceUploads.belongsTo(PharmacyWorkplaces, { foreignKey: 'workplace_id' });
		}
		if (role_id === RolesEnum.Laboratory) {
			LabWorkplaces.hasOne(WorkplaceUploads, { foreignKey: 'workplace_id' });
			WorkplaceUploads.belongsTo(LabWorkplaces, { foreignKey: 'workplace_id' });
		}
		return WorkplaceUploads.findAll({
			include: [{
				model: role_id === RolesEnum.Pharmacy ? PharmacyWorkplaces : LabWorkplaces,
				required: true,
				attributes: []
			}],
			attributes: [
				"*",
				[fn("", col("workplace_name")), "workplace_name"],
				[fn("CONCAT", `${AWS_FILE_UPLOAD_LINK}/`, col("key")), "key"]
			],
			where: {
				workplace_id: workplace_id,
				role_id: role_id
			},
			raw: true
		})
	}

	async uploadScannedDocuments(files: any[], fileInfo: any) {
		const promiseArray = [];
		fileInfo.group_id = v4();
		for (let index = 0; index < files.length; index++) {
			promiseArray.push(this.processScannedDocument(files[index], fileInfo));

		}
		return Promise.all(promiseArray);
	}

	private async processScannedDocument(file: any, fileInfo: any) {
		const modifiedName = this.getModifiedFileName(file.originalname);
		let key = `user_documents/user_${fileInfo.user_id}/scanned_documents/${modifiedName}`;
		const uploadResponse = await Utils.uploadFile(file, key);
		if (!!uploadResponse) {
			UserScannedDocument.upsert({
				...fileInfo,
				key: key,
				modified_name: modifiedName,
				original_file_name: file.originalname
			});
			return { file_name: file.originalname, url: `${AWS_FILE_UPLOAD_LINK}/${uploadResponse.key}` };
		}
	}

	async getScannedDocuments(user_id: number, medical_record_date?: string) {
		const dateFilter = medical_record_date ? {

			[Op.and]: [Sequelize.where(
				Sequelize.fn("date", Sequelize.col("user_scanned_documents.createdAt")),
				"=",
				medical_record_date
			)]
		} : {};

		Users.hasOne(UserScannedDocument, { foreignKey: 'user_id' });
		UserScannedDocument.belongsTo(Users, { foreignKey: 'user_id' });

		const data = await UserScannedDocument.findAll({
			include: [{
				model: Users,
				required: true,
				attributes: []
			}],
			where: {
				user_id: user_id,
				...dateFilter
			},
			attributes: [
				["id", "scanned_doc_id"],
				"file_name",
				"user_id",
				"medical_record_date",
				[fn("CONCAT", `${AWS_FILE_UPLOAD_LINK}/`, col("key")), "link"],
				[
					fn("CONCAT", col("first_name"), " ", col("last_name")), "name"
				],
				"group_id",
				"createdAt"
			],
			raw: true,
			order: [["createdAt", "DESC"]]
		});

		return data.reduce((output: any[], currentItem: any) => {

			let isExists = output.find(x => x.group_id == currentItem.group_id);

			if (isExists) {
				isExists.files.push(currentItem);
				return output;
			}

			const scanInfo = {
				group_id: currentItem.group_id,
				file_name: currentItem.file_name,
				upload_date: moment(currentItem.createdAt).format('YYYY-MM-DD'),
				medical_record_date: currentItem.medical_record_date,
				files: [currentItem]
			};
			output.push(scanInfo)

			return output;
		}, []);
	}

	async uploadLabTestReport(file: any, user_id: number, prescribed_order_id: number, lab_test_id: number) {

		const modifiedFileName = this.getModifiedFileName(file.originalname);
		let key = `user_documents/user_${user_id}/lab_reports/${modifiedFileName}`;
		let uploadResponse = await Utils.uploadFile(file, key);

		if (uploadResponse) {
			await TemporaryLabTests.update({
				lab_test_report: uploadResponse.key,
				report_name: file.originalname
			}, {
				where: {
					temporary_patient_order_lab_id: prescribed_order_id,
					lab_test_id: lab_test_id
				}
			});

			return { file: file.originalname, link: `${AWS_FILE_UPLOAD_LINK}/${uploadResponse.key}` }
		}

	}


	async processPDF(filePath: any, user_id: number, isForSave: boolean = true) {
		const fileContent = fs.readFileSync(filePath);
		let fileName = path.basename(filePath);
		let data = await this.processPdfUpload(fileContent, fileName, user_id, isForSave);

		fs.unlink(filePath, (err) => {
			if (err) {
				throw err;
			}
			console.log("File is deleted.");
		});

		return data;

	}


	async processPdfUpload(file: any, fileName: string, user_id: number, isForSave: boolean = true) {

		const modifiedFileName = this.getModifiedFileName(fileName);
		// const key = `${roleName}/user_${user_id}/${modifiedFileName}`;
		const key = `user_documents/user_${user_id}/prescription/${modifiedFileName}`
		const uploadResponse = await Utils.uploadFile(file, key, true);
		if (uploadResponse) {
			if (isForSave) {

				const isUserRoleExists = await new UserRoleService().isUserRoleExists(user_id, RolesEnum.Patient);

				const obj: any = {
					user_role_id: isUserRoleExists.id,
					file_name: fileName,
					modified_name: modifiedFileName,
					document_type: "prescription",
					key: uploadResponse.key
				}

				let updatedData: any = await UserUploads.create(obj);
				return { uploadId: updatedData.id, fileUrl: `${AWS_FILE_UPLOAD_LINK}/${uploadResponse.key}` };

			}
			else {
				return { uploadId: "", fileUrl: `${AWS_FILE_UPLOAD_LINK}/${uploadResponse.key}` };
			}
		}
		else {
			throw new Error("Unable to upload at s3 server.");
		}
	}
}
