import { Body, CurrentUser, Get, JsonController, Post, QueryParam, UploadedFile, UploadedFiles } from "routing-controllers";
import { documentType } from "../../constants/documentType.enum";
import { FileService } from "../../services/shared/file.service";

@JsonController('/file')
export class FileController {

    constructor(private fileSrv: FileService) { }

    /**
	 * method: Post
	 * url: serverUrl:Port/file/uploadProfile
	 * body: @type{@type{File} files, @type{number} role_id, @type{number} user_id} Formdata
	 * description: To upload files i.e profile_image on AWS server & store file name in Db.
	 */
    @Post('/uploadProfile')
    async uploadFile(@UploadedFiles("files") files: any[], @Body() body: any) {
        const { role_id, user_id, isImageUpdated = false } = body;
        const link = await this.fileSrv.uploadFile(files, user_id, role_id, "profileImage", Boolean(isImageUpdated));
        return link[0];
    }

     /**
	 * method: Post
	 * url: serverUrl:Port/file/uploadDocuments
	 * body: @type{@type{File} files, @type{number} role_id, @type{number} user_id} Formdata
	 * description: To upload files i.e documents on AWS server & store file name in Db.
	 */
    @Post('/uploadDocuments')
    async uploadDocuments(@UploadedFiles("files") files: any[], @Body() body: any) {
        const { role_id, user_id, document_type = documentType.OTHER_DOCUMENT } = body;
        return this.fileSrv.uploadFile(files, user_id, role_id, "document", null, document_type.toLowerCase(), body);
    }

    /**
	 * method: Post
	 * url: serverUrl:Port/file/deleteFile
	 * body: @type{number} user_id, @type{number} role_id, @type{string} file_name
	 * description: To delete uploaded file from AWS server & on db.
	 */
    @Post('/deleteFile')
    async deleteFile(@Body() body: any) {

        const { user_id, role_id, modified_name } = body;

        const deleted = await this.fileSrv.deleteFile(user_id, role_id, modified_name);
        return deleted;
    }

    @Get('/getDocuments')
    async getDocuments(@CurrentUser() user: any, @QueryParam("user_id") user_id: number, @QueryParam("role_id") role_id: number, @QueryParam("document_type") type: string, @QueryParam("upload_date") upload_date: string) {
        const userId = user_id ? user_id : user.id
        const roleId = role_id ? role_id : user.role_id;
        return this.fileSrv.getDocuments(userId, roleId, type, upload_date);
    }

    @Post('/uploadWorkplaceDocument')
    async uploadContractDoc(@UploadedFiles("files") files: any[], @Body() body: any) {
        const { workplace_id, role_id, document_type = "contract_info" } = body;
        return this.fileSrv.uploadContractDocument(files, workplace_id, role_id, document_type, body);
    }

    @Get('/getWorkplaceDocument')
    get(@QueryParam("workplace_id", { required: true }) workplace_id: number, @QueryParam("role_id", { required: true }) role_id: number, @QueryParam("document_type") doctype: string) {
        return this.fileSrv.getDoc(workplace_id, role_id, doctype);
    }

    @Post('/uploadScannedDocument')
    async uploadScannedDocument(@UploadedFiles("files") files: any[], @Body() body: any) {
        return this.fileSrv.uploadScannedDocuments(files, body);
    }

    @Get('/getScannedDocuments')
    async getScannedDocuments(@QueryParam("user_id", { required: true }) user_id: number, @QueryParam("upload_date") upload_date: string) {
        return this.fileSrv.getScannedDocuments(user_id, upload_date);
    }

    @Post('/uploadLabReport')
    async uploadLabReport(@UploadedFile("files") files: any[], @Body() body: any) {
        const { user_id, prescribed_order_id, lab_test_id } = body;
        return this.fileSrv.uploadLabTestReport(files, user_id, prescribed_order_id, lab_test_id);
    }

}